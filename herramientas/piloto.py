"""Genera una copia transportable del mismo cierre, con recursos y almacenamiento de piloto aislados."""
import base64
import json
import mimetypes
from pathlib import Path
import re
import sys

RAIZ = Path(__file__).resolve().parents[1]


def recurso(ruta):
    fichero = RAIZ / ruta
    mime = mimetypes.guess_type(fichero.name)[0] or "application/octet-stream"
    return "data:" + mime + ";base64," + base64.b64encode(fichero.read_bytes()).decode("ascii")


def generar():
    html = (RAIZ / "index.html").read_text()
    html = html.replace('<html lang="es">', '<html lang="es" data-piloto>')
    html = html.replace('<title>Caja Luque', '<title>Piloto · Caja Luque')
    html = re.sub(r'^.*<link[^\n]+(?:manifest|https://fonts\.)[^\n]*\n', '', html, flags=re.M)
    html = html.replace('<link rel="stylesheet" href="styles.css">', '<style>' + (RAIZ / "styles.css").read_text() + '</style>')
    iconos = {i.stem: recurso(i.relative_to(RAIZ)) for i in (RAIZ / "assets/iconos").glob("*.svg")}
    for nombre in ("motor-cierre", "app"):
        js = (RAIZ / (nombre + ".js")).read_text()
        if nombre == "app":
            js = 'const iconosPiloto = ' + json.dumps(iconos) + ';\n' + js
            js = js.replace('assets/iconos/${TIPOS[tipo].icono}.svg', '${iconosPiloto[TIPOS[tipo].icono]}')
        js = js.replace('</script', '<\\/script')
        html = html.replace('<script src="' + nombre + '.js"></script>', '<script>\n' + js + '\n</script>')
    html = re.sub(r'assets/[\w-]+\.png', lambda m: recurso(m.group()), html)
    html = html.replace('TIENDA DE LUQUE', 'PILOTO · LUQUE').replace('Tienda de Luque', 'Piloto · Luque')
    if 'data-piloto' not in html.split('<head>')[0]:
        raise RuntimeError("La versión portátil debe usar almacenamiento independiente.")
    return html


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Uso: python3 herramientas/piloto.py ruta/Luque_piloto.html")
    Path(sys.argv[1]).write_text(generar(), encoding="utf-8")
