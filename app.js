// Caja Luque — Pescaderías Adolfo
// Control de caja a partir del género. Importes en céntimos (enteros). Pesos en kg con 3 decimales.

const CLAVE_PRODUCTOS = 'gpl.productos';
const CLAVE_DIAS = 'gpl.dias.v2';
const CLAVE_AJUSTES = 'gpl.ajustes';
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

const TIPOS = {
  fresco: { nombre: 'Pescado fresco', icono: 'frescura' },
  gordo: { nombre: 'Pescado gordo', icono: 'preparacion' },
  marisco: { nombre: 'Marisco', icono: 'calidad' },
  congelado: { nombre: 'Congelado', icono: 'frio' },
};
const A_PESO = ['fresco', 'gordo', 'marisco'];

const svg = (cuerpo) => `<span class="icono"><svg viewBox="0 0 64 64" aria-hidden="true">${cuerpo}</svg></span>`;
const ICONO = {
  ok: svg('<circle cx="32" cy="32" r="22"/><path d="M22 33l7 7 14-16"/>'),
  alerta: svg('<circle cx="32" cy="32" r="22"/><path d="M32 20v15"/><path d="M32 43v1"/>'),
  reloj: svg('<circle cx="32" cy="32" r="22"/><path d="M32 20v13l8 5"/>'),
  candado: svg('<rect x="16" y="28" width="32" height="24" rx="4"/><path d="M22 28v-6a10 10 0 0 1 20 0v6"/>'),
};

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
const redondear = (n) => Math.round(n * 1000) / 1000;

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

const fecha = (iso, opciones) => new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', opciones);
const fechaLarga = (iso) => fecha(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fechaCorta = (iso) => fecha(iso, { weekday: 'long', day: 'numeric', month: 'long' });
const horaActual = () => new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

const escapar = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const normalizar = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const slug = (nombre) => normalizar(nombre).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function avisar(texto) {
  const t = $('aviso');
  t.textContent = texto;
  t.classList.add('visible');
  clearTimeout(avisar.temporizador);
  avisar.temporizador = setTimeout(() => t.classList.remove('visible'), 2500);
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
  ];
}

let productos = leer(CLAVE_PRODUCTOS, null) || catalogoInicial();
let dias = leer(CLAVE_DIAS, {});
let ajustes = { ciegas: true, teclado: 'auto', ...leer(CLAVE_AJUSTES, {}) };

// Catálogos guardados antes de que existieran el marisco y el congelado: se añaden una sola vez
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

// Cada producto tiene un número fijo, el mismo que sale en la plantilla impresa
const siguienteCodigo = () => Math.max(0, ...productos.map((p) => p.codigo || 0)) + 1;
for (const p of productos) if (!p.codigo) p.codigo = siguienteCodigo();

function guardar() {
  localStorage.setItem(CLAVE_PRODUCTOS, JSON.stringify(productos));
  localStorage.setItem(CLAVE_DIAS, JSON.stringify(dias));
  localStorage.setItem(CLAVE_AJUSTES, JSON.stringify(ajustes));
}

const porTipo = (tipo) => productos.filter((p) => p.tipo === tipo);
const producto = (id) => productos.find((p) => p.id === id);

// Congelado: cantidades en unidades o, si va a granel, en kg
const aGranel = (p) => p.tipo !== 'congelado' || p.unidad === 'kg';
const fmtCant = (p, n) => (aGranel(p) ? fmtKg(redondear(n)) : fmtUd(n));
const leerCant = (p, t) => (aGranel(p) ? aKg(t) : aEntero(t));
const modoTeclado = (p) => (aGranel(p) ? 'decimal' : 'numeric');

function diaEditable(f) {
  dias[f] ||= { fresco: {}, congelado: {}, caja: {} };
  dias[f].salidas ||= [];
  return dias[f];
}

// Precio del fresco: el de ese día o, si no se ha puesto, el último usado
function precio(f, id) {
  const propio = dias[f]?.fresco?.[id]?.pvp;
  if (propio != null) return propio;
  const anteriores = Object.keys(dias).filter((x) => x < f).sort().reverse();
  for (const x of anteriores) {
    const p = dias[x].fresco?.[id]?.pvp;
    if (p != null) return p;
  }
  return null;
}

// Retiradas y mermas de un producto en un día
const salidasDe = (d, id) => (d?.salidas || []).filter((s) => s.prod === id).reduce((a, s) => a + s.cant, 0);

// Unidades (o kg) de congelado al empezar el día, antes de reponer
function stockAntes(id, f) {
  let s = producto(id)?.stockInicial || 0;
  for (const x of Object.keys(dias).filter((y) => y < f).sort()) {
    const c = dias[x].congelado?.[id] || {};
    s += c.repuesto || 0;
    if (c.quedan != null) s = c.quedan;
    else s -= salidasDe(dias[x], id);
  }
  return redondear(Math.max(0, s));
}

const stockActual = (id) => stockAntes(id, '9999-12-31');

function calcularDia(f) {
  const d = dias[f] || { fresco: {}, congelado: {}, caja: {} };
  const lineas = [];

  for (const p of productos.filter((x) => x.tipo !== 'congelado')) {
    const r = d.fresco?.[p.id];
    if (!r?.kg) continue;
    const salidas = salidasDe(d, p.id);
    const vendido = Math.max(0, redondear(r.kg - (r.sobra || 0) - salidas));
    const neto = vendido * (1 - (p.merma || 0) / 100);
    const pvp = precio(f, p.id) || 0;
    lineas.push({ p, inicio: r.kg, queda: r.sobra || 0, salidas, vendido, neto: redondear(neto), pvp, importe: Math.round(neto * pvp) });
  }

  for (const p of porTipo('congelado')) {
    const c = d.congelado?.[p.id] || {};
    const salidas = salidasDe(d, p.id);
    const inicio = redondear(stockAntes(p.id, f) + (c.repuesto || 0));
    const queda = c.quedan ?? Math.max(0, inicio - salidas);
    const vendido = Math.max(0, redondear(inicio - queda - salidas));
    lineas.push({
      p, inicio, queda, salidas, vendido, pvp: p.pvp || 0,
      importe: Math.round(vendido * (p.pvp || 0)),
      margen: Math.round(vendido * ((p.pvp || 0) - (p.coste || 0))),
    });
  }

  const salidas = (d.salidas || []).map((s) => {
    const p = producto(s.prod);
    const pvp = p ? (p.tipo === 'congelado' ? p.pvp || 0 : precio(f, p.id) || 0) : 0;
    return { ...s, p, valor: Math.round(s.cant * pvp) };
  }).filter((s) => s.p);

  const caja = d.caja || {};
  const teorico = lineas.reduce((s, l) => s + l.importe, 0);
  const hayCaja = caja.contado != null || caja.tarjeta != null || caja.bizum != null;
  const efectivoVendido = (caja.contado || 0) - (caja.fondo || 0) + (caja.gastos || 0);
  const real = efectivoVendido + (caja.tarjeta || 0) + (caja.bizum || 0);
  return {
    lineas, salidas, teorico, hayCaja, efectivoVendido, real,
    diferencia: real - teorico, caja, cerrado: d.cerrado || null,
  };
}

function estadoDia(f) {
  const d = dias[f];
  return {
    genero: !!d && productos.some((p) => p.tipo !== 'congelado' && d.fresco?.[p.id]?.kg),
    cerrado: d?.cerrado || null,
  };
}

const claseDif = (c) => (c === 0 ? 'ok' : c < 0 ? 'falta' : 'sobra');
const textoDif = (c) => (c === 0 ? 'Cuadra' : (c < 0 ? 'Faltan ' : 'Sobran ') + fmt(Math.abs(c)));

