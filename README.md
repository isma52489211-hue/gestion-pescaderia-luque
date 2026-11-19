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

En «Dictar o pegar género», usa el micrófono del teclado o pega una lista. Puedes dictar varias referencias de corrido. Por ejemplo, «boquerones gordos cinco kilos a seis euros, dos kilos de pijota a nueve euros». Si empiezas una referencia por los kilos, usa «de» antes del producto. «Bocalaíllo mediano» corresponde a Bacaladillas y «boquerón gordo» a Boquerón grande. Si falta el precio, la revisión propone el del último día cuando existe. Revisa las cantidades y los precios antes de guardar la selección. Los productos repetidos o con números de más requieren revisión manual.

## Cómo se revisa un cierre

En **Día → Género** se anota el fondo y el género de apertura. **Coste de compra por lote** admite cajas y precio por caja, peso neto total y kilos recibidos en Luque. El último dato permite asignar el coste de la compra a la tienda. El margen puede quedar pendiente con la caja completa.

En **Cierre**, cada referencia activa necesita un recuento final. Escribir 0 confirma que está agotada. **Movimientos y cambios de precio** registra entradas, pescado tirado, traslados con destino y cambios de PVP. Al cambiar de precio se pesa lo que queda. La hora y el orden dentro del minuto sitúan cada movimiento en el tramo correcto, aunque se registre más tarde.

El efectivo de ventas es el cajón contado menos el fondo inicial, más gastos y retiradas previas, menos entradas de dinero ajenas a ventas. Se suman tarjeta y Bizum. El fondo que se aparta para mañana se informa por separado.

**Cuadre** muestra previsto, cobrado, diferencia inicial y cantidad sin explicar. Un cierre completo se puede guardar con una diferencia. Una justificación requiere importe firmado y referencia al comprobante. Para corregir kilos, precios o caja se reabre el día con un motivo. Se conserva un registro con los valores antes y después.

El resumen mensual separa jornadas abiertas, cierres verificables y cierres antiguos que carecen de los datos necesarios para reconstruir su previsto. Los datos se guardan en este dispositivo. Se pueden trasladar a otro con **Productos → Descargar copia / Restaurar copia**.

## Piloto de Luque

Descarga [Luque_piloto.html](piloto/Luque_piloto.html) para abrir la candidata en Chrome. La rama también se puede servir como web estática o empaquetar en un único HTML con Python 3. El archivo incluye los recursos de la app y usa almacenamiento separado para el piloto. Para recuperar jornadas entre cierres, usa el mismo archivo y navegador o restaura una copia exportada del piloto.

```sh
python3 herramientas/piloto.py Luque_piloto.html
```

Para repetir las comprobaciones con datos simulados:

```sh
node --test pruebas/cierre.test.cjs
python3 -m http.server 8000 --bind 127.0.0.1
```

Abre `http://127.0.0.1:8000/pruebas/mostrador.html` y pulsa **Ejecutar pruebas**. Muestra los resultados de cada recorrido en una ventana de 390 px. Las pruebas aíslan su almacenamiento del catálogo y las jornadas de la app. Para verificar además el modo sin red y el archivo portátil con Chromium, ejecuta `python pruebas/movil.py` con Playwright y Chrome o Chromium instalados.
