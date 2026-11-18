"""Recorrido en Chromium móvil. Ejecutar en una copia aislada: python pruebas/movil.py."""
import functools
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import shutil
import tempfile
import threading

from playwright.sync_api import sync_playwright, expect

RAIZ = Path(__file__).resolve().parents[1]


class Silencioso(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def pruebas():
    with tempfile.TemporaryDirectory() as temporal, sync_playwright() as pw:
        raiz = Path(temporal)
        for nombre in ("app.js", "index.html", "styles.css", "motor-cierre.js", "lector.js", "manifest.webmanifest", "sw.js"):
            shutil.copy(RAIZ / nombre, raiz / nombre)
        for nombre in ("assets", "pruebas"):
            shutil.copytree(RAIZ / nombre, raiz / nombre)
        from importlib.util import spec_from_file_location, module_from_spec
        spec = spec_from_file_location("piloto", RAIZ / "herramientas/piloto.py")
        piloto = module_from_spec(spec)
        spec.loader.exec_module(piloto)
        archivo = raiz / "Luque_piloto.html"
        archivo.write_text(piloto.generar())
        assert archivo.read_bytes() == (RAIZ / "piloto/Luque_piloto.html").read_bytes()
        servicio = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Silencioso, directory=raiz))
        threading.Thread(target=servicio.serve_forever, daemon=True).start()
        origen = f"http://127.0.0.1:{servicio.server_port}"
        chrome = shutil.which("google-chrome") or shutil.which("chromium")
        navegador = pw.chromium.launch(executable_path=chrome)
        try:
            contexto = navegador.new_context(viewport={"width":390,"height":844}, is_mobile=True, has_touch=True, locale="es-ES")
            pag = contexto.new_page()
            pag.goto(origen+"/pruebas/mostrador.html")
            pag.get_by_role("button",name="Ejecutar pruebas").click()
            expect(pag.locator("#estado")).to_have_attribute("data-terminado","ok",timeout=90000)
            print(pag.locator("#resultados").inner_text(),flush=True)
            pag.goto(origen)
            pag.evaluate("navigator.serviceWorker.ready")
            pag.wait_for_function("!!navigator.serviceWorker.controller")
            # Sin red ni siquiera para la navegación principal; usa la caché instalada.
            contexto.set_offline(True)
            pag.reload(wait_until="domcontentloaded")
            expect(pag.get_by_text("Hoy en Luque",exact=True)).to_be_visible()
            pag.get_by_role("button",name="Día",exact=True).click()
            pag.locator('[data-caja=fondo]').fill('150')
            pag.locator('[data-fresco=kg][data-id=merluza]').fill('5')
            pag.locator('[data-fresco=pvp][data-id=merluza]').fill('8')
            pag.locator('[data-paso="2"]').dispatch_event('click')
            pag.locator('[data-fresco=sobra][data-id=merluza]').fill('2')
            for k,v in {"contado":"154","tarjeta":"15","bizum":"5"}.items():
                pag.locator(f'[data-caja={k}]').fill(v)
            pag.on("dialog",lambda d:d.accept())
            pag.locator('#terminar-cierre').dispatch_event('click')
            expect(pag.get_by_role("heading",name="Cuadra al céntimo")).to_be_visible()
            pag.reload(wait_until="domcontentloaded")
            expect(pag.locator('#inicio-estado')).to_contain_text('Cuadra al céntimo')
            print("✓ Sin red: carga, cierre mixto de 24 € y nueva recarga con cajón cuadrado",flush=True)
            # El archivo que se entrega también funciona directamente desde el disco, sin servidor.
            portatil = contexto.new_page()
            portatil.goto(archivo.as_uri(),wait_until="load")
            expect(portatil.locator('#estado-offline')).to_contain_text('Piloto de Luque')
            portatil.get_by_role('button',name='Día',exact=True).click()
            portatil.locator('[data-caja=fondo]').fill('150')
            portatil.reload()
            portatil.get_by_role('button',name='Día',exact=True).click()
            expect(portatil.locator('[data-caja=fondo]')).to_have_value('150,00')
            assert portatil.evaluate("localStorage.getItem('gpl.estado.v3')") is None
            assert json.loads(portatil.evaluate("localStorage.getItem('gpl.piloto.estado.v3')"))["version"] == 3
            print("✓ Archivo piloto con origen file:// sin red y datos de piloto persistentes",flush=True)
        finally:
            navegador.close()
            servicio.shutdown()


if __name__ == "__main__":
    pruebas()
