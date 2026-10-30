// Gestión Pescadería Luque — control de caja por género
// Importes en céntimos (enteros). Pesos en kg con 3 decimales.

const CLAVE_PRODUCTOS = 'gpl.productos';
const CLAVE_DIAS = 'gpl.dias.v2';
const DENOMINACIONES = [50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

const FRESCO_INICIAL = [
  'Sardinas', 'Sardinas chicas', 'Boquerón chico', 'Boquerón mediano', 'Boquerón grande',
  'Bacaladillas', 'Bacaladillas chicas', 'Trozos de bacalao', 'Filete de bacalao', 'Filete de rosada',
  'Tiras', 'Anillas de calamar', 'Sepia', 'Rejos', 'Almejas', 'Mejillón', 'Pescada', 'Merluza',
  'Dorada', 'Lubina', 'Trucha', 'Calamar fino', 'Caballas', 'Jureles', 'Salmonetes', 'Rape',
  'Lenguados', 'Brótola', 'Melva', 'Pulpo crudo', 'Pulpo cocido', 'Rejón', 'Almejas gordas',
  'Pijotas', 'Pijotón',
];
const GORDO_INICIAL = ['Atún', 'Salmón', 'Marrajo', 'Pez limón', 'Pez espada', 'Cazón'];
const MARISCO_INICIAL = [
  'Patas de cangrejo', 'Camarones', 'Patas rotas', 'Gambón',
  'Langostinos cocidos', 'Langostinos crudos', 'Gamba cruda', 'Gamba cocida',
];

// unidad 'ud' = se vende por bolsas/unidades; 'kg' = a granel
const CONGELADO_INICIAL = [
  { nombre: 'Preparado de sopa', formato: '1 kg', unidad: 'ud' },
  { nombre: 'Cóctel de marisco', formato: '1 kg', unidad: 'ud' },
  { nombre: 'Gamba pelada', formato: '1 kg', unidad: 'ud' },
  { nombre: 'Filete de merluza congelado', formato: 'a granel', unidad: 'kg' },
  { nombre: 'Filete de rosada congelado', formato: 'a granel', unidad: 'kg' },
  { nombre: 'Palitos del océano', formato: 'unidad', unidad: 'ud' },
  { nombre: 'Tortillitas de camarones', formato: 'unidad', unidad: 'ud' },
  { nombre: 'Mejillón media concha', formato: 'a granel', unidad: 'kg' },
  { nombre: 'Calamar limpio', formato: '1 kg', unidad: 'ud' },
  { nombre: 'Bacalao congelado', formato: 'a granel', unidad: 'kg' },
  { nombre: 'Gamba rebozada', formato: '1 kg', unidad: 'ud' },
];

const TIPOS = { fresco: 'Pescado fresco', gordo: 'Pescado gordo', marisco: 'Marisco', congelado: 'Congelado' };

const $ = (id) => document.getElementById(id);
const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

// ---------- Utilidades ----------

const fmt = (cent) => euros.format((cent || 0) / 100);
const fmtKg = (kg) => (kg || 0).toLocaleString('es-ES', { maximumFractionDigits: 3 }) + ' kg';
const fmtUd = (n) => `${n} ud${n === 1 ? '' : 's'}`;

function aNumero(texto) {
  if (texto == null) return null;
  let t = String(texto).trim().replace(/\s|€|kg/gi, '');
  if (!t) return null;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

const aCentimos = (t) => { const n = aNumero(t); return n == null ? null : Math.round(n * 100); };
const aKg = (t) => { const n = aNumero(t); return n == null ? null : Math.round(n * 1000) / 1000; };
const aEntero = (t) => { const n = aNumero(t); return n == null ? null : Math.max(0, Math.round(n)); };

const centATexto = (c) => (c == null ? '' : (c / 100).toFixed(2).replace('.', ','));
const numATexto = (n) => (n == null ? '' : String(n).replace('.', ','));

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

const fechaLarga = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});

