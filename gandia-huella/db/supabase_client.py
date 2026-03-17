"""
supabase_client.py — usa requests directo a la REST API de Supabase.
Sin supabase-py, sin conflictos de httpx/gotrue.
"""

import os
import json
import logging
import numpy as np
import requests
from dotenv import load_dotenv

load_dotenv()

log = logging.getLogger("gandia.db")

_NEW_EMBEDDINGS_SINCE_RETRAIN = 0
RETRAIN_THRESHOLD = 20


class SupabaseClient:

    def __init__(self):
        self.url = os.getenv("SUPABASE_URL", "").rstrip("/")
        self.key = os.getenv("SUPABASE_SERVICE_KEY", "")
        if not self.url or not self.key:
            raise RuntimeError("SUPABASE_URL y SUPABASE_SERVICE_KEY son requeridos")
        self.headers = {
            "apikey":        self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type":  "application/json",
            "Prefer":        "return=representation",
        }
        log.info("Supabase conectado: %s", self.url)

    def _rest(self, path: str) -> str:
        return f"{self.url}/rest/v1/{path}"

    def _rpc(self, fn: str) -> str:
        return f"{self.url}/rest/v1/rpc/{fn}"

    # ─── Búsqueda fingerprint clásico ────────────────────────────────────────

    def search_fingerprints(self, fp_vector: list, rancho_id: str, top_k: int = 5) -> list:
        try:
            r = requests.get(
                self._rest("biometria_embeddings"),
                headers=self.headers,
                params={
                    "select":    "animal_id,fp_features,animales(nombre,siniiga)",
                    "rancho_id": f"eq.{rancho_id}",
                    "activo":    "eq.true",
                },
                timeout=10,
            )
            r.raise_for_status()
            rows = r.json()
        except Exception as e:
            log.error("Error buscando fingerprints: %s", e)
            return []

        query   = np.array(fp_vector, dtype=np.float32)
        results = []

        for row in rows:
            try:
                fp = row.get("fp_features")
                if not fp:
                    continue
                ref   = np.array(fp if isinstance(fp, list) else json.loads(fp), dtype=np.float32)
                norm  = np.linalg.norm(query) * np.linalg.norm(ref) + 1e-8
                score = float(np.dot(query, ref) / norm)
                animal = row.get("animales") or {}
                if isinstance(animal, list):
                    animal = animal[0] if animal else {}
                results.append({
                    "animal_id":      row["animal_id"],
                    "score":          max(0.0, min(1.0, score)),
                    "animal_nombre":  animal.get("nombre"),
                    "animal_siniiga": animal.get("siniiga"),
                })
            except Exception as e:
                log.warning("Error procesando fila: %s", e)

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    # ─── Búsqueda embedding pgvector ─────────────────────────────────────────

    def search_embeddings(self, emb_vector: list, rancho_id: str, top_k: int = 5) -> list:
        # pgvector necesita el vector como string "[0.1,0.2,...]"
        vec_str = "[" + ",".join(f"{v:.6f}" for v in emb_vector) + "]"
        try:
            r = requests.post(
                self._rpc("search_embeddings_by_rancho"),
                headers=self.headers,
                json={
                    "query_vector": vec_str,
                    "p_rancho_id":  rancho_id,
                    "p_top_k":      top_k,
                },
                timeout=10,
            )
            r.raise_for_status()
            rows = r.json()
            log.info("pgvector rows: %d | first: %s", len(rows), rows[0] if rows else "vacío")
        except Exception as e:
            log.error("Error en búsqueda pgvector: %s", e)
            return []

        return [
            {
                "animal_id":      row["animal_id"],
                "score":          max(0.0, min(1.0, 1.0 - row["distance"] / 2.0)),
                "animal_nombre":  row.get("nombre"),
                "animal_siniiga": row.get("siniiga"),
            }
            for row in rows
        ]

    # ─── Guardar huella de referencia ────────────────────────────────────────

    def save_reference(self, animal_id, rancho_id, fp_vector, emb_vector, emb_raw, calidad, modo):
        global _NEW_EMBEDDINGS_SINCE_RETRAIN
        try:
            # Desactivar embedding anterior
            requests.patch(
                self._rest("biometria_embeddings"),
                headers=self.headers,
                params={"animal_id": f"eq.{animal_id}", "activo": "eq.true"},
                json={"activo": False},
                timeout=10,
            )
            vec_str = "[" + ",".join(f"{v:.6f}" for v in emb_vector) + "]"
            r2 = requests.post(
                self._rest("biometria_embeddings"),
                headers=self.headers,
                json={
                    "animal_id":        animal_id,
                    "rancho_id":        rancho_id,
                    "fp_features":      fp_vector,
                    "embedding_vector": vec_str,
                    "embedding_raw":    emb_raw,
                    "calidad":          round(calidad, 4),
                    "modo":             modo,
                    "activo":           True,
                    "subido_por":       animal_id,
                    "imagen_path":      f"captures/{animal_id}",
                },
                timeout=10,
            )
            if r2.status_code >= 400:
                log.error("Supabase insert error %s: %s", r2.status_code, r2.text)
                r2.raise_for_status()
            _NEW_EMBEDDINGS_SINCE_RETRAIN += 1
            log.info("Huella guardada para animal %s", animal_id)
        except Exception as e:
            log.error("Error guardando huella: %s", e)
            raise

    # ─── PCA helpers ─────────────────────────────────────────────────────────

    def should_retrain_pca(self) -> bool:
        return _NEW_EMBEDDINGS_SINCE_RETRAIN >= RETRAIN_THRESHOLD

    def get_all_raw_embeddings(self, rancho_id: str) -> list:
        try:
            r = requests.get(
                self._rest("biometria_embeddings"),
                headers=self.headers,
                params={
                    "select":    "embedding_raw",
                    "rancho_id": f"eq.{rancho_id}",
                    "activo":    "eq.true",
                },
                timeout=10,
            )
            r.raise_for_status()
            return [row["embedding_raw"] for row in r.json() if row.get("embedding_raw")]
        except Exception as e:
            log.error("Error obteniendo embeddings crudos: %s", e)
            return []

    def get_all_embedding_records(self, rancho_id: str) -> list:
        try:
            r = requests.get(
                self._rest("biometria_embeddings"),
                headers=self.headers,
                params={
                    "select":    "animal_id,imagen_path,modo",
                    "rancho_id": f"eq.{rancho_id}",
                    "activo":    "eq.true",
                },
                timeout=10,
            )
            r.raise_for_status()
            return r.json()
        except Exception as e:
            log.error("Error obteniendo registros: %s", e)
            return []