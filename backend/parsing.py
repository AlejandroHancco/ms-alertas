# -*- coding: utf-8 -*-
"""Normalización de columnas para importar inventarios (CSV/XLSX) y mapear
suscripción -> cliente."""
import datetime
import re
import unicodedata


def norm(s):
    """minúsculas, sin tildes ni separadores (espacios, _, -, .)."""
    if s is None:
        return ""
    s = unicodedata.normalize("NFKD", str(s))
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    return re.sub(r"[\s_\-\.]+", "", s)


# Sinónimos (ya normalizados) de cada columna, en orden de prioridad.
SUB_NAME = ["subscriptionname", "suscripcion", "subscription"]
SUB_ID = ["subscriptionid", "suscriptionid"]
RG = ["grupoderecurso", "grupoderecursos", "resourcegroup", "resourcegroups"]
RES = ["nombredelrecurso", "resourcename", "recursoafectado", "recursoasociado",
       "functionappname", "appservicename", "storageaccountname", "keyvaultname",
       "databricksname", "servername", "storageaccount", "workspace", "vmname",
       "account", "recurso", "name", "nombre"]
GESTOR = ["gestor"]
ESTADO = ["estado", "status", "estado2"]

# Un estado que contenga alguna de estas palabras marca el recurso como revisado al importar.
DONE_WORDS = ["completado", "completo", "migrado", "migrada", "cerrado", "finalizado",
              "ok", "resuelto", "hecho", "aplicado", "revisado", "done"]


def match_col(hn, cands, loose=True):
    """Índice de la primera columna (normalizada) que coincide con algún candidato."""
    for c in cands:
        for i, h in enumerate(hn):
            if h == c:
                return i
    if loose:
        for c in cands:
            for i, h in enumerate(hn):
                if c in h and len(h) - len(c) <= 4:
                    return i
    return None


def to_str(v):
    if v is None:
        return ""
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.strftime("%Y-%m-%d")
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v).strip()


def header_row(rows):
    """Primera fila (de las 8 primeras) con al menos 2 celdas: la cabecera."""
    for i, r in enumerate(rows[:8]):
        if len([c for c in r if c not in (None, "")]) >= 2:
            return i
    return 0


def cliente_de(name, sid, by_name, by_id):
    """Cliente de una suscripción (por nombre normalizado o por id)."""
    c = by_name.get(norm(name)) or by_id.get((sid or "").strip().lower())
    if c:
        return c
    nl = (name or "").lower()
    if "g&s" in nl or "g and s" in nl or nl.startswith("azure g"):
        return "G&S (interno)"
    return ""