function esHabitual(id, f) {
  for (let i = 0; i <= 14; i++) {
    if (dias[sumarDias(f, -i)]?.fresco?.[id]?.kg) return true;
  }
  return false;
}

// ---------- Componentes ----------

const filaCab = (...cols) => `<div class="fila-prod cab${cols.length === 2 ? ' dos' : ''}">${cols.map((c) => `<span>${c}</span>`).join('')}</div>`;

function cabeceraCategoria(tipo, detalle) {
  return `<header class="cat-cab">
    <img src="assets/iconos/${TIPOS[tipo].icono}.svg" alt="" width="44" height="44">
    <div><h2>${TIPOS[tipo].nombre}</h2>${detalle ? `<p class="ayuda" data-conteo="${tipo}">${detalle}</p>` : ''}</div>
  </header>`;
}

function grafico(barras) {
  const max = Math.max(1, ...barras.map((b) => b.valor));
  return `<div class="grafico${barras.length > 10 ? ' denso' : ''}" role="img" aria-label="${barras.map((b) => `${b.titulo}: ${fmt(b.valor)}`).join('; ')}">
    ${barras.map((b) => `<div class="barra${b.provisional ? ' provisional' : ''}${b.hoy ? ' hoy' : ''}" title="${b.titulo}: ${fmt(b.valor)}">
      <span class="barra-valor">${b.valor ? fmt(b.valor).replace(/,\d\d\s€/, ' €') : ''}</span>
      <span class="barra-col" style="height:${Math.round((b.valor / max) * 100)}%"></span>
      <span class="barra-dia">${b.etiqueta}</span>
    </div>`).join('')}
  </div>`;
}

function bloqueResultado(r, enlace) {
  if (!r.cerrado && !r.hayCaja) return '';
  const clase = claseDif(r.diferencia);
  return `<div class="resultado ${clase}">
    ${clase === 'ok' ? ICONO.ok : ICONO.alerta}
    <div>
      <p class="grande">${textoDif(r.diferencia)}</p>
      <p>Debería haber ${fmt(r.teorico)} · Cobrado ${fmt(r.real)}${r.cerrado ? ` · Cierre a las ${r.cerrado.hora}` : ''}</p>
    </div>
    ${enlace || ''}
  </div>`;
}

// ---------- Vista: inicio ----------

function pintarInicio() {
  const hoy = hoyISO();
  const r = calcularDia(hoy);
  const e = estadoDia(hoy);
  $('inicio-fecha').textContent = fechaLarga(hoy);

  let estado;
  if (e.cerrado) {
    estado = bloqueResultado(r, '<button class="btn secundario" data-ir-vista="dia" data-ir-fecha="' + hoy + '" data-ir-paso="3">Ver cuadre</button>');
  } else if (e.genero) {
    estado = `<div class="resultado pendiente">${ICONO.reloj}
      <div><p class="grande">Día abierto</p><p>El género está apuntado. Falta el cierre de la tienda.</p></div>
      <button class="btn primario" data-ir-vista="dia" data-ir-fecha="${hoy}" data-ir-paso="2">Ir al cierre</button></div>`;
  } else {
    estado = `<div class="resultado pendiente">${ICONO.reloj}
      <div><p class="grande">Falta el género de hoy</p><p>Apunta los kilos y precios con los que empieza el día.</p></div>
      <button class="btn primario" data-ir-vista="dia" data-ir-fecha="${hoy}" data-ir-paso="1">Apuntar género</button></div>`;
  }
  $('inicio-estado').innerHTML = estado;

  // Cifras
  const ayer = calcularDia(sumarDias(hoy, -1));
  let semana = 0;
  let difMes = 0;
  const barras = [];
  for (let i = 6; i >= 0; i--) {
    const f = sumarDias(hoy, -i);
    const x = calcularDia(f);
    if (x.hayCaja) semana += x.real;
    barras.push({
      etiqueta: fecha(f, { weekday: 'short' }).replace('.', ''),
      titulo: fechaCorta(f),
      valor: x.hayCaja ? x.real : x.teorico,
      provisional: !x.hayCaja,
      hoy: i === 0,
    });
  }
  for (const f of Object.keys(dias).filter((x) => x.startsWith(hoy.slice(0, 7)))) {
    const x = calcularDia(f);
    if (x.hayCaja) difMes += x.diferencia;
  }
  const cifras = [
    ['Debería vender hoy', fmt(r.teorico)],
    ['Cobrado hoy', r.hayCaja ? fmt(r.real) : '—'],
    ['Cobrado ayer', ayer.hayCaja ? fmt(ayer.real) : '—'],
    ['Últimos 7 días', fmt(semana)],
    ['Diferencia del mes', `<span class="${claseDif(difMes)}">${fmt(difMes)}</span>`],
  ];
  $('inicio-cifras').innerHTML = cifras.map(([k, v]) => `<div class="cifra"><small>${k}</small><strong>${v}</strong></div>`).join('');
  $('inicio-grafico').innerHTML = grafico(barras);

  // Avisos
  const avisos = [];
  for (let i = 1; i <= 14; i++) {
    const f = sumarDias(hoy, -i);
    const x = estadoDia(f);
    if (x.genero && !x.cerrado) {
      avisos.push({ titulo: `Cierre sin terminar: ${fechaCorta(f)}`, texto: 'El género está apuntado pero falta terminar el cierre.', boton: 'Ir al día', datos: `data-ir-vista="dia" data-ir-fecha="${f}" data-ir-paso="2"` });
    }
  }
  const sinPrecio = productos.filter((p) => p.tipo !== 'congelado' && dias[hoy]?.fresco?.[p.id]?.kg && !precio(hoy, p.id));
  if (sinPrecio.length) {
    avisos.push({ titulo: 'Falta el precio de venta de hoy', texto: sinPrecio.map((p) => p.nombre).join(', '), boton: 'Poner precios', datos: `data-ir-vista="dia" data-ir-fecha="${hoy}" data-ir-paso="1"` });
  }
  const reponer = porTipo('congelado').filter((p) => p.stockIdeal && stockActual(p.id) < p.stockIdeal);
  if (reponer.length) {
    avisos.push({ titulo: 'Hay que reponer congelado', texto: reponer.map((p) => `${p.nombre} (${fmtCant(p, redondear(p.stockIdeal - stockActual(p.id)))})`).join(', '), boton: 'Ver congelado', datos: 'data-ir-vista="congelado"' });
  }
  const congSinPrecio = porTipo('congelado').filter((p) => !p.pvp).length;
  if (congSinPrecio) {
    avisos.push({ titulo: `${congSinPrecio} productos congelados sin precio`, texto: 'Sin precio de venta no cuentan en el cuadre.', boton: 'Poner precios', datos: 'data-ir-vista="productos"' });
  }
  $('inicio-avisos').innerHTML = avisos.length
    ? '<h2>Avisos</h2>' + avisos.map((a) => `<div class="aviso">${ICONO.alerta}
        <div><strong>${escapar(a.titulo)}</strong><p>${escapar(a.texto)}</p></div>
        <button class="btn secundario" ${a.datos}>${a.boton}</button></div>`).join('')
    : `<div class="aviso ok">${ICONO.ok}<div><strong>Todo al día</strong><p>No hay nada pendiente.</p></div></div>`;
}

// ---------- Vista: día ----------

let pasoActual = 1;

function pasoSugerido(f) {
  const e = estadoDia(f);
  return e.cerrado ? 3 : e.genero ? 2 : 1;
}

