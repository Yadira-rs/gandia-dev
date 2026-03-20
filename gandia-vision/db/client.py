"""
db/client.py
Singleton del cliente Supabase para todo el backend.
"""

from functools import lru_cache
from supabase import create_client, Client
from config.settings import settings


@lru_cache()
def get_supabase() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_key)


# Exportar instancia directa para uso simple
db: Client = get_supabase()
