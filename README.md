# Caja Luque · Pescaderías Adolfo

Aplicación web para controlar la caja de la tienda de Luque **a partir del género**: sabiendo lo que se lleva, lo que sobra y el precio de venta, calcula lo que debería haber en caja y lo compara con lo cobrado. Usa la identidad de Pescaderías Adolfo (azul `#22326A`, coral como acento, Lato y Source Code Pro).

## Pantallas

- **Inicio**: resultado del día (cuadra / faltan / sobran), cifras, gráfico de los últimos 7 días y avisos (cierres sin terminar, precios que faltan, congelado por reponer).
- **Día**, en tres pasos:
  1. **Género** (Ismael): kilos con los que empieza cada producto y precio del día. Los productos habituales salen arriba; buscador.
  2. **Cierre** (tienda): kilos que sobran, congelado que queda, retiradas y mermas, y caja. Al pulsar «Terminar cierre» los recuentos quedan bloqueados.
  3. **Cuadre**: lo vendido por producto y la diferencia con lo cobrado.
- **Congelado**: stock actual, lo que hay que reponer y lista para copiar o enviar por WhatsApp.
- **Resumen**: mes por días y por producto, con gráfico.
- **Productos**: catálogo editable, ajustes y copia de seguridad.

## Control

- **Cierre a ciegas** (activado por defecto): al cerrar no se ven los kilos del inicio ni lo que debería haber, y el cuadre solo aparece tras terminar el cierre.
- **Movimientos de género**: las salidas sin venta se registran con su tipo, cantidad, hora y, en los traslados, tienda de destino.
- **Teclado del mostrador**: teclado numérico grande en pantalla para móvil y tablet.

## Rellenar rápido (coste cero)

- **Plantilla imprimible** (botón «Imprimir plantilla» en el paso 1): hoja A4 con todos los productos numerados, una casilla por cifra (la coma ya impresa) y cuatro marcas negras en las esquinas.
- **Foto de la plantilla** («Subir foto de la plantilla»): la app lee los números escritos a mano **sin internet y sin coste**. Con las cuatro marcas endereza la foto, recorta cada casilla y una red neuronal propia reconoce la cifra. La revisión enseña, encima de cada número, el recorte de lo escrito y marca en amarillo las cifras dudosas.
- **Lista pegada o dictada**: también se puede pegar o dictar («merluza 10 a 12,90, dorada 6 a 9,95»). La app reconoce los productos (singular o plural), los kilos y el precio.

### El lector de cifras

`assets/lector-cifras.json` es una red convolucional pequeña (conv 5×5 ×16 → conv 5×5 ×32 → 128 → 10, pesos int8, 109 KB) entrenada con las cifras manuscritas públicas de MNIST más variantes al estilo español (7 con rayita, 1 con palito). Acierta el 99,4 % de cifras de prueba que no vio al entrenar. `lector.js` contiene el diseño de la plantilla (compartido por la hoja impresa y la lectura), la detección de las marcas, la corrección de perspectiva y el cálculo de la red.

## Cómo se revisa un cierre

En **Día → Género** se anota el fondo y el género de apertura. **Coste de compra por lote** admite cajas y precio por caja, peso neto total y kilos recibidos en Luque. El último dato permite asignar el coste de la compra a la tienda. El margen puede quedar pendiente con la caja completa.

En **Cierre**, cada referencia activa necesita un recuento final. Escribir 0 confirma que está agotada. **Movimientos y cambios de precio** registra entradas, pescado tirado, traslados con destino y cambios de PVP. Al cambiar de precio se pesa lo que queda. La hora y el orden dentro del minuto sitúan cada movimiento en el tramo correcto, aunque se registre más tarde.

El efectivo de ventas es el cajón contado menos el fondo inicial, más gastos y retiradas previas, menos entradas de dinero ajenas a ventas. Se suman tarjeta y Bizum. El fondo que se aparta para mañana se informa por separado.

**Cuadre** muestra previsto, cobrado, diferencia inicial y cantidad sin explicar. Un cierre completo se puede guardar con una diferencia. Una justificación requiere importe firmado y referencia al comprobante. Para corregir kilos, precios o caja se reabre el día con un motivo. Se conserva un registro con los valores antes y después.

El resumen mensual separa jornadas abiertas, cierres verificables y cierres antiguos que carecen de los datos necesarios para reconstruir su previsto. Los datos se guardan en este dispositivo. Se pueden trasladar a otro con **Productos → Descargar copia / Restaurar copia**.

## Piloto de Luque

La rama de pruebas se puede servir como web estática o empaquetar en un único HTML con Python 3. El archivo lleva los recursos del lector de plantilla y usa almacenamiento separado para el piloto. Para recuperar jornadas entre cierres, usa el mismo archivo y navegador o restaura una copia exportada del piloto.

```sh
python3 herramientas/piloto.py Luque_piloto.html
```

Para repetir las comprobaciones con datos simulados:

```sh
node --test pruebas/cierre.test.cjs
python3 -m http.server 8000 --bind 127.0.0.1
```

Abre `http://127.0.0.1:8000/pruebas/mostrador.html` y pulsa **Ejecutar pruebas**. Muestra los resultados de cada recorrido en una ventana de 390 px. Las pruebas aíslan su almacenamiento del catálogo y las jornadas de la app. Para verificar además el modo sin red y el archivo portátil con Chromium, ejecuta `python pruebas/movil.py` con Playwright y Chrome o Chromium instalados.