function pintarPasos() {
  const f = $('fecha').value;
  const e = estadoDia(f);
  const r = calcularDia(f);
  $('estado-paso-1').textContent = e.genero ? 'Hecho' : 'Pendiente';
  $('estado-paso-2').textContent = e.cerrado ? `Hecho · ${e.cerrado.hora}` : 'Pendiente';
  $('estado-paso-3').textContent = e.cerrado ? textoDif(r.diferencia) : ajustes.ciegas ? 'Tras el cierre' : 'Provisional';
  document.querySelectorAll('.pasos button').forEach((b) => {
    const n = +b.dataset.paso;
    b.classList.toggle('hecho', (n === 1 && e.genero) || (n >= 2 && !!e.cerrado));
    if (n === pasoActual) b.setAttribute('aria-current', 'step');
    else b.removeAttribute('aria-current');
  });
  for (const n of [1, 2, 3]) $('panel-' + n).hidden = n !== pasoActual;
}

function pintarGenero() {
  const f = $('fecha').value;
  const d = dias[f] || { fresco: {}, congelado: {} };

  const fila = (p) => {
    const r = d.fresco?.[p.id] || {};
    return `<div class="fila-prod${r.kg ? ' con-dato' : ''}" data-nombre="${escapar(normalizar(p.nombre))}">
      <span class="nombre-prod">${escapar(p.nombre)} <small class="codigo">${p.codigo}</small>${p.merma ? ` <small class="etiqueta">merma ${numATexto(p.merma)} %</small>` : ''}</span>
      <input type="text" class="num" inputmode="decimal" data-fresco="kg" data-id="${p.id}" data-etiqueta="kilos" value="${numATexto(r.kg)}" placeholder="0" aria-label="Kilos de ${escapar(p.nombre)}">
      <input type="text" class="num" inputmode="decimal" data-fresco="pvp" data-id="${p.id}" data-etiqueta="€/kg" value="${centATexto(precio(f, p.id))}" placeholder="0,00" aria-label="Precio por kilo de ${escapar(p.nombre)}">
    </div>`;
  };

  const secciones = A_PESO.map((tipo) => {
    const lista = porTipo(tipo);
    if (!lista.length) return '';
    const habituales = lista.filter((p) => esHabitual(p.id, f));
    const otros = lista.filter((p) => !habituales.includes(p));
    const conKilos = lista.filter((p) => d.fresco?.[p.id]?.kg).length;
    return `<section class="tarjeta categoria">
      ${cabeceraCategoria(tipo, `${conKilos} con kilos hoy`)}
      ${filaCab('Producto', 'Kilos', '€/kg')}
      ${habituales.map(fila).join('')}
      ${otros.length ? `<details class="otros"${habituales.length ? '' : ' open'}>
        <summary>${habituales.length ? 'Otros productos' : 'Todos los productos'} (${otros.length})</summary>
        ${otros.map(fila).join('')}
      </details>` : ''}
    </section>`;
  });

  const cong = porTipo('congelado');
  if (cong.length) {
    secciones.push(`<section class="tarjeta categoria">
      ${cabeceraCategoria('congelado', 'Lo que hay en la tienda y lo que repones hoy')}
      ${filaCab('Producto', 'Hay', 'Repongo')}
      ${cong.map((p) => `<div class="fila-prod${d.congelado?.[p.id]?.repuesto ? ' con-dato' : ''}" data-nombre="${escapar(normalizar(p.nombre))}">
        <span class="nombre-prod">${escapar(p.nombre)} <small class="codigo">${p.codigo}</small>${p.formato ? ` <small class="etiqueta">${escapar(p.formato)}</small>` : ''}</span>
        <span class="dato">${fmtCant(p, stockAntes(p.id, f))}</span>
        <input type="text" class="num" inputmode="${modoTeclado(p)}" data-congelado="repuesto" data-id="${p.id}" data-etiqueta="repongo" value="${numATexto(d.congelado?.[p.id]?.repuesto)}" placeholder="0" aria-label="Repongo de ${escapar(p.nombre)}">
      </div>`).join('')}
    </section>`);
  }

  $('genero').innerHTML = secciones.join('');
  const fondo = document.querySelector('[data-caja="fondo"]');
  fondo.value = centATexto(dias[f]?.caja?.fondo);
  aplicarBusqueda();
}

function aplicarBusqueda() {
  const q = normalizar($('buscar').value.trim());
  document.querySelectorAll('#genero .fila-prod[data-nombre]').forEach((fila) => {
    fila.classList.toggle('oculto', !!q && !fila.dataset.nombre.includes(q));
  });
  if (q) document.querySelectorAll('#genero details').forEach((d) => { d.open = true; });
}

function actualizarConteos() {
  const f = $('fecha').value;
  for (const tipo of A_PESO) {
    const el = document.querySelector(`[data-conteo="${tipo}"]`);
    if (el) el.textContent = `${porTipo(tipo).filter((p) => dias[f]?.fresco?.[p.id]?.kg).length} con kilos hoy`;
  }
}

function pintarCierre() {
  const f = $('fecha').value;
  const d = dias[f] || { fresco: {}, congelado: {} };
  const cerrado = d.cerrado;
  const ciega = ajustes.ciegas;

  $('cierre-form').disabled = !!cerrado;
  $('terminar-cierre').hidden = !!cerrado;
  $('cierre-estado').innerHTML = cerrado
    ? `<div class="aviso ok">${ICONO.candado}
        <div><strong>Cierre terminado a las ${cerrado.hora}</strong><p>Los recuentos ya no se pueden cambiar.</p></div>
        <button class="btn secundario" id="reabrir">Reabrir cierre</button></div>`
    : '';

  const llevados = productos.filter((p) => p.tipo !== 'congelado' && d.fresco?.[p.id]?.kg);
  $('cierre-fresco').innerHTML = llevados.length
    ? (ciega ? filaCab('Producto', 'Sobra kg') : filaCab('Producto', 'Empezó', 'Sobra kg')) + llevados.map((p) => {
      const r = d.fresco[p.id];
      return `<div class="fila-prod${ciega ? ' dos' : ''}">
        <span class="nombre-prod">${escapar(p.nombre)}</span>
        ${ciega ? '' : `<span class="dato">${fmtKg(r.kg)}</span>`}
        <input type="text" class="num" inputmode="decimal" data-fresco="sobra" data-id="${p.id}" data-etiqueta="sobra (kg)" value="${numATexto(r.sobra)}" placeholder="0" aria-label="Kilos que sobran de ${escapar(p.nombre)}">
      </div>`;
    }).join('')
    : '<p class="ayuda">Todavía no se ha apuntado el género del día (paso 1).</p>';

  const cong = porTipo('congelado');
  $('cierre-congelado').innerHTML = cong.length
    ? (ciega ? filaCab('Producto', 'Quedan') : filaCab('Producto', 'Había', 'Quedan')) + cong.map((p) => {
      const c = d.congelado?.[p.id] || {};
      const habia = redondear(stockAntes(p.id, f) + (c.repuesto || 0));
      return `<div class="fila-prod${ciega ? ' dos' : ''}">
        <span class="nombre-prod">${escapar(p.nombre)}${p.formato ? ` <small class="etiqueta">${escapar(p.formato)}</small>` : ''}</span>
        ${ciega ? '' : `<span class="dato">${fmtCant(p, habia)}</span>`}
        <input type="text" class="num" inputmode="${modoTeclado(p)}" data-congelado="quedan" data-id="${p.id}" data-etiqueta="quedan" value="${numATexto(c.quedan)}" placeholder="${ciega ? '' : numATexto(habia)}" aria-label="Quedan de ${escapar(p.nombre)}">
      </div>`;
    }).join('')
    : '<p class="ayuda">No hay productos congelados.</p>';

  // Retiradas y mermas
  const opciones = [...llevados, ...cong];
  $('salida-prod').innerHTML = opciones.length
    ? opciones.map((p) => `<option value="${p.id}">${escapar(p.nombre)} (${aGranel(p) ? 'kg' : 'uds'})</option>`).join('')
    : '<option value="">Sin productos</option>';
  pintarSalidas();

  document.querySelectorAll('#cierre-form [data-caja]').forEach((i) => {
    const v = d.caja?.[i.dataset.caja];
    i.value = i.dataset.caja === 'notas' ? (v || '') : centATexto(v);
  });
  escribirDesglose(d.caja?.desglose || {});
}

