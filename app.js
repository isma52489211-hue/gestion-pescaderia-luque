// Gestión Pescadería Luque — caja diaria
// Todos los importes se guardan en céntimos (enteros) para evitar errores de redondeo.

const CLAVE = 'gpl.dias';
const DENOMINACIONES = [50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

const $ = (id) => document.getElementById(id);
const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

// ---------- Utilidades ----------

function fmt(cent) {
  return euros.format((cent || 0) / 100);
}

// Acepta "12,50", "12.50", "1.234,56" y devuelve céntimos
function aCentimos(texto) {
  if (texto == null) return 0;
  let t = String(texto).trim().replace(/\s|€/g, '');
  if (!t) return 0;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const n = Number(t);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function aTexto(cent) {
  if (!cent) return '';
  return (cent / 100).toFixed(2).replace('.', ',');
}

function hoyISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function sumarDias(iso, n) {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function fechaLarga(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function horaActual() {
  return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// ---------- Datos ----------

function cargar() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE)) || {};
  } catch {
    return {};
  }
}

function guardar(dias) {
  localStorage.setItem(CLAVE, JSON.stringify(dias));
}

let dias = cargar();

// Fondo sugerido: lo que se dejó para mañana en el último cierre anterior
function fondoSugerido(fecha) {
  const anteriores = Object.keys(dias).filter((f) => f < fecha && dias[f].cierre).sort();
  const ultimo = anteriores.pop();
  return ultimo ? dias[ultimo].cierre.fondoManana || 0 : 0;
}

function calcular(fondo, c) {
  const ventas = c.ventasEfectivo + c.ventasTarjeta + c.ventasBizum;
  const esperado = fondo + c.ventasEfectivo - c.gastos;
  const descuadre = c.contado - esperado;
  const retirada = c.contado - c.fondoManana;
  return { ventas, esperado, descuadre, retirada };
}

function claseDescuadre(cent) {
  if (cent === 0) return 'ok';
  return cent < 0 ? 'falta' : 'sobra';
}

function textoDescuadre(cent) {
  if (cent === 0) return 'Cuadra ✓';
  return (cent < 0 ? 'Falta ' : 'Sobra ') + fmt(Math.abs(cent));
}

// ---------- Vista: caja del día ----------

const campos = ['ventas-efectivo', 'ventas-tarjeta', 'ventas-bizum', 'gastos', 'contado', 'fondo-manana'];

function leerCierre() {
  return {
    ventasEfectivo: aCentimos($('ventas-efectivo').value),
    ventasTarjeta: aCentimos($('ventas-tarjeta').value),
    ventasBizum: aCentimos($('ventas-bizum').value),
    gastos: aCentimos($('gastos').value),
    contado: aCentimos($('contado').value),
    fondoManana: aCentimos($('fondo-manana').value),
    desglose: leerDesglose(),
    notas: $('notas').value.trim(),
  };
}

function rellenarCierre(c) {
  $('ventas-efectivo').value = aTexto(c.ventasEfectivo);
  $('ventas-tarjeta').value = aTexto(c.ventasTarjeta);
  $('ventas-bizum').value = aTexto(c.ventasBizum);
  $('gastos').value = aTexto(c.gastos);
  $('contado').value = aTexto(c.contado);
  $('fondo-manana').value = aTexto(c.fondoManana);
  $('notas').value = c.notas || '';
  escribirDesglose(c.desglose || {});
}

function construirDesglose() {
  $('desglose-filas').innerHTML = DENOMINACIONES.map((d) => `
    <label><span>${d >= 100 ? d / 100 + ' €' : d + ' c'}</span>
      <input type="number" min="0" step="1" inputmode="numeric" data-den="${d}" placeholder="0">
    </label>`).join('');
}

function leerDesglose() {
  const r = {};
  document.querySelectorAll('#desglose-filas input').forEach((i) => {
    const n = parseInt(i.value, 10);
    if (n > 0) r[i.dataset.den] = n;
  });
  return r;
}

function escribirDesglose(d) {
  document.querySelectorAll('#desglose-filas input').forEach((i) => {
    i.value = d[i.dataset.den] || '';
  });
  if (Object.keys(d).length) $('desglose').open = true;
}

function actualizarCuadre() {
  const fecha = $('fecha').value;
  const fondo = dias[fecha]?.apertura?.fondo || 0;
  const c = leerCierre();
  const r = calcular(fondo, c);
  $('cuadre').innerHTML = `
    <div class="fila"><span>Total ventas</span><strong>${fmt(r.ventas)}</strong></div>
    <div class="fila"><span>Efectivo que debería haber</span><strong>${fmt(r.esperado)}</strong></div>
    <div class="fila"><span>Efectivo contado</span><strong>${fmt(c.contado)}</strong></div>
    <div class="fila"><span>Retiras de la caja</span><strong>${fmt(r.retirada)}</strong></div>
    <div class="fila total"><span>Descuadre</span>
      <span class="${claseDescuadre(r.descuadre)}">${textoDescuadre(r.descuadre)}</span></div>`;
}

function pintarCaja() {
  const fecha = $('fecha').value;
  const dia = dias[fecha];
  $('form-apertura').hidden = true;
  $('form-cierre').hidden = true;
  $('dia-cerrado').hidden = true;

  let chip;
  if (!dia?.apertura) {
    chip = '<span class="chip pendiente">Sin abrir</span>';
    $('form-apertura').hidden = false;
    $('fondo-inicial').value = aTexto(fondoSugerido(fecha));
  } else if (!dia.cierre || dia.editando) {
    chip = `<span class="chip abierta">Abierta a las ${dia.apertura.hora}</span>`;
    $('form-cierre').hidden = false;
    $('cierre-fondo').textContent = fmt(dia.apertura.fondo);
    rellenarCierre(dia.cierre || { fondoManana: dia.apertura.fondo });
    actualizarCuadre();
  } else {
    chip = `<span class="chip cerrada">Cerrada a las ${dia.cierre.hora}</span>`;
    $('dia-cerrado').hidden = false;
    const c = dia.cierre;
    const r = calcular(dia.apertura.fondo, c);
    const filas = [
      ['Fondo inicial', fmt(dia.apertura.fondo)],
      ['Ventas en efectivo', fmt(c.ventasEfectivo)],
      ['Ventas con tarjeta', fmt(c.ventasTarjeta)],
      ['Ventas por Bizum', fmt(c.ventasBizum)],
      ['Total ventas', fmt(r.ventas)],
      ['Gastos pagados de caja', fmt(c.gastos)],
      ['Efectivo esperado', fmt(r.esperado)],
      ['Efectivo contado', fmt(c.contado)],
      ['Descuadre', `<span class="${claseDescuadre(r.descuadre)}">${textoDescuadre(r.descuadre)}</span>`],
      ['Fondo para mañana', fmt(c.fondoManana)],
      ['Retirado de caja', fmt(r.retirada)],
    ];
    if (c.notas) filas.push(['Notas', c.notas.replace(/</g, '&lt;')]);
    $('detalle-cierre').innerHTML = filas.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  }
  $('estado-dia').innerHTML = `${fechaLarga(fecha)} · ${chip}`;
}

// ---------- Vista: resumen ----------

function pintarResumen() {
  const mes = $('mes').value;
  const fechas = Object.keys(dias).filter((f) => f.startsWith(mes) && dias[f].cierre).sort();
  const t = { ventas: 0, efectivo: 0, tarjeta: 0, bizum: 0, gastos: 0, descuadre: 0 };

  const filas = fechas.map((f) => {
    const d = dias[f];
    const c = d.cierre;
    const r = calcular(d.apertura.fondo, c);
    t.ventas += r.ventas;
    t.efectivo += c.ventasEfectivo;
    t.tarjeta += c.ventasTarjeta;
    t.bizum += c.ventasBizum;
    t.gastos += c.gastos;
    t.descuadre += r.descuadre;
    const etiqueta = new Date(f + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
    return `<tr data-fecha="${f}">
      <td>${etiqueta}</td><td>${fmt(r.ventas)}</td><td>${fmt(c.ventasEfectivo)}</td>
      <td>${fmt(c.ventasTarjeta)}</td><td>${fmt(c.ventasBizum)}</td><td>${fmt(c.gastos)}</td>
      <td class="${claseDescuadre(r.descuadre)}">${fmt(r.descuadre)}</td></tr>`;
  });

  $('tabla-dias').innerHTML = filas.length
    ? filas.join('')
    : '<tr><td colspan="7" class="vacio">No hay días cerrados en este mes.</td></tr>';

  const media = fechas.length ? Math.round(t.ventas / fechas.length) : 0;
  const cifras = [
    ['Ventas del mes', fmt(t.ventas)],
    ['Días cerrados', fechas.length],
    ['Media por día', fmt(media)],
    ['Efectivo', fmt(t.efectivo)],
    ['Tarjeta', fmt(t.tarjeta)],
    ['Bizum', fmt(t.bizum)],
    ['Gastos de caja', fmt(t.gastos)],
    ['Descuadre acumulado', `<span class="${claseDescuadre(t.descuadre)}">${fmt(t.descuadre)}</span>`],
  ];
  $('cifras-mes').innerHTML = cifras
    .map(([k, v]) => `<div class="cifra"><small>${k}</small><strong>${v}</strong></div>`).join('');
}

// ---------- Navegación ----------

function mostrarVista(nombre) {
  document.querySelectorAll('.pestana').forEach((b) => b.classList.toggle('activa', b.dataset.vista === nombre));
  $('vista-caja').hidden = nombre !== 'caja';
  $('vista-resumen').hidden = nombre !== 'resumen';
  if (nombre === 'resumen') pintarResumen();
  else pintarCaja();
}

function irAFecha(fecha) {
  $('fecha').value = fecha;
  pintarCaja();
}

// ---------- Eventos ----------

document.querySelectorAll('.pestana').forEach((b) => b.addEventListener('click', () => mostrarVista(b.dataset.vista)));

$('fecha').addEventListener('change', pintarCaja);
$('dia-anterior').addEventListener('click', () => irAFecha(sumarDias($('fecha').value, -1)));
$('dia-siguiente').addEventListener('click', () => irAFecha(sumarDias($('fecha').value, 1)));
$('ir-hoy').addEventListener('click', () => irAFecha(hoyISO()));

$('form-apertura').addEventListener('submit', (e) => {
  e.preventDefault();
  const fecha = $('fecha').value;
  const anterior = dias[fecha] || {};
  dias[fecha] = { ...anterior, apertura: { fondo: aCentimos($('fondo-inicial').value), hora: anterior.apertura?.hora || horaActual() } };
  guardar(dias);
  pintarCaja();
});

$('editar-apertura').addEventListener('click', () => {
  const fecha = $('fecha').value;
  const actual = dias[fecha].apertura.fondo;
  const nuevo = prompt('Nuevo fondo inicial (€):', aTexto(actual));
  if (nuevo === null) return;
  dias[fecha].apertura.fondo = aCentimos(nuevo);
  guardar(dias);
  $('cierre-fondo').textContent = fmt(dias[fecha].apertura.fondo);
  actualizarCuadre();
});

campos.forEach((id) => $(id).addEventListener('input', actualizarCuadre));

$('desglose-filas').addEventListener('input', () => {
  const total = Object.entries(leerDesglose()).reduce((s, [den, n]) => s + den * n, 0);
  $('contado').value = aTexto(total);
  actualizarCuadre();
});

$('form-cierre').addEventListener('submit', (e) => {
  e.preventDefault();
  const fecha = $('fecha').value;
  const c = leerCierre();
  const r = calcular(dias[fecha].apertura.fondo, c);
  if (r.descuadre !== 0 && !confirm(`${textoDescuadre(r.descuadre)} en caja. ¿Cerrar igualmente?`)) return;
  dias[fecha].cierre = { ...c, hora: dias[fecha].cierre?.hora || horaActual() };
  delete dias[fecha].editando;
  guardar(dias);
  pintarCaja();
});

$('reabrir').addEventListener('click', () => {
  dias[$('fecha').value].editando = true;
  pintarCaja();
});

$('mes').addEventListener('change', pintarResumen);

$('tabla-dias').addEventListener('click', (e) => {
  const fila = e.target.closest('tr[data-fecha]');
  if (!fila) return;
  $('fecha').value = fila.dataset.fecha;
  mostrarVista('caja');
});

$('exportar').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(dias, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `caja-pescaderia-luque-${hoyISO()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

$('importar').addEventListener('change', async (e) => {
  const archivo = e.target.files[0];
  if (!archivo) return;
  try {
    const datos = JSON.parse(await archivo.text());
    if (typeof datos !== 'object' || Array.isArray(datos)) throw new Error();
    if (!confirm('Esto sustituirá los datos actuales por los de la copia. ¿Continuar?')) return;
    dias = datos;
    guardar(dias);
    pintarResumen();
    alert('Copia restaurada.');
  } catch {
    alert('El archivo no es una copia válida.');
  } finally {
    e.target.value = '';
  }
});

// ---------- Inicio ----------

construirDesglose();
$('fecha').value = hoyISO();
$('mes').value = hoyISO().slice(0, 7);
mostrarVista('caja');
