# -*- coding: utf-8 -*-
"""Dashboard (Inicio): del equipo o del miembro (comunicados donde es 'responsable').

Todos los conteos de recursos, % y estados salen SOLO del último lote de cada
comunicado (vista recursos_ult); los lotes anteriores son historial."""
from . import db

# Comunicados en alcance (todos o los de un responsable) y sus recursos del último lote.
_CTE = """WITH co AS (SELECT * FROM comunicados WHERE %(resp)s::text IS NULL OR responsable = %(resp)s),
               rec AS (SELECT r.* FROM recursos_ult r JOIN co ON co.id = r.comunicado_id) """

_LISTA = """SELECT co.id, co.n, co.titulo, co.categoria, co.fecha_limite,
              COUNT(rec.id) AS n_recursos, COUNT(rec.id) FILTER (WHERE rec.revisado=1) AS n_revisados
            FROM co LEFT JOIN rec ON rec.comunicado_id = co.id
            WHERE co.fecha_limite IS NOT NULL AND co.fecha_limite {op} %(hoy)s
            GROUP BY co.id, co.n, co.titulo, co.categoria, co.fecha_limite
            ORDER BY co.fecha_limite, co.id LIMIT {lim}"""


def stats(responsable=None):
    """Sin responsable: dashboard del equipo. Con responsable: el del miembro."""
    hoy = db.today()
    p = {"resp": responsable, "hoy": hoy}
    with db.tx() as con:
        def q(sql):
            return con.execute(_CTE + sql, p).fetchall()

        tot = q("""SELECT (SELECT COUNT(*) FROM co) AS com,
                          (SELECT COUNT(*) FROM rec) AS rec,
                          (SELECT COUNT(*) FROM rec WHERE revisado=1) AS rev,
                          (SELECT COUNT(DISTINCT comunicado_id) FROM rec) AS com_con,
                          (SELECT COUNT(*) FROM co WHERE fecha_limite IS NOT NULL AND fecha_limite < %(hoy)s) AS venc""")[0]
        por_cat = q("""SELECT COALESCE(NULLIF(co.categoria,''),'Sin categoría') AS categoria,
                              COUNT(DISTINCT co.id) AS comunicados, COUNT(rec.id) AS recursos,
                              COALESCE(SUM(rec.revisado),0) AS revisados
                       FROM co LEFT JOIN rec ON rec.comunicado_id=co.id
                       GROUP BY 1 ORDER BY recursos DESC""")
        prox = q(_LISTA.format(op=">=", lim=8))
        vencidos_list = q(_LISTA.format(op="<", lim=10))

        com_estado = {"sin_recursos": 0, "sin_revisar": 0, "en_progreso": 0, "completado": 0}
        for r in q("""SELECT COUNT(rec.id) AS n_rec, COALESCE(SUM(rec.revisado),0) AS n_rev
                      FROM co LEFT JOIN rec ON rec.comunicado_id=co.id GROUP BY co.id"""):
            nr, nv = r["n_rec"], r["n_rev"]
            if nr == 0:
                com_estado["sin_recursos"] += 1
            elif nv >= nr:
                com_estado["completado"] += 1
            elif nv == 0:
                com_estado["sin_revisar"] += 1
            else:
                com_estado["en_progreso"] += 1

        cli_rows = q("""SELECT cliente, COUNT(*) AS recursos, COALESCE(SUM(revisado),0) AS revisados
                        FROM rec WHERE COALESCE(cliente,'')<>'' GROUP BY cliente ORDER BY recursos DESC""")

        if responsable is None:   # solo en el dashboard del equipo
            por_sub = q("""SELECT COALESCE(NULLIF(suscripcion,''),'(sin suscripción)') AS suscripcion,
                                  COUNT(*) AS recursos, SUM(revisado) AS revisados
                           FROM rec GROUP BY 1 ORDER BY recursos DESC LIMIT 12""")
            venc_cli = {r["cliente"] for r in q("""SELECT DISTINCT rec.cliente FROM rec JOIN co ON co.id=rec.comunicado_id
                              WHERE COALESCE(rec.cliente,'')<>'' AND co.fecha_limite IS NOT NULL AND co.fecha_limite < %(hoy)s""")}

    totales = {"comunicados": tot["com"], "recursos": tot["rec"], "revisados": tot["rev"],
               "pendientes": tot["rec"] - tot["rev"],
               "pct_revisado": round(tot["rev"] * 100 / tot["rec"], 1) if tot["rec"] else 0,
               "vencidos": tot["venc"]}
    out = {"hoy": hoy, "totales": totales, "por_categoria": por_cat, "proximos": prox,
           "vencidos_list": vencidos_list, "com_estado": com_estado,
           "clientes_top": cli_rows[:10], "clientes_afectados": len(cli_rows)}
    if responsable is not None:
        out["responsable"] = responsable
        return out

    for r in cli_rows:
        r["pendientes"] = r["recursos"] - r["revisados"]
        r["vencido"] = 1 if r["cliente"] in venc_cli else 0
    totales["com_con_recursos"] = tot["com_con"]
    out.update(por_suscripcion=por_sub,
               clientes_riesgo=sorted((r for r in cli_rows if r["pendientes"] > 0),
                                      key=lambda r: (r["vencido"], r["pendientes"]), reverse=True)[:8])
    return out