function pintarSalidas() {
  const d = dias[$('fecha').value];
  const lista = (d?.salidas || []).map((s, i) => ({ s, i, p: producto(s.prod) })).filter((x) => x.p);
  $('lista-salidas').innerHTML = lista.map(({ s, i, p }) => `<div class="salida">
    <span class="etiqueta">${s.tipo === 'merma' ? 'Merma' : 'Retirada'}</span>
    <span><strong>${escapar(p.nombre)}</strong> · ${fmtCant(p, s.cant)}<small>${s.motivo ? escapar(s.motivo) + ' · ' : ''}${s.hora}</small></span>
    <span></span>
    <button type="button" class="btn-borrar" data-borrar-salida="${i}" aria-label="Quitar">✕</button>
  </div>`).join('');
}

function pintarCuadre() {
  const f = $('fecha').value;
  const r = calcularDia(f);

  if (ajustes.ciegas && !r.cerrado) {
    $('cuadre').innerHTML = `<div class="resultado pendiente">${ICONO.candado}
      <div><p class="grande">El cuadre sale al terminar el cierre</p>
      <p>Así el recuento se hace sin saber cuánto debería salir. Termina el cierre en el paso 2.</p></div>
      <button class="btn primario" data-ir-vista="dia" data-ir-paso="2">Ir al cierre</button></div>`;
    return;
  }

  const vendidas = r.lineas.filter((l) => l.vendido > 0);
  const aviso = r.cerrado ? '' : `<div class="aviso">${ICONO.reloj}<div><strong>Cuadre provisional</strong><p>El cierre todavía no está terminado.</p></div></div>`;

  const detalle = vendidas.length
    ? vendidas.map((l) => `<div class="linea">
        <span>${escapar(l.p.nombre)}${l.p.merma ? ` <small class="etiqueta">merma ${numATexto(l.p.merma)} %</small>` : ''}</span>
        <span class="importe">${fmt(l.importe)}</span>
        <small>${fmtCant(l.p, l.vendido)}${l.p.merma ? ` − ${numATexto(l.p.merma)} % = ${fmtKg(l.neto)}` : ''} × ${fmt(l.pvp)}${aGranel(l.p) ? '/kg' : ''}</small>
      </div>`).join('') + `<div class="linea total"><span>Debería haber vendido</span><span class="importe">${fmt(r.teorico)}</span></div>`
    : '<p class="ayuda">No consta nada vendido.</p>';

  const salidas = r.salidas.length
    ? `<section class="tarjeta"><h2>Retiradas y mermas</h2>${r.salidas.map((s) => `<div class="linea">
        <span>${s.tipo === 'merma' ? 'Merma' : 'Retirada'} · ${escapar(s.p.nombre)}</span>
        <span class="importe">${fmt(s.valor)}</span>
        <small>${fmtCant(s.p, s.cant)}${s.motivo ? ' · ' + escapar(s.motivo) : ''}</small>
      </div>`).join('')}<p class="ayuda">Valor a precio de venta. No cuenta como venta.</p></section>`
    : '';

  const c = r.caja;
  const caja = `<section class="tarjeta"><h2>Caja</h2>
    <div class="linea"><span>Efectivo vendido</span><span class="importe">${fmt(r.efectivoVendido)}</span>
      <small>${fmt(c.contado)} contado − ${fmt(c.fondo)} fondo + ${fmt(c.gastos)} gastos</small></div>
    <div class="linea"><span>Tarjeta</span><span class="importe">${fmt(c.tarjeta)}</span></div>
    <div class="linea"><span>Bizum</span><span class="importe">${fmt(c.bizum)}</span></div>
    <div class="linea total"><span>Total cobrado</span><span class="importe">${fmt(r.real)}</span></div>
    ${c.fondoManana != null ? `<div class="linea"><span>Se retira de la caja</span><span class="importe">${fmt((c.contado || 0) - c.fondoManana)}</span><small>Se deja ${fmt(c.fondoManana)} para mañana</small></div>` : ''}
    ${c.notas ? `<p class="ayuda">Notas: ${escapar(c.notas)}</p>` : ''}
  </section>`;

  $('cuadre').innerHTML = aviso
    + (bloqueResultado(r) || `<div class="resultado pendiente">${ICONO.reloj}<div><p class="grande">Falta apuntar la caja</p></div></div>`)
    + `<section class="tarjeta"><h2>Vendido por producto</h2>${detalle}</section>`
    + salidas + caja;
}

function pintarDia() {
  const f = $('fecha').value;
  $('fecha-larga').textContent = fechaLarga(f);
  pintarPasos();
  pintarGenero();
  pintarCierre();
  pintarCuadre();
}

function construirDesglose() {
  $('desglose-filas').innerHTML = DENOMINACIONES.map((d) => `
    <label><span>${d >= 100 ? d / 100 + ' €' : d + ' c'}</span>
      <input type="text" class="num" inputmode="numeric" data-den="${d}" data-etiqueta="${d >= 100 ? d / 100 + ' €' : d + ' c'}" placeholder="0" aria-label="Cantidad de ${d >= 100 ? d / 100 + ' euros' : d + ' céntimos'}">
    </label>`).join('');
}

function leerDesglose() {
  const r = {};
  document.querySelectorAll('#desglose-filas input').forEach((i) => {
    const n = aEntero(i.value);
    if (n > 0) r[i.dataset.den] = n;
  });
  return r;
}

function escribirDesglose(d) {
  document.querySelectorAll('#desglose-filas input').forEach((i) => { i.value = d[i.dataset.den] || ''; });
  $('desglose').open = Object.keys(d).length > 0;
}

// ---------- Plantilla imprimible ----------

// El diseño (posición de cada casilla) lo comparten la hoja impresa y el lector de fotos (lector.js)
const disenoActual = () => disenoPlantilla(productos, TIPOS);

function construirPlantilla() {
  const d = disenoActual();
  if (d.desbordado) avisar('Hay demasiados productos para una hoja: algunos no caben en la plantilla.');
  $('plantilla').innerHTML = svgPlantilla(d);
}

// Foto de la plantilla → números leídos → misma revisión que la lista pegada
async function leerFoto(archivo) {
  const estado = $('foto-estado');
  estado.textContent = 'Leyendo la foto… (unos segundos)';
  $('rapido-revision').innerHTML = '';
  try {
    const leidos = await leerFotoPlantilla(archivo, disenoActual());
    const porProducto = new Map();
    let fondo = null;
    for (const r of leidos) {
      const dudosa = r.confianza < 0.95;
      if (r.id === '__fondo') {
        fondo = { valor: Math.round(r.valor * 100), recorte: r.recorte, duda: dudosa };
        continue;
      }
      const p = producto(r.id);
      if (!p) continue;
      const x = porProducto.get(p.id) || { p, kg: null, pvp: null, repuesto: null, recortes: {}, dudas: {} };
      x[r.campo] = r.campo === 'pvp' ? Math.round(r.valor * 100) : r.valor;
      x.recortes[r.campo] = r.recorte;
      x.dudas[r.campo] = dudosa;
      porProducto.set(p.id, x);
    }
    estado.textContent = '';
    pintarRevision({ filas: [...porProducto.values()], sueltas: [], fondo, deFoto: true });
  } catch (e) {
    estado.textContent = '';
    $('rapido-revision').innerHTML = `<div class="aviso">${ICONO.alerta}<div><strong>No he podido leer la foto</strong>
      <p>${escapar(e.message || 'Inténtalo de nuevo con otra foto.')}</p></div></div>`;
  }
}

