"""
fusion.py — Paso 6 del pipeline (MEJORADO)
- Ponderación por calidad de imagen
- score_final = 0.55 × score_cv + 0.45 × score_ia × quality_weight
Umbrales: ≥0.80 match | 0.40–0.79 candidato | <0.40 nuevo
"""

import os

WEIGHT_CV  = float(os.getenv("WEIGHT_CV",  "0.55"))
WEIGHT_IA  = float(os.getenv("WEIGHT_IA",  "0.45"))
MATCH_LOW  = float(os.getenv("MATCH_LOW",  "0.70"))
CANDIDATE  = float(os.getenv("CANDIDATE",  "0.40"))
TOP_K      = 3


def fuse_scores(
    candidatos_cv:    list[dict],
    candidatos_emb:   list[dict],
    calidad_imagen:   float = 1.0,
) -> list[dict]:
    """
    Fusiona scores CV + IA ponderando por calidad de imagen.
    Baja calidad → reducir confianza del motor IA.
    """
    # Factor de calidad: 0.5–1.0 (nunca penalizar demasiado)
    quality_weight = max(0.5, min(1.0, calidad_imagen * 1.5))

    scores: dict[str, dict] = {}

    for c in candidatos_cv:
        aid = c["animal_id"]
        if aid not in scores:
            scores[aid] = {
                "animal_id":      aid,
                "score_cv":       0.0,
                "score_ia":       0.0,
                "animal_nombre":  c.get("animal_nombre"),
                "animal_siniiga": c.get("animal_siniiga"),
            }
        scores[aid]["score_cv"] = c["score"]

    for c in candidatos_emb:
        aid = c["animal_id"]
        if aid not in scores:
            scores[aid] = {
                "animal_id":      aid,
                "score_cv":       0.0,
                "score_ia":       0.0,
                "animal_nombre":  c.get("animal_nombre"),
                "animal_siniiga": c.get("animal_siniiga"),
            }
        scores[aid]["score_ia"] = c["score"]

    results = []
    for aid, s in scores.items():
        # IA ponderada por calidad
        ia_weighted = s["score_ia"] * quality_weight
        s["score_final"] = round(WEIGHT_CV * s["score_cv"] + WEIGHT_IA * ia_weighted, 4)
        results.append(s)

    results.sort(key=lambda x: x["score_final"], reverse=True)
    return results


def decide_result(resultados: list[dict]) -> dict:
    if not resultados:
        return _nuevo()

    best = resultados[0]
    sf   = best["score_final"]

    if sf >= MATCH_LOW:
        return {
            "resultado":   "match",
            "animal_id":   best["animal_id"],
            "score_cv":    best["score_cv"],
            "score_ia":    best["score_ia"],
            "score_final": sf,
            "candidatos":  [],
        }

    if sf >= CANDIDATE:
        return {
            "resultado":   "candidato",
            "animal_id":   None,
            "score_cv":    best["score_cv"],
            "score_ia":    best["score_ia"],
            "score_final": sf,
            "candidatos":  [
                {
                    "animal_id":      c["animal_id"],
                    "animal_nombre":  c.get("animal_nombre"),
                    "animal_siniiga": c.get("animal_siniiga"),
                    "score_final":    c["score_final"],
                }
                for c in resultados[:TOP_K]
            ],
        }

    return _nuevo()


def _nuevo() -> dict:
    return {
        "resultado":   "nuevo",
        "animal_id":   None,
        "score_cv":    0.0,
        "score_ia":    0.0,
        "score_final": 0.0,
        "candidatos":  [],
    }