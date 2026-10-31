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
- **Retiradas y mermas**: género que sale sin venderse (lo que se lleva Ismael, o lo que se tira o se regala); no cuenta como venta.
- **Teclado del mostrador**: teclado numérico grande en pantalla para móvil y tablet.

## Rellenar rápido (coste cero)

- **Plantilla imprimible** (botón «Imprimir plantilla» en el paso 1): una hoja A4 con todos los productos numerados y casillas para kilos y €/kg.
- **Rellenar rápido**: se pega o se dicta la lista («merluza 10 a 12,90, dorada 6 a 9,95») o el texto copiado de una foto de la plantilla con Google Lens o el Texto en vivo del iPhone. La app reconoce los productos (singular o plural), los kilos y el precio, y enseña una revisión antes de pasarlo al día.

## Cálculos

- Fresco, gordo y marisco: `kilos inicio − sobra − retiradas/mermas = vendido`, menos el % de merma del producto si la tiene (salmón, atún).
- Congelado: `stock + repuesto − quedan − retiradas/mermas = vendido`, por unidades o a granel.
- Caja: `efectivo contado − fondo + gastos + tarjeta + Bizum = cobrado`.

## Cómo usarla

Abre `index.html` en el navegador. De momento los datos se guardan en el propio dispositivo.