// ---------- Rellenar rápido: leer una lista pegada, dictada o copiada de una foto ----------

const VACIAS = new Set([
  'de', 'del', 'a', 'al', 'el', 'la', 'los', 'las', 'kg', 'kgs', 'kilo', 'kilos', 'k', 'euro', 'euros', 'eur',
  'e', 'precio', 'y', 'x', 'por', 'cada', 'unidad', 'unidades', 'ud', 'uds', 'bolsa', 'bolsas', 'n', 'no', 'num',
]);
const NUMEROS = { un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10 };

function trocear(texto) {
  const t = normalizar(texto)
    .replace(/\b(un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\b/g, (m) => NUMEROS[m])
    .replace(/(\d+)\s+(?:con|coma)\s+(\d+)/g, '$1,$2')
    .replace(/(\d+)\s+y\s+medio\b/g, '$1,5')
    .replace(/(\d+)\s+y\s+cuarto\b/g, '$1,25')
    .replace(/\bmedio\s+kilo\b/g, '0,5');
  return [...t.matchAll(/\d+(?:[.,]\d+)?|[a-z]+/g)]
    .map(([m]) => (/\d/.test(m) ? { num: Number(m.replace(',', '.')) } : { palabra: m }))
    .filter((x) => x.num != null || !VACIAS.has(x.palabra));
}

// Singular y plural cuentan como la misma palabra (boquerón / boquerones)
const mismaPalabra = (a, b) => a === b || a + 's' === b || b + 's' === a || a + 'es' === b || b + 'es' === a;

function leerLista(texto) {
  const T = trocear(texto);
  const candidatos = productos
    .map((p) => ({ p, palabras: trocear(p.nombre).map((x) => x.palabra).filter(Boolean) }))
    .filter((c) => c.palabras.length)
    .sort((a, b) => b.palabras.length - a.palabras.length);

  // Buscar los nombres de producto en el texto (primero los más largos: «sardinas chicas» antes que «sardinas»)
  const marcas = [];
  const sueltas = [];
  let suelta = [];
  const cerrarSuelta = () => { if (suelta.length) sueltas.push(suelta.join(' ')); suelta = []; };
  for (let i = 0; i < T.length;) {
    if (T[i].palabra) {
      const c = candidatos.find((x) => x.palabras.every((w, k) => T[i + k]?.palabra && mismaPalabra(w, T[i + k].palabra)));
      if (c) {
        cerrarSuelta();
        marcas.push({ p: c.p, ini: i, fin: i + c.palabras.length });
        i += c.palabras.length;
        continue;
      }
      suelta.push(T[i].palabra);
    } else {
      cerrarSuelta();
    }
    i++;
  }
  cerrarSuelta();

  // Si el texto viene de la plantilla, cada nombre va precedido de su número de producto: se descarta
  const conCodigo = marcas.filter((m) => T[m.ini - 1]?.num === m.p.codigo).length;
  const usaCodigos = conCodigo >= Math.max(2, marcas.length / 2);

  const filas = new Map();
  marcas.forEach((m, k) => {
    const sig = marcas[k + 1];
    let hasta = sig ? sig.ini : T.length;
    if (usaCodigos && sig && T[sig.ini - 1]?.num === sig.p.codigo) hasta = sig.ini - 1;
    const nums = T.slice(m.fin, hasta).filter((x) => x.num != null).map((x) => x.num);
    const cong = m.p.tipo === 'congelado';
    filas.set(m.p.id, {
      p: m.p,
      kg: cong ? null : nums[0] ?? null,
      pvp: cong ? null : nums[1] != null ? Math.round(nums[1] * 100) : null,
      repuesto: cong ? nums[0] ?? null : null,
      sobran: nums.length > (cong ? 1 : 2),
      repetido: filas.has(m.p.id),
    });
  });
  return { filas: [...filas.values()].filter((x) => x.kg != null || x.repuesto != null || x.pvp != null), sueltas, sinDatos: [...filas.values()].filter((x) => x.kg == null && x.repuesto == null && x.pvp == null) };
}

function pintarRevision(res) {
  const f = $('fecha').value;
  const d = dias[f] || { fresco: {}, congelado: {} };
  if (!res.filas.length && !res.fondo) {
    $('rapido-revision').innerHTML = res.deFoto
      ? `<div class="aviso">${ICONO.alerta}<div><strong>No he encontrado números en la plantilla</strong>
        <p>Comprueba que la foto es de la plantilla rellena, con buena luz y sin sombras fuertes.</p></div></div>`
      : `<div class="aviso">${ICONO.alerta}<div><strong>No he reconocido ningún producto</strong>
        <p>Escribe el nombre como está en la lista de productos, seguido de los kilos y el precio.</p></div></div>`;
    return;
  }

  // Casilla de revisión: el número leído y, si viene de una foto, el recorte de lo escrito
  const celda = (x, campo, texto, modo, etiqueta) => {
    const recorte = x.recortes?.[campo];
    return `<span class="celda-rev${x.dudas?.[campo] ? ' duda' : ''}">
      ${recorte ? `<img src="${recorte}" alt="Lo escrito en ${etiqueta}">` : ''}
      <input type="text" class="num" inputmode="${modo}" data-campo="${campo}" data-etiqueta="${etiqueta}" value="${texto}" placeholder="${etiqueta}">
    </span>`;
  };
  const algunaDuda = (x) => Object.values(x.dudas || {}).some(Boolean);

  const filas = res.filas.map((x) => {
    const notas = [];
    const p = x.p;
    if (algunaDuda(x)) notas.push('letra dudosa: compara con lo escrito');
    if (p.tipo === 'congelado') {
      const antes = d.congelado?.[p.id]?.repuesto;
      if (antes != null && antes !== x.repuesto) notas.push(`antes ${numATexto(antes)}`);
      return `<div class="fila-prod rev${algunaDuda(x) ? ' dudosa' : ''}" data-rev="${p.id}">
        <input type="checkbox" checked aria-label="Pasar ${escapar(p.nombre)}">
        <span class="nombre-prod">${escapar(p.nombre)} <small class="codigo">${p.codigo}</small><small class="nota">Repongo${notas.length ? ' · ' + notas.join(' · ') : ''}</small></span>
        ${celda(x, 'repuesto', numATexto(x.repuesto), modoTeclado(p), 'repongo')}
        <span></span>
      </div>`;
    }
    const anterior = precio(f, p.id);
    const pvp = x.pvp ?? anterior;
    if (x.pvp == null && anterior != null) notas.push('precio del último día');
    if (x.pvp == null && anterior == null) notas.push('falta el precio');
    if (x.kg == null) notas.push('faltan los kilos');
    const antes = d.fresco?.[p.id]?.kg;
    if (antes && antes !== x.kg) notas.push(`antes ${fmtKg(antes)}`);
    const raro = (x.kg != null && x.kg > 60) || (pvp != null && (pvp < 100 || pvp > 6000))
      || (x.pvp != null && anterior && Math.abs(x.pvp - anterior) / anterior > 0.4);
    if (raro) notas.push('revisa este número');
    if (x.repetido) notas.push('aparece dos veces');
    if (x.sobran) notas.push('había números de más');
    return `<div class="fila-prod rev${raro || x.kg == null || algunaDuda(x) ? ' dudosa' : ''}" data-rev="${p.id}">
      <input type="checkbox" ${x.kg != null ? 'checked' : ''} aria-label="Pasar ${escapar(p.nombre)}">
      <span class="nombre-prod">${escapar(p.nombre)} <small class="codigo">${p.codigo}</small>${notas.length ? `<small class="nota">${notas.join(' · ')}</small>` : ''}</span>
      ${celda(x, 'kg', numATexto(x.kg), 'decimal', 'kilos')}
      ${celda(x, 'pvp', centATexto(pvp), 'decimal', '€/kg')}
    </div>`;
  }).join('');

  const fondo = res.fondo
    ? `<div class="fila-prod rev${res.fondo.duda ? ' dudosa' : ''}" data-fondo>
        <input type="checkbox" checked aria-label="Pasar el fondo de caja">
        <span class="nombre-prod">Fondo de caja${res.fondo.duda ? '<small class="nota">letra dudosa: compara con lo escrito</small>' : ''}</span>
        <span></span>
        ${celda({ recortes: { fondo: res.fondo.recorte }, dudas: { fondo: res.fondo.duda } }, 'fondo', centATexto(res.fondo.valor), 'decimal', '€')}
      </div>`
    : '';

  const desconocidas = res.sueltas.length
    ? `<div class="aviso">${ICONO.alerta}<div><strong>No reconozco</strong><p>${res.sueltas.map((s) => `«${escapar(s)}»`).join(', ')}</p></div></div>`
    : '';

  $('rapido-revision').innerHTML = `<h3>Revisa antes de pasar al día</h3>
    <p class="ayuda">${res.deFoto ? 'Encima de cada número tienes lo que escribiste. ' : ''}Comprueba los marcados en amarillo y quita la marca de lo que no quieras pasar.</p>
    <div class="filas">${filaCab('', 'Producto', 'Kilos', '€/kg').replace('fila-prod cab', 'fila-prod cab rev')}${fondo}${filas}</div>
    ${desconocidas}
    <div class="botones">
      <button type="button" class="btn primario" id="rapido-pasar">Pasar al día (${res.filas.filter((x) => x.kg != null || x.repuesto != null).length} productos)</button>
      <button type="button" class="btn secundario" id="rapido-cancelar">Cancelar</button>
    </div>`;
}

function pasarRevision() {
  const f = $('fecha').value;
  const d = diaEditable(f);
  let n = 0;
  document.querySelectorAll('#rapido-revision [data-rev]').forEach((fila) => {
    if (!fila.querySelector('input[type="checkbox"]').checked) return;
    const p = producto(fila.dataset.rev);
    const valor = (campo) => fila.querySelector(`[data-campo="${campo}"]`)?.value;
    if (p.tipo === 'congelado') {
      const rep = leerCant(p, valor('repuesto'));
      if (rep == null) return;
      (d.congelado[p.id] ||= {}).repuesto = rep;
    } else {
      const kg = aKg(valor('kg'));
      if (kg == null) return;
      const r = (d.fresco[p.id] ||= {});
      r.kg = kg;
      r.pvp = aCentimos(valor('pvp')) ?? precio(f, p.id);
    }
    n++;
  });
  const fondo = document.querySelector('#rapido-revision [data-fondo]');
  if (fondo?.querySelector('input[type="checkbox"]').checked) {
    const v = aCentimos(fondo.querySelector('[data-campo="fondo"]').value);
    if (v != null) d.caja.fondo = v;
  }
  guardar();
  $('rapido-revision').innerHTML = '';
  $('rapido-texto').value = '';
  pintarDia();
  avisar(`${n} productos pasados al día.`);
}

// ---------- Vista: congelado ----------

function listaReposicion() {
  return porTipo('congelado')
    .map((p) => ({ p, falta: Math.max(0, redondear((p.stockIdeal || 0) - stockActual(p.id))) }))
    .filter((x) => x.falta > 0);
}

function pintarCongelado() {
  const lista = porTipo('congelado');
  $('lista-congelado').innerHTML = lista.length
    ? filaCab('Producto', 'Hay', 'Reponer') + lista.map((p) => {
      const hay = stockActual(p.id);
      const falta = Math.max(0, redondear((p.stockIdeal || 0) - hay));
      return `<div class="fila-prod${falta ? ' con-dato' : ''}">
        <span class="nombre-prod">${escapar(p.nombre)}<small class="etiqueta">ideal ${fmtCant(p, p.stockIdeal || 0)}</small></span>
        <span class="dato">${fmtCant(p, hay)}</span>
        <span class="dato ${falta ? 'falta' : 'ok'}">${falta ? fmtCant(p, falta) : 'Bien'}</span>
      </div>`;
    }).join('')
    : '<p class="ayuda">Todavía no hay productos congelados.</p>';

  const texto = textoReposicion();
  $('whatsapp-reposicion').href = 'https://wa.me/?text=' + encodeURIComponent(texto);
}

function textoReposicion() {
  const lista = listaReposicion();
  if (!lista.length) return 'Congelado Luque: no hace falta reponer nada.';
  return `Reposición congelado Luque (${fecha(hoyISO(), { day: 'numeric', month: 'long' })}):\n`
    + lista.map((x) => `- ${x.p.nombre}: ${fmtCant(x.p, x.falta)}`).join('\n');
}

// ---------- Vista: resumen ----------

function pintarResumen() {
  const mes = $('mes').value;
  const fechas = Object.keys(dias).filter((f) => f.startsWith(mes)).sort();
  const t = { teorico: 0, real: 0, kg: 0, uds: 0, margen: 0, mermas: 0 };
  const porProducto = {};
  const filas = [];
  const barras = [];

  for (const f of fechas) {
    const r = calcularDia(f);
    if (!r.lineas.some((l) => l.vendido) && !r.hayCaja) continue;
    t.teorico += r.teorico;
    if (r.hayCaja) t.real += r.real;
    t.mermas += r.salidas.filter((s) => s.tipo === 'merma').reduce((a, s) => a + s.valor, 0);
    for (const l of r.lineas) {
      if (!l.vendido) continue;
      if (aGranel(l.p)) t.kg += l.vendido; else t.uds += l.vendido;
      t.margen += l.margen || 0;
      const acc = (porProducto[l.p.id] ||= { p: l.p, cantidad: 0, importe: 0 });
      acc.cantidad += l.vendido;
      acc.importe += l.importe;
    }
    filas.push(`<tr data-fecha="${f}"><td>${fecha(f, { weekday: 'short', day: 'numeric' })}</td><td>${fmt(r.teorico)}</td>
      <td>${r.hayCaja ? fmt(r.real) : '—'}</td>
      <td class="${r.hayCaja ? claseDif(r.diferencia) : ''}">${r.hayCaja ? textoDif(r.diferencia) : 'Sin caja'}</td></tr>`);
    barras.push({ etiqueta: fecha(f, { day: 'numeric' }), titulo: fechaCorta(f), valor: r.hayCaja ? r.real : r.teorico, provisional: !r.hayCaja });
  }

  $('tabla-dias').innerHTML = filas.join('') || '<tr><td colspan="4" class="vacio">No hay días con datos en este mes.</td></tr>';
  $('grafico-mes').innerHTML = barras.length ? grafico(barras) : '<p class="ayuda">Sin datos este mes.</p>';

  const prods = Object.values(porProducto).sort((a, b) => b.importe - a.importe);
  $('tabla-productos').innerHTML = prods.length
    ? prods.map((x) => `<tr><td>${escapar(x.p.nombre)}</td><td>${fmtCant(x.p, x.cantidad)}</td><td>${fmt(x.importe)}</td></tr>`).join('')
    : '<tr><td colspan="3" class="vacio">Sin ventas este mes.</td></tr>';

  const dif = t.real - fechas.reduce((a, f) => { const r = calcularDia(f); return a + (r.hayCaja ? r.teorico : 0); }, 0);
  const cifras = [
    ['Debería haber vendido', fmt(t.teorico)],
    ['Cobrado en caja', fmt(t.real)],
    ['Diferencia (días con caja)', `<span class="${claseDif(dif)}">${fmt(dif)}</span>`],
    ['Días con datos', filas.length],
    ['Vendido a peso', fmtKg(redondear(t.kg))],
    ['Congelado por unidades', fmtUd(t.uds)],
    ['Ganancia congelado', fmt(t.margen)],
    ['Mermas (a precio de venta)', fmt(t.mermas)],
  ];
  $('cifras-mes').innerHTML = cifras.map(([k, v]) => `<div class="cifra"><small>${k}</small><strong>${v}</strong></div>`).join('');
}

// ---------- Vista: productos ----------

function pintarProductos() {
  $('ajuste-ciegas').checked = ajustes.ciegas;
  $('ajuste-teclado').value = ajustes.teclado;

  $('lista-productos').innerHTML = Object.keys(TIPOS).map((tipo) => {
    const lista = porTipo(tipo);
    const esCong = tipo === 'congelado';
    const cab = esCong
      ? filaCab('Nombre', 'Formato', 'Se vende', 'Coste €', 'Venta €', 'Stock inicial', 'Stock ideal', '')
      : filaCab('Nombre', 'Merma %', '');
    const filas = lista.map((p) => {
      const campos = esCong
        ? `<input data-prod="formato" value="${escapar(p.formato || '')}" placeholder="bolsa 1 kg" aria-label="Formato">
           <select data-prod="unidad" aria-label="Se vende">
             <option value="ud"${aGranel(p) ? '' : ' selected'}>Por unidad</option>
             <option value="kg"${aGranel(p) ? ' selected' : ''}>A granel (kg)</option>
           </select>
           <input class="num" inputmode="decimal" data-prod="coste" value="${centATexto(p.coste)}" placeholder="0,00" aria-label="Coste">
           <input class="num" inputmode="decimal" data-prod="pvp" value="${centATexto(p.pvp)}" placeholder="0,00" aria-label="Precio de venta">
           <input class="num" inputmode="${modoTeclado(p)}" data-prod="stockInicial" value="${numATexto(p.stockInicial)}" placeholder="0" aria-label="Stock inicial">
           <input class="num" inputmode="${modoTeclado(p)}" data-prod="stockIdeal" value="${numATexto(p.stockIdeal)}" placeholder="0" aria-label="Stock ideal">`
        : `<input class="num" inputmode="decimal" data-prod="merma" value="${numATexto(p.merma || null)}" placeholder="0" aria-label="Merma">`;
      return `<div class="fila-prod" data-id="${p.id}">
        <input data-prod="nombre" value="${escapar(p.nombre)}" aria-label="Nombre">${campos}
        <button type="button" class="btn-borrar" data-borrar="${p.id}" aria-label="Borrar ${escapar(p.nombre)}">✕</button>
      </div>`;
    }).join('');
    return `<section class="tarjeta">${cabeceraCategoria(tipo, `${lista.length} productos`)}
      <div class="filas productos ${esCong ? 'f-cong' : ''}">${lista.length ? cab + filas : '<p class="ayuda">Sin productos.</p>'}</div></section>`;
  }).join('');
}

// ---------- Navegación ----------

const VISTAS = { inicio: pintarInicio, dia: pintarDia, congelado: pintarCongelado, resumen: pintarResumen, productos: pintarProductos };

function mostrarVista(nombre) {
  cerrarTeclado();
  document.querySelectorAll('.nav-btn').forEach((b) => {
    if (b.dataset.vista === nombre) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  for (const v of Object.keys(VISTAS)) $('vista-' + v).hidden = v !== nombre;
  VISTAS[nombre]();
  window.scrollTo(0, 0);
}

function irAFecha(f) {
  $('fecha').value = f;
  pasoActual = pasoSugerido(f);
  pintarDia();
}

document.querySelectorAll('.nav-btn').forEach((b) => b.addEventListener('click', () => mostrarVista(b.dataset.vista)));

// Botones que llevan a una vista, fecha o paso concretos
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-ir-vista]');
  if (!b) return;
  if (b.dataset.irFecha) $('fecha').value = b.dataset.irFecha;
  pasoActual = b.dataset.irPaso ? +b.dataset.irPaso : pasoSugerido($('fecha').value);
  mostrarVista(b.dataset.irVista);
});

