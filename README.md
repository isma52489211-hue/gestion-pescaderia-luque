# Gestión Pescadería Luque

Aplicación web para controlar la caja de la Pescadería Luque **a partir del género**: sabiendo lo que se lleva, lo que sobra y el precio de venta, calcula lo que debería haber en caja y lo compara con lo cobrado.

## Cómo funciona

1. **Inicio del día** (Ismael): kilos exactos con los que empieza cada producto fresco y pescado gordo, precio de venta del día (€/kg), unidades de congelado repuestas y fondo de caja.
2. **Cierre** (tienda): kilos que sobran de cada producto, unidades de congelado que quedan, efectivo contado (con contador de billetes y monedas), tarjeta, Bizum y gastos pagados de caja.
3. **Cuadre**: lo vendido por producto y la diferencia entre lo que debería haber y lo cobrado.

- Fresco: `kilos inicio − kilos que sobran = kilos vendidos` (con % de merma por producto si la tiene, p. ej. atún y cazón).
- Congelado: `stock + repuesto − quedan = unidades vendidas`. La pestaña **Congelado** muestra el stock actual y lo que hay que reponer.
- **Resumen** mensual por día y por producto. **Productos**: catálogo editable y copia de seguridad.

## Cómo usarla

Abre `index.html` en el navegador. De momento los datos se guardan en el propio dispositivo.
