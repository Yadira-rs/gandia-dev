"""
rfid/mqtt_listener.py
Escucha eventos RFID via MQTT y los encola en Celery.

Topic esperado: gandia/rfid/{rancho_id}/{corral_id}
Payload JSON:   {"arete": "MX123456", "tipo": "lectura", "lector_id": "L1"}
"""

import json
import paho.mqtt.client as mqtt
from loguru import logger
from config.settings import settings


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        logger.info(f"MQTT conectado a {settings.mqtt_broker}")
        client.subscribe(settings.mqtt_topic)
    else:
        logger.error(f"MQTT error de conexión: código {rc}")


def on_message(client, userdata, msg):
    try:
        topic_parts = msg.topic.split("/")
        # gandia/rfid/{rancho_id}/{corral_id}
        if len(topic_parts) < 4:
            logger.warning(f"Topic inválido: {msg.topic}")
            return

        rancho_id = topic_parts[2]
        corral_id = topic_parts[3]
        payload   = json.loads(msg.payload.decode())

        arete     = payload.get("arete")
        tipo      = payload.get("tipo", "lectura")
        lector_id = payload.get("lector_id")

        if not arete:
            logger.warning("Lectura MQTT sin arete, ignorando")
            return

        # Encolar en Celery
        from workers.task_rfid import procesar_lectura
        procesar_lectura.delay(
            arete     = arete,
            corral_id = corral_id,
            rancho_id = rancho_id,
            tipo      = tipo,
            fuente    = "mqtt",
            lector_id = lector_id,
        )
        logger.debug(f"RFID encolado: {arete} @ {corral_id}")

    except Exception as e:
        logger.error(f"Error procesando mensaje MQTT: {e}")


def start_mqtt_listener():
    client = mqtt.Client(client_id="gandia-vision-rfid")
    client.username_pw_set(settings.mqtt_user, settings.mqtt_password)
    client.on_connect = on_connect
    client.on_message = on_message

    client.connect(settings.mqtt_broker, settings.mqtt_port, keepalive=60)
    logger.info("Iniciando loop MQTT...")
    client.loop_forever()


if __name__ == "__main__":
    start_mqtt_listener()