document.querySelectorAll('.pasos button').forEach((b) => b.addEventListener('click', () => {
  pasoActual = +b.dataset.paso;
  pintarPasos();
  if (pasoActual === 3) pintarCuadre();
}));

$('fecha').addEventListener('change', () => irAFecha($('fecha').value));
$('dia-anterior').addEventListener('click', () => irAFecha(sumarDias($('fecha').value, -1)));
$('dia-siguiente').addEventListener('click', () => irAFecha(sumarDias($('fecha').value, 1)));
$('ir-hoy').addEventListener('click', () => irAFecha(hoyISO()));
$('buscar').addEventListener('input', aplicarBusqueda);

// ---------- Guardado automático del día ----------

$('vista-dia').addEventListener('input', (e) => {
  const i = e.target;
  const f = $('fecha').value;
  const { id } = i.dataset;

  if (i.dataset.fresco) {
    const d = diaEditable(f);
    const r = (d.fresco[id] ||= {});
    const campo = i.dataset.fresco;
    r[campo] = campo === 'pvp' ? aCentimos(i.value) : aKg(i.value);
    // Al poner kilos se fija el precio que se ve en pantalla para ese día
    if (campo === 'kg' && r.pvp == null) r.pvp = precio(f, id);
  } else if (i.dataset.congelado) {
    const d = diaEditable(f);
    const c = (d.congelado[id] ||= {});
    c[i.dataset.congelado] = leerCant(producto(id), i.value);
  } else if (i.dataset.caja) {
    const d = diaEditable(f);
    d.caja[i.dataset.caja] = i.dataset.caja === 'notas' ? i.value.trim() : aCentimos(i.value);
  } else if (i.dataset.den) {
    const d = diaEditable(f);
    d.caja.desglose = leerDesglose();
    const total = Object.entries(d.caja.desglose).reduce((s, [den, n]) => s + den * n, 0);
    d.caja.contado = total;
    document.querySelector('#cierre-form [data-caja="contado"]').value = centATexto(total);
  } else {
    return;
  }
  guardar();
});

