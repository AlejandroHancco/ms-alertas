# -*- coding: utf-8 -*-
"""
Plataforma de Comunicados (Upgrade MS) · servidor web.

Flask (API en backend/) + frontend estático en static/. En producción corre con
waitress (servidor WSGI multihilo), igual en local que en Azure App Service.

Uso:  python app.py          -> http://localhost:8765
      python app.py 9000     -> otro puerto
En Azure App Service se usa $PORT y se escucha en 0.0.0.0.
"""
import os
import sys

from flask import Flask, send_from_directory

from backend import db
from backend.api import bp as api_bp

HERE = os.path.dirname(os.path.abspath(__file__))
STATIC = os.path.join(HERE, "static")


def create_app():
    db.ensure_schema(admin_correo=os.environ.get("ADMIN_CORREO") or "alejandro.hancco@gestionysistemas.com")
    app = Flask(__name__, static_folder=None)
    app.json.ensure_ascii = False
    app.json.sort_keys = False
    app.register_blueprint(api_bp)

    @app.get("/", defaults={"path": ""})
    @app.get("/<path:path>")
    def spa(path):
        # Archivo real dentro de static/ -> se sirve; cualquier otra ruta -> index.html
        # (el router del cliente resuelve /comunicados, /clientes, ...).
        full = os.path.normpath(os.path.join(STATIC, path))
        if path and full.startswith(STATIC + os.sep) and os.path.isfile(full):
            return send_from_directory(STATIC, path)
        resp = send_from_directory(STATIC, "index.html")
        resp.headers["Cache-Control"] = "no-cache"
        return resp

    return app


app = create_app() if __name__ != "__main__" else None


if __name__ == "__main__":
    from waitress import serve

    on_azure = bool(os.environ.get("WEBSITE_SITE_NAME"))
    port = int(os.environ.get("PORT") or (sys.argv[1] if len(sys.argv) > 1 else 8765))
    host = "0.0.0.0" if on_azure or os.environ.get("PORT") else "127.0.0.1"
    print(f"Plataforma Upgrade MS  ->  http://{host}:{port}", flush=True)
    print("Ctrl+C para detener.", flush=True)
    # Azure termina el TLS en su frontal y reenvía X-Forwarded-Proto/For: waitress los
    # aplica para que la app sepa que es HTTPS (cookie de sesión con Secure).
    serve(create_app(), host=host, port=port, threads=int(os.environ.get("WEB_THREADS", "8")),
          trusted_proxy="*", trusted_proxy_headers={"x-forwarded-proto", "x-forwarded-for"},
          clear_untrusted_proxy_headers=True)
