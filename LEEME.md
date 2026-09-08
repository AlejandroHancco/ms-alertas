# Plataforma de Comunicados · Upgrade MS

Aplicación web local con base de datos para centralizar los comunicados de
Microsoft Azure, visualizar analíticas y llevar el control de revisión de los
recursos afectados (suscripción, grupo de recurso y nombre de recurso).

## Cómo iniciarla

Doble clic en **`Iniciar Plataforma.bat`**.
Se abre sola en el navegador (http://localhost:8765). Deja la ventana negra
abierta mientras la usas; ciérrala para apagar el servidor.

> Requisito: Python 3 instalado. No necesita internet ni instalar librerías
> (usa solo la librería estándar de Python + SQLite).

## Qué puedes hacer

- **Dashboard**: KPIs (comunicados, recursos, % revisado, pendientes, vencidos),
  gráfico donut de progreso, recursos por categoría, top de suscripciones y
  próximos vencimientos.
- **Comunicados**: buscar y filtrar; **añadir**, **editar** y **eliminar**
  comunicados; ver el avance de revisión de cada uno.
- **Ver recursos**: tabla con las 3 columnas obligatorias (Suscripción · Grupo
  de Recurso · Nombre del Recurso). Marca recursos como **revisados** uno por
  uno, o filtra por suscripción y usa **"Marcar visibles revisados"** para
  cerrar una suscripción completa. Exporta a CSV.

## Archivos

| Archivo | Qué es |
|---|---|
| `Iniciar Plataforma.bat` | Lanzador de un clic |
| `app.py` | Servidor + API REST (Python estándar) |
| `import_excel.py` | Importa los Excel a la base. `python import_excel.py --reset` reconstruye desde cero |
| `index.html` | La aplicación (dashboard) |
| `upgrade_ms.db` | Base de datos SQLite (aquí se guarda todo lo que edites) |

## Notas

- Los datos que edites (nuevos comunicados, revisiones) se guardan en
  `upgrade_ms.db`. **`--reset` borra esos cambios** y vuelve a leer los Excel;
  úsalo solo si quieres empezar de cero.
- Algunos comunicados no tienen archivo de detalle de recursos (avisos aún sin
  seguimiento); aparecen marcados como "Sin archivo de recursos".
- Al sembrar, los recursos cuyo estado en el Excel ya indicaba
  completado/migrado se marcan automáticamente como revisados.