// Al terminar de escribir kilos o reposiciones se actualizan el cierre y los pasos
$('vista-dia').addEventListener('change', (e) => {
  const i = e.target;
  if (i.dataset.fresco === 'kg' || i.dataset.congelado === 'repuesto') {
    i.closest('.fila-prod')?.classList.toggle('con-dato', !!aNumero(i.value));
    actualizarConteos();
    pintarCierre();
    pintarPasos();
  }
});

$('vista-dia').addEventListener('click', (e) => {
  const f = $('fecha').value;

  if (e.target.id === 'reabrir') {
    if (!confirm('¿Reabrir el cierre? Se podrán cambiar los recuentos y la caja.')) return;
    delete dias[f].cerrado;
    guardar();
    pasoActual = 2;
    pintarDia();
    return;
  }

  const borrar = e.target.closest('[data-borrar-salida]');
  if (borrar) {
    dias[f].salidas.splice(+borrar.dataset.borrarSalida, 1);
    guardar();
    pintarSalidas();
  }
});

$('rapido-leer').addEventListener('click', () => {
  const texto = $('rapido-texto').value.trim();
  if (!texto) {
    avisar('Pega o dicta primero la lista.');
    return;
  }
  pintarRevision(leerLista(texto));
});

$('foto-plantilla').addEventListener('change', (e) => {
  const archivo = e.target.files[0];
  e.target.value = '';
  if (archivo) leerFoto(archivo);
});