const escapar = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function slug(nombre) {
  return nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ---------- Datos ----------

function leer(clave, porDefecto) {
  try {
    return JSON.parse(localStorage.getItem(clave)) ?? porDefecto;
  } catch {
    return porDefecto;
  }
}

function catalogoInicial() {
  return [
    ...FRESCO_INICIAL.map((nombre) => ({ id: slug(nombre), nombre, tipo: 'fresco', merma: 0 })),
    ...GORDO_INICIAL.map((nombre) => ({ id: slug(nombre), nombre, tipo: 'gordo', merma: 0 })),
    ...MARISCO_INICIAL.map((nombre) => ({ id: slug(nombre), nombre, tipo: 'marisco', merma: 0 })),
  ];
}

let productos = leer(CLAVE_PRODUCTOS, null) || catalogoInicial();
let dias = leer(CLAVE_DIAS, {});

// Catálogos guardados antes de que existiera el marisco: se añade una sola vez
if (!localStorage.getItem('gpl.marisco')) {
  for (const nombre of MARISCO_INICIAL) {
    if (!productos.some((p) => p.id === slug(nombre))) productos.push({ id: slug(nombre), nombre, tipo: 'marisco', merma: 0 });
  }
  localStorage.setItem('gpl.marisco', '1');
}

if (!localStorage.getItem('gpl.congelado')) {
  for (const c of CONGELADO_INICIAL) {
    const id = 'cong-' + slug(c.nombre);
    if (!productos.some((p) => p.id === id)) productos.push({ id, tipo: 'congelado', ...c });
  }
  localStorage.setItem('gpl.congelado', '1');
}

function guardar() {
  localStorage.setItem(CLAVE_PRODUCTOS, JSON.stringify(productos));
  localStorage.setItem(CLAVE_DIAS, JSON.stringify(dias));
}

const porTipo = (tipo) => productos.filter((p) => p.tipo === tipo);
const producto = (id) => productos.find((p) => p.id === id);

// Congelado: cantidades en unidades o, si va a granel, en kg
const aGranel = (p) => p.unidad === 'kg';
const redondear = (n) => Math.round(n * 1000) / 1000;
const fmtCant = (p, n) => (aGranel(p) ? fmtKg(redondear(n)) : fmtUd(n));
const leerCant = (p, t) => (aGranel(p) ? aKg(t) : aEntero(t));
const modoTeclado = (p) => (aGranel(p) ? 'decimal' : 'numeric');

function diaEditable(fecha) {
  dias[fecha] ||= { fresco: {}, congelado: {}, caja: {} };
  return dias[fecha];
}

// Precio del fresco: el de ese día o, si no se ha puesto, el último usado
function precio(fecha, id) {
  const propio = dias[fecha]?.fresco?.[id]?.pvp;
  if (propio != null) return propio;
  const anteriores = Object.keys(dias).filter((f) => f < fecha).sort().reverse();
  for (const f of anteriores) {
    const p = dias[f].fresco?.[id]?.pvp;
    if (p != null) return p;
  }
  return null;
}

// Unidades de congelado al empezar el día (antes de reponer)
function stockAntes(id, fecha) {
  let s = producto(id)?.stockInicial || 0;
  for (const f of Object.keys(dias).filter((x) => x < fecha).sort()) {
    const c = dias[f].congelado?.[id];
    if (!c) continue;
    s += c.repuesto || 0;
    if (c.quedan != null) s = c.quedan;
  }
  return redondear(s);
}

function stockActual(id) {
  return stockAntes(id, '9999-12-31');
}

function calcularDia(fecha) {
  const d = dias[fecha] || { fresco: {}, congelado: {}, caja: {} };
  const lineas = [];

  for (const p of productos.filter((x) => x.tipo !== 'congelado')) {
    const f = d.fresco?.[p.id];
    if (!f?.kg) continue;
    const vendido = Math.max(0, Math.round((f.kg - (f.sobra || 0)) * 1000) / 1000);
    const neto = vendido * (1 - (p.merma || 0) / 100);
    const pvp = precio(fecha, p.id) || 0;
    lineas.push({ p, inicio: f.kg, queda: f.sobra || 0, vendido, pvp, importe: Math.round(neto * pvp), unidad: 'kg' });
  }

  for (const p of porTipo('congelado')) {
    const c = d.congelado?.[p.id] || {};
    const inicio = redondear(stockAntes(p.id, fecha) + (c.repuesto || 0));
    const queda = c.quedan ?? inicio;
    const vendido = Math.max(0, redondear(inicio - queda));
    lineas.push({
      p, inicio, queda, vendido, pvp: p.pvp || 0, importe: Math.round(vendido * (p.pvp || 0)),
      margen: Math.round(vendido * ((p.pvp || 0) - (p.coste || 0))), unidad: aGranel(p) ? 'kg' : 'ud',
    });
  }

  const caja = d.caja || {};
  const teorico = lineas.reduce((s, l) => s + l.importe, 0);
  const hayCaja = caja.contado != null || caja.tarjeta != null || caja.bizum != null;
  const efectivoVendido = (caja.contado || 0) - (caja.fondo || 0) + (caja.gastos || 0);
  const real = efectivoVendido + (caja.tarjeta || 0) + (caja.bizum || 0);
  return { lineas, teorico, hayCaja, efectivoVendido, real, diferencia: real - teorico, caja };
}

function claseDif(c) {
  if (c === 0) return 'ok';
  return c < 0 ? 'falta' : 'sobra';
}

function textoDif(c) {
  if (c === 0) return 'Cuadra ✓';
  return (c < 0 ? 'Falta ' : 'Sobra ') + fmt(Math.abs(c));
}

// ---------- Vista: día ----------

function filaCab(...cols) {
  return `<div class="fila-prod cab">${cols.map((c) => `<span>${c}</span>`).join('')}</div>`;
}

function pintarInicio() {
  const fecha = $('fecha').value;
  const d = dias[fecha] || { fresco: {}, congelado: {} };

  for (const tipo of ['fresco', 'gordo', 'marisco']) {
    const lista = porTipo(tipo);
    $('inicio-' + tipo).innerHTML = lista.length
      ? filaCab('Producto', 'Kg', '€/kg') + lista.map((p) => {
        const f = d.fresco?.[p.id] || {};
        const pvp = precio(fecha, p.id);
        return `<div class="fila-prod${f.kg ? ' con-dato' : ''}">
          <span>${escapar(p.nombre)}${p.merma ? ` <small class="etiqueta">merma ${numATexto(p.merma)} %</small>` : ''}</span>
          <input type="text" inputmode="decimal" data-fresco="kg" data-id="${p.id}" value="${numATexto(f.kg)}" placeholder="0">
          <input type="text" inputmode="decimal" data-fresco="pvp" data-id="${p.id}" value="${centATexto(pvp)}" placeholder="0,00">
        </div>`;
      }).join('')
      : '<p class="ayuda">No hay productos de este tipo.</p>';
  }

  const cong = porTipo('congelado');
  $('inicio-congelado').innerHTML = cong.length
    ? filaCab('Producto', 'Hay', 'Repongo') + cong.map((p) => `<div class="fila-prod">
        <span>${escapar(p.nombre)}${p.formato ? ` <small class="etiqueta">${escapar(p.formato)}</small>` : ''}</span>
        <span class="dato">${fmtCant(p, stockAntes(p.id, fecha))}</span>
        <input type="text" inputmode="${modoTeclado(p)}" data-congelado="repuesto" data-id="${p.id}" value="${numATexto(d.congelado?.[p.id]?.repuesto)}" placeholder="0">
      </div>`).join('')
    : '<p class="ayuda">Todavía no hay productos congelados. Añádelos en «Productos».</p>';

  document.querySelectorAll('[data-caja]').forEach((i) => {
    const v = dias[fecha]?.caja?.[i.dataset.caja];
    i.value = i.dataset.caja === 'notas' ? (v || '') : centATexto(v);
  });
  escribirDesglose(dias[fecha]?.caja?.desglose || {});
}

function pintarCierre() {
  const fecha = $('fecha').value;
  const d = dias[fecha] || { fresco: {}, congelado: {} };
  const llevados = productos.filter((p) => p.tipo !== 'congelado' && d.fresco?.[p.id]?.kg);

  $('cierre-fresco').innerHTML = llevados.length
    ? filaCab('Producto', 'Empezó', 'Sobra kg') + llevados.map((p) => {
      const f = d.fresco[p.id];
      return `<div class="fila-prod">
        <span>${escapar(p.nombre)}</span>
        <span class="dato">${fmtKg(f.kg)}</span>
        <input type="text" inputmode="decimal" data-fresco="sobra" data-id="${p.id}" value="${numATexto(f.sobra)}" placeholder="0">
      </div>`;
    }).join('')
    : '<p class="ayuda">Primero apunta en el paso 1 los kilos con los que empieza el día.</p>';

  const cong = porTipo('congelado');
  $('cierre-congelado').innerHTML = cong.length
    ? filaCab('Producto', 'Había', 'Quedan') + cong.map((p) => {
      const c = d.congelado?.[p.id] || {};
      const habia = redondear(stockAntes(p.id, fecha) + (c.repuesto || 0));
      return `<div class="fila-prod">
        <span>${escapar(p.nombre)}</span>
        <span class="dato">${fmtCant(p, habia)}</span>
        <input type="text" inputmode="${modoTeclado(p)}" data-congelado="quedan" data-id="${p.id}" value="${numATexto(c.quedan)}" placeholder="${numATexto(habia)}">
      </div>`;
    }).join('')
    : '<p class="ayuda">No hay productos congelados.</p>';
}

function pintarCuadre() {
  const r = calcularDia($('fecha').value);
  const vendidas = r.lineas.filter((l) => l.vendido > 0);

  const tabla = vendidas.length
    ? `<div class="tabla-envoltorio"><table class="tabla">
        <thead><tr><th>Producto</th><th>Vendido</th><th>Precio</th><th>Importe</th></tr></thead>
        <tbody>${vendidas.map((l) => `<tr>
          <td>${escapar(l.p.nombre)}${l.p.merma ? ` <small class="etiqueta">−${numATexto(l.p.merma)} %</small>` : ''}</td>
          <td>${l.unidad === 'kg' ? fmtKg(l.vendido) : fmtUd(l.vendido)}</td>
          <td>${fmt(l.pvp)}${l.unidad === 'kg' ? '/kg' : ''}</td>
          <td>${fmt(l.importe)}</td></tr>`).join('')}</tbody>
      </table></div>`
    : '<p class="ayuda">Aún no hay nada vendido.</p>';

  const resumen = `<div class="cuadre">
    <div class="fila"><span>Debería haber vendido (según género)</span><strong>${fmt(r.teorico)}</strong></div>
    <div class="fila"><span>Efectivo vendido (contado − fondo + gastos)</span><strong>${fmt(r.efectivoVendido)}</strong></div>
    <div class="fila"><span>Tarjeta</span><strong>${fmt(r.caja.tarjeta)}</strong></div>
    <div class="fila"><span>Bizum</span><strong>${fmt(r.caja.bizum)}</strong></div>
    <div class="fila"><span>Total cobrado en caja</span><strong>${fmt(r.real)}</strong></div>
    <div class="fila total"><span>Diferencia</span>
      <span class="${r.hayCaja ? claseDif(r.diferencia) : ''}">${r.hayCaja ? textoDif(r.diferencia) : 'Falta apuntar la caja'}</span></div>
    ${r.caja.fondoManana != null ? `<div class="fila"><span>Se retira de la caja</span><strong>${fmt((r.caja.contado || 0) - r.caja.fondoManana)}</strong></div>` : ''}
  </div>`;

  $('cuadre').innerHTML = tabla + resumen;
}

function pintarDia() {
  $('fecha-larga').textContent = fechaLarga($('fecha').value);
  pintarInicio();
  pintarCierre();
  pintarCuadre();
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
  document.querySelectorAll('#desglose-filas input').forEach((i) => { i.value = d[i.dataset.den] || ''; });
  $('desglose').open = Object.keys(d).length > 0;
}

// ---------- Vista: congelado ----------

function pintarCongelado() {
  const lista = porTipo('congelado');
  $('tabla-congelado').innerHTML = lista.length
    ? lista.map((p) => {
      const hay = stockActual(p.id);
      const reponer = Math.max(0, redondear((p.stockIdeal || 0) - hay));
      return `<tr><td>${escapar(p.nombre)}</td><td>${fmtCant(p, hay)}</td><td>${fmtCant(p, p.stockIdeal || 0)}</td>
        <td class="${reponer ? 'falta' : 'ok'}">${reponer ? fmtCant(p, reponer) : '—'}</td><td>${fmt(Math.round(hay * (p.coste || 0)))}</td></tr>`;
    }).join('')
    : '<tr><td colspan="5" class="vacio">Todavía no hay productos congelados.</td></tr>';
}

// ---------- Vista: resumen ----------

function pintarResumen() {
  const mes = $('mes').value;
  const fechas = Object.keys(dias).filter((f) => f.startsWith(mes)).sort();
  const t = { teorico: 0, real: 0, kg: 0, uds: 0, margen: 0 };
  const porProducto = {};
  const filas = [];

  for (const f of fechas) {
    const r = calcularDia(f);
    if (!r.lineas.length && !r.hayCaja) continue;
    t.teorico += r.teorico;
    t.real += r.real;
    for (const l of r.lineas) {
      if (!l.vendido) continue;
      if (l.unidad === 'kg') t.kg += l.vendido; else t.uds += l.vendido;
      t.margen += l.margen || 0;
      const acc = (porProducto[l.p.id] ||= { p: l.p, cantidad: 0, importe: 0 });
      acc.cantidad += l.vendido;
      acc.importe += l.importe;
    }
    const etiqueta = new Date(f + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
    filas.push(`<tr data-fecha="${f}"><td>${etiqueta}</td><td>${fmt(r.teorico)}</td><td>${fmt(r.real)}</td>
      <td class="${r.hayCaja ? claseDif(r.diferencia) : ''}">${r.hayCaja ? fmt(r.diferencia) : 'sin caja'}</td></tr>`);
  }

  $('tabla-dias').innerHTML = filas.join('') || '<tr><td colspan="4" class="vacio">No hay días con datos en este mes.</td></tr>';

  const prods = Object.values(porProducto).sort((a, b) => b.importe - a.importe);
  $('tabla-productos').innerHTML = prods.length
    ? prods.map((x) => `<tr><td>${escapar(x.p.nombre)}</td>
        <td>${x.p.tipo === 'congelado' ? fmtCant(x.p, x.cantidad) : fmtKg(redondear(x.cantidad))}</td>
        <td>${fmt(x.importe)}</td></tr>`).join('')
    : '<tr><td colspan="3" class="vacio">Sin ventas este mes.</td></tr>';

  const dif = t.real - t.teorico;
  const cifras = [
    ['Debería haber vendido', fmt(t.teorico)],
    ['Cobrado en caja', fmt(t.real)],
    ['Diferencia', `<span class="${claseDif(dif)}">${fmt(dif)}</span>`],
    ['Días con datos', filas.length],
    ['Vendido a peso', fmtKg(redondear(t.kg))],
    ['Congelado vendido por unidades', fmtUd(t.uds)],
    ['Ganancia congelado', fmt(t.margen)],
  ];
  $('cifras-mes').innerHTML = cifras.map(([k, v]) => `<div class="cifra"><small>${k}</small><strong>${v}</strong></div>`).join('');
}

// ---------- Vista: productos ----------

function pintarProductos() {
  $('lista-productos').innerHTML = Object.entries(TIPOS).map(([tipo, titulo]) => {
    const lista = porTipo(tipo);
    const cab = tipo === 'congelado'
      ? filaCab('Nombre', 'Formato', 'Se vende', 'Coste €', 'Venta €', 'Stock inicial', 'Stock ideal', '')
      : filaCab('Nombre', 'Merma %', '');
    const filas = lista.map((p) => {
      const campos = tipo === 'congelado'
        ? `<input data-prod="formato" value="${escapar(p.formato || '')}" placeholder="bolsa 1 kg">
           <select data-prod="unidad">
             <option value="ud"${aGranel(p) ? '' : ' selected'}>Por unidad</option>
             <option value="kg"${aGranel(p) ? ' selected' : ''}>A granel (kg)</option>
           </select>
           <input inputmode="decimal" data-prod="coste" value="${centATexto(p.coste)}" placeholder="0,00">
           <input inputmode="decimal" data-prod="pvp" value="${centATexto(p.pvp)}" placeholder="0,00">
           <input inputmode="${modoTeclado(p)}" data-prod="stockInicial" value="${numATexto(p.stockInicial)}" placeholder="0">
           <input inputmode="${modoTeclado(p)}" data-prod="stockIdeal" value="${numATexto(p.stockIdeal)}" placeholder="0">`
        : `<input inputmode="decimal" data-prod="merma" value="${numATexto(p.merma || '')}" placeholder="0">`;
      return `<div class="fila-prod ${tipo === 'congelado' ? 'f-cong' : 'f-fresco'}" data-id="${p.id}">
        <input data-prod="nombre" value="${escapar(p.nombre)}">${campos}
        <button type="button" class="btn-borrar" data-borrar="${p.id}" aria-label="Borrar ${escapar(p.nombre)}">✕</button>
      </div>`;
    }).join('');
    return `<div class="tarjeta"><h2>${titulo} <small>(${lista.length})</small></h2>
      <div class="filas productos ${tipo === 'congelado' ? 'f-cong' : 'f-fresco'}">${lista.length ? cab + filas : '<p class="ayuda">Sin productos.</p>'}</div></div>`;
  }).join('');
}

// ---------- Navegación ----------

const VISTAS = { dia: pintarDia, congelado: pintarCongelado, resumen: pintarResumen, productos: pintarProductos };

function mostrarVista(nombre) {
  document.querySelectorAll('.pestana').forEach((b) => b.classList.toggle('activa', b.dataset.vista === nombre));
  for (const v of Object.keys(VISTAS)) $('vista-' + v).hidden = v !== nombre;
  VISTAS[nombre]();
}

function irAFecha(fecha) {
  $('fecha').value = fecha;
  pintarDia();
}

// ---------- Eventos ----------

document.querySelectorAll('.pestana').forEach((b) => b.addEventListener('click', () => mostrarVista(b.dataset.vista)));
$('fecha').addEventListener('change', pintarDia);
$('dia-anterior').addEventListener('click', () => irAFecha(sumarDias($('fecha').value, -1)));
$('dia-siguiente').addEventListener('click', () => irAFecha(sumarDias($('fecha').value, 1)));
$('ir-hoy').addEventListener('click', () => irAFecha(hoyISO()));

// Guardado automático de todo lo que se escribe en la vista del día
$('vista-dia').addEventListener('input', (e) => {
  const i = e.target;
  const fecha = $('fecha').value;
  const { id } = i.dataset;

  if (i.dataset.fresco) {
    const d = diaEditable(fecha);
    const f = (d.fresco[id] ||= {});
    const campo = i.dataset.fresco;
    f[campo] = campo === 'pvp' ? aCentimos(i.value) : aKg(i.value);
    // Al poner kilos, se fija el precio que se ve en pantalla para ese día
    if (campo === 'kg' && f.pvp == null) f.pvp = precio(fecha, id);
  } else if (i.dataset.congelado) {
    const d = diaEditable(fecha);
    const c = (d.congelado[id] ||= {});
    c[i.dataset.congelado] = leerCant(producto(id), i.value);
  } else if (i.dataset.caja) {
    const d = diaEditable(fecha);
    d.caja[i.dataset.caja] = i.dataset.caja === 'notas' ? i.value.trim() : aCentimos(i.value);
  } else if (i.dataset.den) {
    const d = diaEditable(fecha);
    d.caja.desglose = leerDesglose();
    const total = Object.entries(d.caja.desglose).reduce((s, [den, n]) => s + den * n, 0);
    d.caja.contado = total;
    document.querySelector('[data-caja="contado"]').value = centATexto(total);
  } else {
    return;
  }
  guardar();
  pintarCuadre();
});

// Al terminar de escribir kilos o reposiciones, se actualiza la lista del cierre
$('vista-dia').addEventListener('change', (e) => {
  const i = e.target;
  if (i.dataset.fresco === 'kg' || i.dataset.congelado === 'repuesto') {
    i.closest('.fila-prod')?.classList.toggle('con-dato', !!aKg(i.value));
    pintarCierre();
  }
});

$('mes').addEventListener('change', pintarResumen);
$('tabla-dias').addEventListener('click', (e) => {
  const fila = e.target.closest('tr[data-fecha]');
  if (!fila) return;
  $('fecha').value = fila.dataset.fecha;
  mostrarVista('dia');
});

$('form-producto').addEventListener('submit', (e) => {
  e.preventDefault();
  const nombre = $('nuevo-nombre').value.trim();
  if (!nombre) return;
  let id = slug(nombre);
  while (producto(id)) id += '-2';
  productos.push({ id, nombre, tipo: $('nuevo-tipo').value, merma: 0 });
  guardar();
  $('nuevo-nombre').value = '';
  pintarProductos();
});

$('lista-productos').addEventListener('input', (e) => {
  const i = e.target;
  const campo = i.dataset.prod;
  const p = producto(i.closest('[data-id]')?.dataset.id);
  if (!campo || !p) return;
  if (campo === 'nombre' || campo === 'formato') p[campo] = i.value.trim();
  else if (campo === 'coste' || campo === 'pvp') p[campo] = aCentimos(i.value);
  else if (campo === 'merma') p.merma = aNumero(i.value) || 0;
  else if (campo === 'unidad') {
    p.unidad = i.value;
    guardar();
    pintarProductos();
    return;
  } else p[campo] = leerCant(p, i.value);
  guardar();
});

$('lista-productos').addEventListener('click', (e) => {
  const id = e.target.dataset.borrar;
  if (!id) return;
  const p = producto(id);
  if (!confirm(`¿Borrar «${p.nombre}» del catálogo? Los días ya apuntados dejarán de contarlo.`)) return;
  productos = productos.filter((x) => x.id !== id);
  guardar();
  pintarProductos();
});

$('exportar').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ productos, dias }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `pescaderia-luque-${hoyISO()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

$('importar').addEventListener('change', async (e) => {
  const archivo = e.target.files[0];
  if (!archivo) return;
  try {
    const datos = JSON.parse(await archivo.text());
    if (!Array.isArray(datos.productos) || typeof datos.dias !== 'object') throw new Error();
    if (!confirm('Esto sustituirá los productos y los días actuales por los de la copia. ¿Continuar?')) return;
    productos = datos.productos;
    dias = datos.dias;
    guardar();
    pintarProductos();
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
guardar();
mostrarVista('dia');