$('imprimir-plantilla').addEventListener('click', () => {
  construirPlantilla();
  window.print();
});

$('rapido').addEventListener('click', (e) => {
  if (e.target.id === 'rapido-pasar') pasarRevision();
  if (e.target.id === 'rapido-cancelar') $('rapido-revision').innerHTML = '';
});

$('salida-anadir').addEventListener('click', () => {
  const f = $('fecha').value;
  const p = producto($('salida-prod').value);
  const cant = p && leerCant(p, $('salida-cant').value);
  if (!p || !cant) {
    avisar('Elige un producto y pon la cantidad.');
    return;
  }
  diaEditable(f).salidas.push({
    prod: p.id, tipo: $('salida-tipo').value, cant, motivo: $('salida-motivo').value.trim(), hora: horaActual(),
  });
  guardar();
  $('salida-cant').value = '';
  $('salida-motivo').value = '';
  pintarSalidas();
  avisar('Apuntado.');
});

$('terminar-cierre').addEventListener('click', () => {
  const f = $('fecha').value;
  const caja = dias[f]?.caja || {};
  const faltan = [];
  if (!estadoDia(f).genero) faltan.push('no hay género apuntado');
  if (caja.contado == null) faltan.push('falta el efectivo contado');
  const texto = faltan.length
    ? `Atención: ${faltan.join(' y ')}.\n\n¿Terminar el cierre igualmente?`
    : 'Al terminar, los recuentos y la caja ya no se podrán cambiar. ¿Terminar el cierre?';
  if (!confirm(texto)) return;
  diaEditable(f).cerrado = { hora: horaActual() };
  guardar();
  pasoActual = 3;
  pintarDia();
  window.scrollTo(0, 0);
});

// ---------- Congelado, resumen y productos ----------

$('copiar-reposicion').addEventListener('click', async () => {
  const texto = textoReposicion();
  try {
    await navigator.clipboard.writeText(texto);
    avisar('Lista copiada.');
  } catch {
    prompt('Copia la lista:', texto);
  }
});

$('mes').addEventListener('change', pintarResumen);
$('tabla-dias').addEventListener('click', (e) => {
  const fila = e.target.closest('tr[data-fecha]');
  if (!fila) return;
  $('fecha').value = fila.dataset.fecha;
  pasoActual = 3;
  mostrarVista('dia');
});

$('ajuste-ciegas').addEventListener('change', (e) => {
  ajustes.ciegas = e.target.checked;
  guardar();
  avisar(ajustes.ciegas ? 'Cierre a ciegas activado.' : 'Cierre a ciegas desactivado.');
});
$('ajuste-teclado').addEventListener('change', (e) => {
  ajustes.teclado = e.target.value;
  guardar();
});

$('form-producto').addEventListener('submit', (e) => {
  e.preventDefault();
  const nombre = $('nuevo-nombre').value.trim();
  if (!nombre) return;
  const tipo = $('nuevo-tipo').value;
  let id = (tipo === 'congelado' ? 'cong-' : '') + slug(nombre);
  while (producto(id)) id += '-2';
  const codigo = siguienteCodigo();
  productos.push(tipo === 'congelado' ? { id, codigo, nombre, tipo, unidad: 'ud' } : { id, codigo, nombre, tipo, merma: 0 });
  guardar();
  $('nuevo-nombre').value = '';
  pintarProductos();
  avisar(`«${nombre}» añadido.`);
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
  const blob = new Blob([JSON.stringify({ productos, dias, ajustes }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `caja-luque-${hoyISO()}.json`;
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
    if (datos.ajustes) ajustes = { ...ajustes, ...datos.ajustes };
    guardar();
    pintarProductos();
    avisar('Copia restaurada.');
  } catch {
    avisar('El archivo no es una copia válida.');
  } finally {
    e.target.value = '';
  }
});

// ---------- Teclado del mostrador ----------

let campoTeclado = null;

function tecladoActivo() {
  if (ajustes.teclado === 'si') return true;
  if (ajustes.teclado === 'no') return false;
  return matchMedia('(pointer: coarse)').matches;
}

function etiquetaCampo(i) {
  const nombre = i.closest('.fila-prod')?.querySelector('.nombre-prod')?.firstChild?.textContent?.trim();
  if (nombre) return `${nombre} · ${i.dataset.etiqueta || ''}`;
  if (i.dataset.etiqueta) return i.dataset.etiqueta;
  return i.closest('label')?.firstChild?.textContent?.trim() || '';
}

function abrirTeclado(i) {
  campoTeclado?.classList.remove('activo');
  campoTeclado = i;
  i.dataset.modo ||= i.getAttribute('inputmode') || 'decimal';
  i.setAttribute('inputmode', 'none');
  i.classList.add('activo');
  $('teclado').hidden = false;
  document.body.classList.add('con-teclado');
  $('teclado-campo').textContent = etiquetaCampo(i);
  $('teclado-valor').textContent = i.value || '0';
  // El campo queda en la parte de arriba, por encima del teclado
  window.scrollBy({
    top: i.getBoundingClientRect().top - window.innerHeight * 0.2,
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  });
}

function cerrarTeclado() {
  campoTeclado?.classList.remove('activo');
  if (campoTeclado?.dataset.modo) campoTeclado.setAttribute('inputmode', campoTeclado.dataset.modo);
  campoTeclado = null;
  $('teclado').hidden = true;
  document.body.classList.remove('con-teclado');
}

document.addEventListener('focusin', (e) => {
  const i = e.target;
  if (i instanceof HTMLInputElement && i.classList.contains('num') && !i.disabled && tecladoActivo()) abrirTeclado(i);
  else if (!i.closest?.('#teclado')) cerrarTeclado();
});

document.addEventListener('pointerdown', (e) => {
  if (campoTeclado && !e.target.closest('#teclado') && !e.target.closest('input.num')) cerrarTeclado();
});

// Las teclas no quitan el foco al campo
$('teclado').addEventListener('pointerdown', (e) => e.preventDefault());

$('teclado').addEventListener('click', (e) => {
  const tecla = e.target.closest('[data-tecla]')?.dataset.tecla;
  const i = campoTeclado;
  if (!tecla || !i) return;

  if (tecla === 'listo' || tecla === 'siguiente') {
    i.dispatchEvent(new Event('change', { bubbles: true }));
    const campos = [...document.querySelectorAll('input.num')].filter((x) => !x.disabled && x.offsetParent !== null);
    const siguiente = tecla === 'siguiente' ? campos[campos.indexOf(i) + 1] : null;
    if (siguiente) { siguiente.focus(); abrirTeclado(siguiente); }
    else { i.blur(); cerrarTeclado(); }
    return;
  }

  let v = i.value;
  if (tecla === 'borrar') v = v.slice(0, -1);
  else if (tecla === 'limpiar') v = '';
  else if (tecla === ',') { if (i.dataset.modo !== 'numeric' && !v.includes(',')) v = (v || '0') + ','; }
  else v += tecla;
  i.value = v;
  i.dispatchEvent(new Event('input', { bubbles: true }));
  $('teclado-valor').textContent = v || '0';
});

// ---------- Inicio ----------

construirDesglose();
$('fecha').value = hoyISO();
$('mes').value = hoyISO().slice(0, 7);
pasoActual = pasoSugerido(hoyISO());
guardar();
mostrarVista('inicio');

// Instalable en el móvil y usable sin conexión
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
