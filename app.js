// Caja Luque — Pescaderías Adolfo
// Control de caja a partir del género. Importes en céntimos (enteros). Pesos en kg con 3 decimales.

const PILOTO = document.documentElement.hasAttribute('data-piloto');
const PREFIJO = PILOTO ? 'gpl.piloto.' : 'gpl.';
const CLAVE_PRODUCTOS = PREFIJO + 'productos';
const CLAVE_DIAS = PREFIJO + 'dias.v2';
const CLAVE_AJUSTES = PREFIJO + 'ajustes';
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
const aEntero = aNumero;

const centATexto = (c) => (c == null ? '' : typeof c === 'number' ? (c / 100).toFixed(2).replace('.', ',') : escapar(c));
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

const CLAVE_ESTADO = PREFIJO + 'estado.v3';
let versionLeida = null;
let bloqueoLectura = false;
let errorGuardado = false;
function avisoGuardado(mensaje) {
  $('guardado-error').hidden = !mensaje;
  $('guardado-mensaje').textContent = mensaje || '';
}

function cargar() {
  try {
    versionLeida = localStorage.getItem(CLAVE_ESTADO);
    if (versionLeida !== null) return MotorCierre.validarCopia(JSON.parse(versionLeida));
    const leer = (k, base) => JSON.parse(localStorage.getItem(k)) ?? base;
    const existentes = leer(CLAVE_PRODUCTOS, null);
    const lista = existentes || catalogoInicial();
    if (!localStorage.getItem(PREFIJO + 'marisco')) for (const nombre of MARISCO_INICIAL) {
      if (!lista.some(p => p.id === slug(nombre))) lista.push({ id: slug(nombre), nombre, tipo: 'marisco', merma: 0 });
    }
    if (!localStorage.getItem(PREFIJO + 'congelado')) for (const c of CONGELADO_INICIAL) {
      const id = 'cong-' + slug(c.nombre);
      if (!lista.some(p => p.id === id)) lista.push({ id, tipo: 'congelado', ...c });
    }
    return MotorCierre.validarCopia({ productos: lista, dias: leer(CLAVE_DIAS, {}), ajustes: leer(CLAVE_AJUSTES, {}) });
  } catch {
    bloqueoLectura = true;
    avisoGuardado('No se han podido leer los datos locales. Se ha protegido la copia del dispositivo. Restaura una copia válida desde Productos.');
    return { productos: [], dias: {}, ajustes: {} };
  }
}

function catalogoInicial() {
  return [
    ...FRESCO_INICIAL.map((nombre) => ({ id: slug(nombre), nombre, tipo: 'fresco', merma: 0 })),
    ...GORDO_INICIAL.map((nombre) => ({ id: slug(nombre), nombre, tipo: 'gordo', merma: 0 })),
  ];
}

const inicial = cargar();
let productos = inicial.productos, dias = inicial.dias;
let ajustes = { ciegas: true, teclado: 'auto', ...inicial.ajustes };

function guardar() {
  if (bloqueoLectura) return false;
  try {
    if (localStorage.getItem(CLAVE_ESTADO) !== versionLeida) {
      bloqueoLectura = true;
      avisoGuardado('Otra pestaña ha cambiado los datos. Recarga antes de continuar para usar la versión guardada.');
      return false;
    }
    const texto = JSON.stringify({ version: 3, productos, dias, ajustes });
    localStorage.setItem(CLAVE_ESTADO, texto);
    versionLeida = texto;
    errorGuardado = false;
    avisoGuardado('');
    return true;
  } catch {
    errorGuardado = true;
    avisoGuardado('No se ha guardado en este dispositivo. Mantén esta pestaña abierta y pulsa Reintentar.');
    return false;
  }
}

window.addEventListener('storage', (e) => {
  if ((e.key === CLAVE_ESTADO || e.key === null) && localStorage.getItem(CLAVE_ESTADO) !== versionLeida) {
    bloqueoLectura = true;
    avisoGuardado('Otra pestaña ha cambiado los datos. Recarga esta página antes de continuar.');
  }
});

const porTipo = (tipo) => productos.filter((p) => p.tipo === tipo && !p.archivado);
const producto = (id) => productos.find((p) => p.id === id);

// Congelado: cantidades en unidades o, si va a granel, en kg
const aGranel = (p) => p.tipo !== 'congelado' || p.unidad === 'kg';
const fmtCant = (p, n) => (aGranel(p) ? fmtKg(redondear(n)) : fmtUd(n));
const leerCant = (p, t) => (aGranel(p) ? aKg(t) : aEntero(t));
const modoTeclado = (p) => (aGranel(p) ? 'decimal' : 'numeric');

function diaEditable(f) {
  dias[f] ||= { fresco: {}, congelado: {}, caja: {} };
  const d = dias[f];
  d.fresco ||= {}; d.congelado ||= {}; d.caja ||= {}; d.salidas ||= []; d.fichas ||= {};
  return d;
}

// Precio del fresco: el de ese día o, si no se ha puesto, el último usado
function precio(f, id) {
  const fila = dias[f]?.fresco?.[id];
  if (fila && Object.hasOwn(fila,'pvp')) return fila.pvp;
  const anteriores = Object.keys(dias).filter((x) => x < f).sort().reverse();
  for (const x of anteriores) {
    const ultimoCambio = (dias[x].salidas || []).filter(m => m.prod === id && m.tipo === 'precio')
      .sort((a,b) => a.hora.localeCompare(b.hora) || (a.orden ?? 1) - (b.orden ?? 1)).at(-1);
    const p = ultimoCambio?.pvp ?? dias[x].fresco?.[id]?.pvp;
    if (p != null) return p;
  }
  return null;
}

function stockAntes(id, f) {
  let s = producto(id)?.stockInicial ?? 0;
  for (const x of Object.keys(dias).filter(y => y < f).sort()) {
    const d = dias[x], c = d.congelado?.[id] || {};
    if (c.quedan != null) s = c.quedan;
    else {
      s = (c.inicial ?? d.fichas?.[id]?.apertura ?? s) + (c.repuesto ?? 0);
      for (const m of d.salidas || []) if (m.prod === id && m.tipo !== 'precio') s += (m.tipo === 'entrada' ? 1 : -1) * m.cant;
    }
  }
  return redondear(s);
}
const stockActual = (id) => stockAntes(id, '9999-12-31');

function origenSinRecuento(id, f) {
  for (const fecha of Object.keys(dias).filter(x => x < f).sort().reverse()) {
    const d = dias[fecha], c = d.congelado?.[id];
    if (c?.quedan != null) return null;
    const l = d.cerrado?.informe?.lineas?.find(l => l.p.id === id);
    if (l && l.queda != null) return null;
    if (d.fichas?.[id]?.apertura || c?.repuesto || c?.inicial || d.salidas?.some(m => m.prod === id)) return fecha;
  }
  return null;
}
function fichasDelDia(f) {
  const d = dias[f] || {};
  const lista = { ...d.fichas };
  // En cuanto se fija la apertura, altas del catálogo y cambios de stock de otros días ya no crean género en este día.
  for (const p of productos) {
    if (lista[p.id]) continue;
    const referido = d.fresco?.[p.id] || d.congelado?.[p.id] || d.salidas?.some(m => m.prod === p.id);
    if (p.archivado && !referido) continue;
    const stock = p.tipo === 'congelado' && !d.aperturaFijada ? stockAntes(p.id, f) : 0;
    lista[p.id] = MotorCierre.ficha(p, p.tipo === 'congelado' ? p.pvp : precio(f,p.id), stock);
    if (p.tipo === 'congelado' && !d.aperturaFijada) {
      const anterior = origenSinRecuento(p.id, f);
      if (anterior) lista[p.id].origenPendiente = anterior;
    }
  }
  return Object.values(lista);
}
function fijarFichas(f) {
  const d = diaEditable(f);
  for (const p of fichasDelDia(f)) {
    if (p.apertura || p.origenPendiente || d.fresco[p.id] || d.congelado[p.id] || d.lotes?.[p.id] || d.salidas.some(m => m.prod === p.id)) d.fichas[p.id] ||= p;
  }
  d.aperturaFijada = true;
}
function materializarAntiguos() {
  for (const f of Object.keys(dias).sort()) {
    const d = dias[f];
    if (!d.cerrado || d.cerrado.informe) continue;
    const informe = MotorCierre.calcular(d, fichasDelDia(f));
    informe.legado = true;
    informe.faltas.unshift('Cierre antiguo sin registro de precios, costes, unidades y limpieza. Los kilos y cobros anotados se conservan; el previsto histórico no es verificable.');
    informe.teorico = null; informe.diferencia = null;
    d.cerrado.informe = informe;
  }
}
function calcularDia(f) {
  const d = dias[f] || {};
  return MotorCierre.ver(d, d.cerrado?.informe || MotorCierre.calcular(d, fichasDelDia(f)));
}
function estadoDia(f) {
  const d = dias[f];
  return { genero: !!(d && (d.sinGenero || calcularDia(f).lineas.length)), cerrado: d?.cerrado || null };
}
const importeVisible = n => n == null ? 'Pendiente' : fmt(n);
const firmado = n => n == null ? 'Pendiente' : (n > 0 ? '+' : '') + fmt(n).replace('-', '−');
const problemas = (lista) => lista.length ? '<ul class="incidencias">' + lista.map(x => '<li>' + escapar(x) + '</li>').join('') + '</ul>' : '';

const claseDif = (c) => c == null ? 'pendiente' : (c === 0 ? 'ok' : c < 0 ? 'falta' : 'sobra');
const textoDif = (c) => c == null ? 'Pendiente de revisión' : (c === 0 ? 'Cuadra' : (c < 0 ? 'Faltan ' : 'Sobran ') + fmt(Math.abs(c)));

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

function bloqueResultado(r, enlace = '') {
  const clase = r.sinExplicar == null ? 'pendiente' : claseDif(r.sinExplicar);
  const estado = r.sinExplicar == null ? 'Pendiente de revisión' : r.diferencia === 0 ? 'Cuadra al céntimo'
    : r.sinExplicar === 0 ? 'Diferencia justificada' : 'Diferencia por revisar';
  return `<div class="resultado ${clase}">${r.sinExplicar === 0 ? ICONO.ok : ICONO.alerta}<div><p class="grande">${estado}</p>
    <p>Previsto ${importeVisible(r.teorico)} · Cobrado ${importeVisible(r.real)}</p>
    <p>Diferencia inicial ${firmado(r.diferencia)} · Sin explicar ${firmado(r.sinExplicar)}</p></div>${enlace}</div>`;
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
  let pendienteMes = 0;
  const barras = [];
  for (let i = 6; i >= 0; i--) {
    const f = sumarDias(hoy, -i);
    const x = calcularDia(f);
    if (x.cerrado && x.real != null) semana += x.real;
    barras.push({
      etiqueta: fecha(f, { weekday: 'short' }).replace('.', ''),
      titulo: fechaCorta(f),
      valor: x.cerrado ? (x.real ?? 0) : 0,
      provisional: !x.cerrado,
      hoy: i === 0,
    });
  }
  for (const f of Object.keys(dias).filter((x) => x.startsWith(hoy.slice(0, 7)))) {
    const x = calcularDia(f);
    if (x.cerrado && x.sinExplicar != null) pendienteMes += Math.abs(x.sinExplicar);
  }
  const cifras = [
    ['Previsto hoy', r.cerrado ? importeVisible(r.teorico) : 'Tras el cierre'],
    ['Cobrado hoy', r.cerrado ? importeVisible(r.real) : 'Pendiente'],
    ['Cobrado ayer', ayer.cerrado ? importeVisible(ayer.real) : 'Pendiente'],
    ['Últimos 7 días', fmt(semana)],
    ['Euros sin explicar en cierres verificables', fmt(pendienteMes)],
  ];
  $('inicio-cifras').innerHTML = cifras.map(([k, v]) => `<div class="cifra"><small>${k}</small><strong>${v}</strong></div>`).join('');
  $('inicio-grafico').innerHTML = grafico(barras);

  // Avisos
  const avisos = [];
  for (let i = 1; i <= 14; i++) {
    const f = sumarDias(hoy, -i);
    const x = estadoDia(f);
    if (dias[f] && !x.cerrado) {
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
  const congSinPrecio = porTipo('congelado').filter((p) => stockActual(p.id) > 0 && !p.pvp).length;
  if (congSinPrecio) {
    avisos.push({ titulo: `${congSinPrecio} productos congelados sin precio`, texto: 'La app pedirá el precio si hay venta.', boton: 'Poner precios', datos: 'data-ir-vista="productos"' });
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
  $('estado-paso-3').textContent = e.cerrado ? (r.diferencia === 0 ? 'Cuadra' : r.sinExplicar === 0 ? 'Justificado' : 'Revisar') : ajustes.ciegas ? 'Tras el cierre' : 'Provisional';
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
      <span class="nombre-prod">${escapar(p.nombre)}${p.merma ? ` <small class="etiqueta">merma ${numATexto(p.merma)} %</small>` : ''}</span>
      <input type="text" class="num" inputmode="decimal" data-fresco="kg" data-id="${p.id}" data-etiqueta="kilos" value="${numATexto(r.kg)}" placeholder="0" aria-label="Kilos de ${escapar(p.nombre)}">
      <input type="text" class="num" inputmode="decimal" data-fresco="pvp" data-id="${p.id}" data-etiqueta="€/kg" value="${centATexto(precio(f, p.id))}" placeholder="0,00" aria-label="Precio por kilo de ${escapar(p.nombre)}">
    </div>`;
  };

  const secciones = A_PESO.map((tipo) => {
    const lista = fichasDelDia(f).filter(p => p.tipo === tipo);
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

  const cong = fichasDelDia(f).filter(p => p.tipo === 'congelado');
  if (cong.length) {
    secciones.push(`<section class="tarjeta categoria">
      ${cabeceraCategoria('congelado', 'Lo que hay en la tienda y lo que repones hoy')}
      ${filaCab('Producto', 'Hay', 'Repongo')}
      ${cong.map((p) => `<div class="fila-prod${d.congelado?.[p.id]?.repuesto ? ' con-dato' : ''}" data-nombre="${escapar(normalizar(p.nombre))}">
        <span class="nombre-prod">${escapar(p.nombre)}${p.formato ? ` <small class="etiqueta">${escapar(p.formato)}</small>` : ''}</span>
        <span class="dato">${fmtCant(p, p.apertura)}</span>
        <input type="text" class="num" inputmode="${modoTeclado(p)}" data-congelado="repuesto" data-id="${p.id}" data-etiqueta="repongo" value="${numATexto(d.congelado?.[p.id]?.repuesto)}" placeholder="0" aria-label="Repongo de ${escapar(p.nombre)}">
      </div>`).join('')}
    </section>`);
  }

  $('genero').innerHTML = secciones.join('');
  const fondo = document.querySelector('[data-caja="fondo"]');
  fondo.value = centATexto(dias[f]?.caja?.fondo);
  $('sin-genero').checked = !!d.sinGenero;
  $('cong-apertura').innerHTML = cong.length ? '<summary>Comprobar apertura o precio del congelado</summary>' + cong.map(p => {
    const c = d.congelado?.[p.id] || {};
    return `<div class="fila-prod"><span>${escapar(p.nombre)} <small>${escapar(p.unidad)}</small></span>
      <input inputmode="decimal" data-congelado="inicial" data-id="${p.id}" value="${numATexto(c.inicial)}" placeholder="${numATexto(p.apertura)}" aria-label="Apertura física de ${escapar(p.nombre)}">
      <input inputmode="decimal" data-congelado="pvp" data-id="${p.id}" value="${centATexto(Object.hasOwn(c,'pvp') ? c.pvp : p.pvp)}" placeholder="€/kg o ud" aria-label="PVP inicial de ${escapar(p.nombre)}"></div>`;
  }).join('') : '';
  $('cong-apertura').hidden = !cong.length;
  $('lote-producto').innerHTML = fichasDelDia(f).filter(p => p.tipo !== 'congelado').map(p => `<option value="${p.id}">${escapar(p.nombre)}</option>`).join('');
  pintarLote();
  document.querySelectorAll('#panel-1 input:not([type=search]), #panel-1 textarea, #panel-1 select, #rapido button, #lote-guardar, #borrar-dia').forEach(el => { el.disabled = !!d.cerrado; });
  if (d.correccion) $('borrar-dia').disabled = true;
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

  $('legado-comprobacion').hidden = !d.correccion?.antes?.cerrado?.informe?.legado;
  $('legado-parte').value = d.parteLegado || '';
  $('cierre-form').disabled = !!cerrado;
  $('terminar-cierre').hidden = !!cerrado;
  $('cierre-estado').innerHTML = cerrado
    ? `<div class="aviso ok">${ICONO.candado}
        <div><strong>Cierre terminado a las ${cerrado.hora}</strong><p>Los recuentos ya no se pueden cambiar.</p></div>
        <button class="btn secundario" id="reabrir">Reabrir cierre</button></div>`
    : '';

  const refs = calcularDia(f).lineas;
  const llevados = refs.filter(l => l.p.tipo !== 'congelado').map(l => l.p);
  $('cierre-fresco').innerHTML = llevados.length
    ? (ciega ? filaCab('Producto', 'Sobra kg') : filaCab('Producto', 'Empezó', 'Sobra kg')) + llevados.map((p) => {
      const r = d.fresco?.[p.id] || {};
      return `<div class="fila-prod${ciega ? ' dos' : ''}">
        <span class="nombre-prod">${escapar(p.nombre)}</span>
        ${ciega ? '' : `<span class="dato">${fmtKg(r.kg)}</span>`}
        <input type="text" class="num" inputmode="decimal" data-fresco="sobra" data-id="${p.id}" data-etiqueta="sobra (kg)" value="${numATexto(r.sobra)}" placeholder="Pendiente" aria-label="Kilos que sobran de ${escapar(p.nombre)}">
      </div>`;
    }).join('')
    : '<p class="ayuda">Todavía no se ha apuntado el género del día (paso 1).</p>';

  const cong = refs.filter(l => l.p.tipo === 'congelado').map(l => l.p);
  $('cierre-congelado').innerHTML = cong.length
    ? (ciega ? filaCab('Producto', 'Quedan') : filaCab('Producto', 'Había', 'Quedan')) + cong.map((p) => {
      const c = d.congelado?.[p.id] || {};
      const habia = redondear((c.inicial ?? p.apertura) + (c.repuesto || 0));
      return `<div class="fila-prod${ciega ? ' dos' : ''}">
        <span class="nombre-prod">${escapar(p.nombre)}${p.formato ? ` <small class="etiqueta">${escapar(p.formato)}</small>` : ''}</span>
        ${ciega ? '' : `<span class="dato">${fmtCant(p, habia)}</span>`}
        <input type="text" class="num" inputmode="${modoTeclado(p)}" data-congelado="quedan" data-id="${p.id}" data-etiqueta="quedan" value="${numATexto(c.quedan)}" placeholder="Pendiente" aria-label="Quedan de ${escapar(p.nombre)}">
      </div>`;
    }).join('')
    : '<p class="ayuda">No hay productos congelados.</p>';

  // Retiradas y mermas
  const opciones = fichasDelDia(f).sort((a,b) => Number(refs.some(l => l.p.id === b.id)) - Number(refs.some(l => l.p.id === a.id)));
  $('salida-prod').innerHTML = opciones.length
    ? opciones.map((p) => `<option value="${p.id}">${escapar(p.nombre)} (${aGranel(p) ? 'kg' : 'uds'})</option>`).join('')
    : '<option value="">Sin productos</option>';
  pintarSalidas();
  $('mov-hora').value ||= horaActual();
  configurarMovimiento();
  mostrarFaltas(false);

  document.querySelectorAll('#cierre-form [data-caja]').forEach((i) => {
    const v = d.caja?.[i.dataset.caja];
    i.value = i.dataset.caja === 'notas' ? (v || '') : centATexto(v);
  });
  escribirDesglose(d.caja?.desglose || {});
}

const nombresMov = { precio: 'Cambio de PVP', entrada: 'Entrada', merma: 'Pescado tirado', traslado: 'Traslado', retirada: 'Otra salida' };
function configurarMovimiento() {
  const tipo = $('salida-tipo').value;
  $('mov-etiqueta').textContent = tipo === 'precio' ? 'Cantidad que quedaba al cambiar el precio' : 'Cantidad (kg o unidades)';
  $('mov-precio-label').hidden = tipo !== 'precio';
  $('mov-destino-label').hidden = tipo !== 'traslado';
}
function pintarSalidas() {
  const f = $('fecha').value, d = dias[f] || {};
  const fichas = fichasDelDia(f);
  const lista = (d.salidas || []).map((m,i) => ({ m, i })).sort((a,b) => String(a.m.hora).localeCompare(String(b.m.hora)) || (a.m.orden ?? 1) - (b.m.orden ?? 1));
  $('lista-salidas').innerHTML = lista.map(({ m, i }) => {
    const p = fichas.find(x => x.id === m.prod);
    const cantidad = p ? fmtCant(p, m.cant) : numATexto(m.cant);
    return `<div class="salida"><span>${escapar(m.hora || 'Sin hora')} · #${escapar(m.orden ?? 1)}</span>
      <span><strong>${escapar(p?.nombre || m.prod)}</strong> · ${escapar(nombresMov[m.tipo] || m.tipo)}
      <small>${cantidad}${m.tipo === 'precio' ? ' a ' + fmt(m.pvp) : ''}${m.destino ? ' → ' + escapar(m.destino) : ''}
      ${m.motivo ? ' · ' + escapar(m.motivo) : ''}</small></span>
      <button type="button" class="btn-borrar" data-borrar-salida="${i}" aria-label="Quitar movimiento">✕</button></div>`;
  }).join('');
}
let intentoCierre = false;
function mostrarFaltas(intentar) {
  if (intentar) intentoCierre = true;
  const r = calcularDia($('fecha').value), el = $('faltas-cierre');
  el.hidden = !!r.cerrado || !intentoCierre || !r.faltas.length;
  el.innerHTML = el.hidden ? '' : '<strong>Falta revisar</strong>' + problemas(r.faltas);
  if (intentar && !el.hidden) {
    el.focus();
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
}
function pintarLote() {
  const id = $('lote-producto').value, lote = dias[$('fecha').value]?.lotes?.[id] || {};
  for (const [campo,clave] of Object.entries({ cajas:'cajas', netos:'kgNetos', luque:'kgLuque' })) $('lote-' + campo).value = numATexto(lote[clave]);
  $('lote-precio').value = centATexto(lote.precioCaja);
  const c = MotorCierre.compra(lote);
  $('lote-estado').textContent = Object.keys(lote).length ? 'Base ' + importeVisible(c.base) + ' · Coste por kg ' + (c.coste == null ? 'pendiente del peso neto y la base' : fmt(c.coste)) + ' · Asignado a Luque ' + importeVisible(c.asignado) : '';
}

function pintarCuadre() {
  const f = $('fecha').value, d = dias[f] || {}, r = calcularDia(f);
  if (ajustes.ciegas && !r.cerrado) {
    $('cuadre').innerHTML = `<div class="resultado pendiente">${ICONO.candado}<div><p class="grande">El cuadre sale al terminar el cierre</p>
      <p>${d.correccion ? 'Corrección en curso. ' : ''}Introduce los recuentos y los cobros en el paso 2.</p></div>
      <button class="btn primario" data-ir-vista="dia" data-ir-paso="2">Ir al cierre</button></div>`;
    return;
  }
  const cifras = [['Previsto', importeVisible(r.teorico)], ['Cobrado', importeVisible(r.real)],
    ['Diferencia inicial', firmado(r.diferencia)], ['Sin explicar', firmado(r.sinExplicar)]];
  const detalle = r.lineas.map(l => {
    const cantidad = x => fmtCant(l.p, x);
    const tramos = l.tramos.map(t => `<p class="ayuda">${escapar(t.desde)}–${escapar(t.hasta)} · ${cantidad(t.bruto)}
      ${l.p.merma ? ' menos ' + numATexto(l.p.merma) + ' % de limpieza' : ''} × ${importeVisible(t.pvp)} = ${importeVisible(t.importe)}</p>`).join('');
    return `<details><summary>${escapar(l.p.nombre)} · ${r.legado ? 'Sin previsto verificable' : importeVisible(l.importe)}</summary>
      <p>Apertura ${cantidad(l.inicio)} · Recuento ${l.queda == null ? 'pendiente' : cantidad(l.queda)}</p>
      ${r.legado ? '' : tramos + '<p>Coste del género tirado ' + importeVisible(l.costeTirado) + ' · Margen tras merma ' + importeVisible(l.margen) + '</p>'}
      ${l.salidasDetalle.map(m => '<p>' + escapar(nombresMov[m.tipo] || m.tipo) + ' · ' + cantidad(m.cant) + (m.destino ? ' → ' + escapar(m.destino) : '') + (m.motivo ? ' · ' + escapar(m.motivo) : '') + ' · ' + escapar(m.hora || 'Sin hora') + '</p>').join('')}</details>`;
  }).join('');
  const c = r.caja;
  const cuadreCaja = `<details class="tarjeta"><summary>Desglose de caja</summary><p>Cajón ${importeVisible(c.contado)} − fondo ${importeVisible(c.fondo)}
    + gastos ${fmt(c.gastos)} + retiradas previas ${fmt(c.retiradas)} − entradas de efectivo ${fmt(c.ingresos)} = ${r.real == null ? 'pendiente' : fmt(r.efectivoVendido)} en efectivo.</p>
    <p>Tarjeta ${importeVisible(c.tarjeta)} · Bizum ${importeVisible(c.bizum)}</p>
    ${c.fondoManana == null ? '' : '<p>Después del recuento se dejan ' + fmt(c.fondoManana) + ' para mañana.</p>'}
    ${c.notas ? '<p>Nota · ' + escapar(c.notas) + '</p>' : ''}</details>`;
  const justificaciones = (d.justificaciones || []).map(j => '<p>' + firmado(j.importe) + ' · ' + escapar(j.comprobante) + ' · ' + escapar(j.fecha) + '</p>').join('');
  const registro = (d.revisiones || []).map(v => {
    const previo = v.antes.cerrado.informe, actual = v.despues.cerrado.informe;
    return `<details class="revision-registro"><summary>${escapar(v.motivo)} · ${escapar(v.terminado)}</summary>
      <p>Antes · previsto ${importeVisible(previo?.teorico)}, cobrado ${importeVisible(previo?.real)}. Después · previsto ${importeVisible(actual?.teorico)}, cobrado ${importeVisible(actual?.real)}.</p>
      <details><summary>Ver anotaciones antes y después</summary><pre>${escapar(JSON.stringify({ antes: v.antes, despues: v.despues },null,2))}</pre></details></details>`;
  }).join('');
  const estado = !r.cerrado ? 'Provisional · día abierto' : r.diferencia == null ? 'Cierre pendiente de revisión'
    : r.diferencia === 0 ? 'Cuadra al céntimo' : r.sinExplicar === 0 ? 'Diferencia justificada' : 'Diferencia por revisar';
  $('cuadre').innerHTML = `<h2>${estado}</h2><div class="revision-cifras">${cifras.map(([k,v]) => '<div class="cifra"><small>' + k + '</small><strong>' + v + '</strong></div>').join('')}</div>
    ${problemas(r.faltas)}
    ${r.margenPendiente.length ? '<details class="tarjeta"><summary>Margen o reparto pendiente</summary>' + problemas(r.margenPendiente) + '</details>' : ''}
    ${r.cerrado && r.sinExplicar != null && r.sinExplicar !== 0 ? `<details class="tarjeta"><summary>Justificar parte de la diferencia</summary>
      <label>Importe con signo (€)<input id="just-importe" type="text" placeholder="Ej. −1,00"></label>
      <label>Comprobante o referencia verificable<input id="just-ref" type="text"></label>
      <button class="btn secundario" id="just-guardar">Guardar justificación</button></details>` : ''}
    ${justificaciones ? '<section class="tarjeta"><h2>Justificaciones</h2>' + justificaciones + '</section>' : ''}
    <section class="tarjeta"><h2>Género y ventas por tramo</h2>${detalle || '<p>Sin género.</p>'}</section>
    ${cuadreCaja}${registro ? '<section class="tarjeta"><h2>Correcciones</h2>' + registro + '</section>' : ''}`;
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

// ---------- Dictado y pegado de género ----------

const VACIAS = new Set([
  'de', 'del', 'a', 'al', 'el', 'la', 'los', 'las', 'kg', 'kgs', 'kilo', 'kilos', 'k', 'euro', 'euros', 'eur',
  'e', 'precio', 'kilogramo', 'kilogramos', 'y', 'x', 'por', 'cada', 'unidad', 'unidades', 'ud', 'uds', 'bolsa', 'bolsas', 'n', 'no', 'num',
]);
const NUMEROS = {
  cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
  veinte: 20, veintiuno: 21, veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
  treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90, cien: 100,
};
const numeroHablado = new RegExp('\\b(' + Object.keys(NUMEROS).join('|') + ')\\b', 'g');

function trocear(texto) {
  const t = normalizar(texto)
    .replace(/\b(treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa) y (uno|un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\b/g,
      (_, decena, unidad) => NUMEROS[decena] + NUMEROS[unidad])
    .replace(numeroHablado, (m) => NUMEROS[m])
    .replace(/(\d+)\s+(?:(euros?|kilos?)\s+)?(?:con|coma)\s+(\d+)(?:\s+(centimos?))?/g,
      (_, entero, unidad, decimal, centimos) => entero + ',' + (centimos ? decimal.padStart(2, '0') : decimal) + (centimos ? ' euros' : unidad ? ' ' + unidad : ''))
    .replace(/(\d+)\s+(?:kilos?\s+)?y\s+medio\b/g, '$1,5 kilos')
    .replace(/(\d+)\s+(?:kilos?\s+)?y\s+cuarto\b/g, '$1,25 kilos')
    .replace(/\bkilo\s+y\s+medio\b/g, '1,5 kilos')
    .replace(/\bmedio\s+kilo\b/g, '0,5 kilos')
    .replace(/\bmenos\s+(?=\d)/g, '-');
  const tokens = [...t.matchAll(/[−-]?\d+(?:[.,]\d+)?|[a-z]+|€/g)].map(([m]) => m);
  return tokens.map((m, i) => {
    if (!/\d/.test(m)) return { palabra: m };
    const siguiente = tokens[i + 1];
    const unidad = /^(kg|kgs|k|kilos?|kilogramos?|unidades?|uds?|bolsas?)$/.test(siguiente) ? 'cantidad'
      : /^(euros?|eur|€)$/.test(siguiente) || tokens[i - 1] === 'a' ? 'precio' : null;
    return { num: Number(m.replace('−', '-').replace(',', '.')), unidad,
      antesDeProducto: unidad === 'cantidad' && tokens[i + 2] === 'de' };
  }).filter(x => x.num != null || (x.palabra !== '€' && !VACIAS.has(x.palabra)));
}

const VOCES_GENERO = {
  gordo: 'grande', gorda: 'grande', gordos: 'grande', gordas: 'grande', grandes: 'grande',
  pequena: 'chico', pequeno: 'chico', pequenas: 'chico', pequenos: 'chico',
  chica: 'chico', chicas: 'chico', chicos: 'chico',
  mediana: 'mediano', medianas: 'mediano', medianos: 'mediano',
  bocaladillo: 'bacaladilla', bocaladillos: 'bacaladilla', bocalaillo: 'bacaladilla', bacalaillo: 'bacaladilla', bacalaito: 'bacaladilla', bacaladillo: 'bacaladilla', bacaladillos: 'bacaladilla',
  hijota: 'pijota', hijotas: 'pijota',
};
const vozGenero = palabra => Object.hasOwn(VOCES_GENERO, palabra) ? VOCES_GENERO[palabra] : palabra;
const mismaPalabra = (a, b) => a === b || a + 's' === b || b + 's' === a || a + 'es' === b || b + 'es' === a;

function leerLista(texto) {
  const candidatos = productos.filter(p => !p.archivado)
    .map(p => ({ p, palabras: trocear(p.nombre).map(x => x.palabra).filter(Boolean) }))
    .filter(c => c.palabras.length)
    .sort((a, b) => b.palabras.length - a.palabras.length);
  const filas = new Map();
  const sueltas = [];

  // Cada pausa escrita o «y después» permite empezar con otro orden.
  for (const frase of texto.split(/\n|[;!?]|[.,](?!\d)|\b(?:y\s+)?(?:despu[eé]s|luego|a continuaci[oó]n)\b/iu)) {
    const tokens = trocear(frase);
    const marcas = [];
    for (let i = 0; i < tokens.length;) {
      const encajan = comparar => candidatos.filter(c => c.palabras.every((w, k) =>
        tokens[i + k]?.palabra && comparar(w, tokens[i + k].palabra)));
      const literales = encajan(mismaPalabra);
      const coloquiales = encajan((a, b) => mismaPalabra(vozGenero(a), vozGenero(b)));
      // En este catálogo la bacaladilla mediana es la referencia sin tamaño.
      const bacaladilla = coloquiales.find(c => c.palabras.length === 1 && mismaPalabra(c.palabras[0], 'bacaladilla'));
      const quitarMediano = bacaladilla && vozGenero(tokens[i + 1]?.palabra) === 'mediano'
        && !coloquiales.some(c => c.palabras.length > 1);
      const coinciden = quitarMediano ? [bacaladilla] : coloquiales;
      const largo = quitarMediano ? 2 : coinciden[0]?.palabras.length;
      const exacto = literales.find(c => c.palabras.length === largo);
      const opciones = coinciden.filter(c => quitarMediano || c.palabras.length === largo);
      const tallaSuelta = ['grande', 'mediano', 'chico'].includes(vozGenero(tokens[i + (largo ?? 0)]?.palabra));
      const candidato = tallaSuelta ? null : exacto || (opciones.length === 1 ? opciones[0] : null);
      if (candidato) {
        marcas.push({ p: candidato.p, inicio: i, fin: i + largo });
        i += largo;
      } else {
        if (tokens[i].palabra) sueltas.push(tokens[i].palabra);
        i++;
      }
    }
    const prefijo = tokens.slice(0, marcas[0]?.inicio ?? 0);
    const cantidadPrimero = prefijo.some(x => x.num != null) && prefijo.every(x => x.num != null);
    const entre = marcas.map((marca, i) => {
      const tramo = tokens.slice(marcas[i - 1]?.fin ?? 0, marca.inicio);
      if (!i) return { anterior: [], siguiente: tramo };
      // «… a seis euros dos kilos de dorada …» reparte el hueco entre dos productos.
      const ultimo = tramo.at(-1);
      if (ultimo?.antesDeProducto) return { anterior: tramo.slice(0, -1), siguiente: [ultimo] };
      return cantidadPrimero ? { anterior: [], siguiente: tramo } : { anterior: tramo, siguiente: [] };
    });
    marcas.forEach((marca, i) => {
      const antes = entre[i].siguiente;
      const despues = entre[i + 1]?.anterior ?? tokens.slice(marca.fin);
      // Una palabra desconocida puede ser otro producto. Sus números no se arrastran.
      const desdeProducto = tramo => {
        const corte = tramo.findIndex(x => x.palabra);
        return corte < 0 ? tramo : tramo.slice(0, corte);
      };
      const nums = [...desdeProducto([...antes].reverse()).reverse(), ...desdeProducto(despues)];
      const cong = marca.p.tipo === 'congelado';
      const cantidad = nums.find(x => x.unidad === 'cantidad');
      const precio = nums.find(x => x.unidad === 'precio');
      const libres = nums.filter(x => !x.unidad);
      const kg = cantidad?.num ?? libres.shift()?.num ?? null;
      const importe = precio?.num ?? libres.shift()?.num ?? null;
      const anterior = filas.get(marca.p.id);
      if (anterior && !nums.length) {
        anterior.repetido = true;
        return;
      }
      filas.set(marca.p.id, {
        p: marca.p,
        kg: cong ? null : kg,
        pvp: cong || importe == null ? null : Math.round(importe * 100),
        repuesto: cong ? kg : null,
        sobran: nums.length > (cong ? 1 : 2) || !!libres.length
          || nums.filter(x => x.unidad === 'cantidad').length > 1
          || nums.filter(x => x.unidad === 'precio').length > (cong ? 0 : 1),
        repetido: !!anterior,
      });
    });
  }
  const todas = [...filas.values()];
  const tieneDatos = x => x.kg != null || x.repuesto != null || x.pvp != null;
  return { filas: todas.filter(tieneDatos), sueltas, sinDatos: todas.filter(x => !tieneDatos(x)) };
}

function pintarRevision(res) {
  const f = $('fecha').value;
  const d = dias[f] || { fresco: {}, congelado: {} };
  if (!res.filas.length) {
    $('rapido-revision').innerHTML = `<div class="aviso">${ICONO.alerta}<div><strong>No he reconocido productos con cantidades</strong>
      <p>Prueba «boquerón gordo tres kilos» o «tres kilos de boquerón gordo».</p></div></div>`;
    return;
  }

  const celda = (campo, texto, modo, etiqueta) => `<span class="celda-rev">
    <input type="text" class="num" inputmode="${modo}" data-campo="${campo}" aria-label="${etiqueta}" data-etiqueta="${etiqueta}" value="${texto}" placeholder="${etiqueta}">
  </span>`;

  const filas = res.filas.map((x) => {
    const notas = [];
    const p = x.p;
    if (x.repetido) notas.push('aparece dos veces');
    if (x.sobran) notas.push('había números de más');
    const ambigua = x.repetido || x.sobran;
    if (p.tipo === 'congelado') {
      const antes = d.congelado?.[p.id]?.repuesto;
      if (antes != null && antes !== x.repuesto) notas.push(`antes ${numATexto(antes)}`);
      return `<div class="fila-prod rev${ambigua || x.repuesto < 0 ? ' dudosa' : ''}" data-rev="${p.id}">
        <input type="checkbox" ${!ambigua && x.repuesto != null && x.repuesto >= 0 ? 'checked' : ''} aria-label="Pasar ${escapar(p.nombre)}">
        <span class="nombre-prod">${escapar(p.nombre)}<small class="nota">Repongo${notas.length ? ' · ' + notas.join(' · ') : ''}</small></span>
        ${celda('repuesto', numATexto(x.repuesto), modoTeclado(p), 'repongo')}
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
    return `<div class="fila-prod rev${raro || x.kg == null || x.kg < 0 || ambigua ? ' dudosa' : ''}" data-rev="${p.id}">
      <input type="checkbox" ${x.kg != null && x.kg >= 0 && !ambigua ? 'checked' : ''} aria-label="Pasar ${escapar(p.nombre)}">
      <span class="nombre-prod">${escapar(p.nombre)}${notas.length ? `<small class="nota">${notas.join(' · ')}</small>` : ''}</span>
      ${celda('kg', numATexto(x.kg), 'decimal', 'kilos')}
      ${celda('pvp', centATexto(pvp), 'decimal', '€/kg')}
    </div>`;
  }).join('');

  const sinReconocer = [...res.sueltas, ...res.sinDatos.map(x => x.p.nombre + ' sin cantidad')];
  const desconocidas = sinReconocer.length
    ? `<div class="aviso">${ICONO.alerta}<div><strong>No reconozco</strong><p>${sinReconocer.map((s) => `«${escapar(s)}»`).join(', ')}</p></div></div>`
    : '';

  $('rapido-revision').dataset.fecha = f;
  $('rapido-revision').innerHTML = `<h3>Revisa antes de pasar al día</h3>
    <p class="ayuda">Comprueba los marcados en amarillo y quita la marca de lo que no quieras pasar.</p>
    <div class="filas">${filaCab('', 'Producto', 'Kilos', '€/kg').replace('fila-prod cab', 'fila-prod cab rev')}${filas}</div>
    ${desconocidas}
    <div class="botones">
      <button type="button" class="btn primario" id="rapido-pasar">Guardar selección</button>
      <button type="button" class="btn secundario" id="rapido-cancelar">Cancelar</button>
    </div>`;
}

function pasarRevision() {
  const f = $('fecha').value;
  if (dias[f]?.cerrado || bloqueoLectura) return;
  if ($('rapido-revision').dataset.fecha !== f) {
    avisar('Revisa la lista para el día que tienes abierto.');
    return;
  }
  const seleccion = [...$('rapido-revision').querySelectorAll('[data-rev]')]
    .filter(fila => fila.querySelector('input[type="checkbox"]').checked)
    .map(fila => {
      const p = producto(fila.dataset.rev);
      const valor = campo => fila.querySelector(`[data-campo="${campo}"]`)?.value;
      const congelado = p?.tipo === 'congelado';
      return {
        p, congelado,
        cantidad: congelado ? leerCant(p, valor('repuesto')) : aKg(valor('kg')),
        importe: congelado ? null : aCentimos(valor('pvp')),
        precioEscrito: !congelado && !!valor('pvp')?.trim(),
      };
    });
  if (!seleccion.length) {
    avisar('Marca al menos un producto para guardarlo.');
    return;
  }
  const invalido = seleccion.find(x => !x.p || x.p.archivado || x.cantidad == null || x.cantidad < 0
    || (x.precioEscrito && (x.importe == null || x.importe <= 0)));
  if (invalido) {
    avisar(`Revisa la cantidad y el precio de ${invalido.p?.nombre ?? 'la selección'}.`);
    return;
  }
  const d = diaEditable(f);
  for (const { p, congelado, cantidad, importe } of seleccion) {
    if (congelado) (d.congelado[p.id] ||= {}).repuesto = cantidad;
    else {
      const r = (d.fresco[p.id] ||= {});
      r.kg = cantidad;
      r.pvp = importe ?? precio(f, p.id);
    }
  }
  fijarFichas(f);
  if (!guardar()) return;
  $('rapido-revision').innerHTML = '';
  $('rapido-texto').value = '';
  pintarDia();
  avisar(`${seleccion.length} productos guardados.`);
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
  const mes = $('mes').value, fechas = Object.keys(dias).filter(f => f.startsWith(mes)).sort();
  let teorico = 0, real = 0, inicial = 0, abiertos = 0, historicos = 0, verificables = 0, revisables = 0;
  let faltan = 0, sobran = 0, kg = 0, uds = 0, margen = 0, mermas = 0, sinCoste = false;
  const porProducto = new Map(), barras = [], filas = [];
  for (const f of fechas) {
    const r = calcularDia(f), dia = fecha(f, { weekday:'short', day:'numeric' });
    if (!r.cerrado) {
      abiertos++;
      filas.push(`<tr data-fecha="${f}"><td>${dia}</td><td colspan="3">Pendiente · día abierto</td></tr>`);
      continue;
    }
    if (r.real != null) real += r.real;
    if (r.teorico == null || r.diferencia == null || r.sinExplicar == null) {
      historicos++;
      filas.push(`<tr data-fecha="${f}"><td>${dia}</td><td>Pendiente</td><td>${importeVisible(r.real)}</td><td>Revisar datos</td></tr>`);
      continue;
    }
    verificables++; teorico += r.teorico; inicial += r.diferencia;
    if (r.sinExplicar !== 0) revisables++;
    faltan += Math.min(0,r.sinExplicar); sobran += Math.max(0,r.sinExplicar);
    for (const l of r.lineas) {
      if (aGranel(l.p)) kg += l.neto; else uds += l.neto;
      if (l.margen == null || l.costeTirado == null) sinCoste = true;
      margen += l.margen ?? 0; mermas += l.costeTirado ?? 0;
      if (!l.vendido) continue;
      const clave = l.p.id + '/' + l.p.unidad;
      const item = porProducto.get(clave) || { p:l.p, cant:0, total:0 };
      item.cant += l.neto; item.total += l.importe; porProducto.set(clave,item);
    }
    filas.push(`<tr data-fecha="${f}"><td>${dia}</td><td>${fmt(r.teorico)}</td><td>${fmt(r.real)}</td><td>Inicial ${firmado(r.diferencia)}<br>Sin explicar ${firmado(r.sinExplicar)}</td></tr>`);
    barras.push({ etiqueta:fecha(f,{day:'numeric'}), titulo:fechaCorta(f), valor:r.real });
  }
  const tabla = [...porProducto.values()].sort((a,b) => b.total-a.total);
  $('tabla-productos').innerHTML = tabla.map(x => `<tr><td>${escapar(x.p.nombre)}</td><td>${fmtCant(x.p,x.cant)}</td><td>${fmt(x.total)}</td></tr>`).join('') || '<tr><td colspan="3">Sin ventas cerradas verificables.</td></tr>';
  $('tabla-dias').innerHTML = filas.join('') || '<tr><td colspan="4">Sin jornadas registradas.</td></tr>';
  $('grafico-mes').innerHTML = barras.length ? grafico(barras) : '<p class="ayuda">Aún no hay cierres verificables.</p>';
  const cifras = [['Previsto · cierres verificables',fmt(teorico)],['Cobrado · cierres con caja conocida',fmt(real)],
    ['Diferencia inicial · verificables',firmado(inicial)],['Sin explicar · faltas',firmado(faltan)],['Sin explicar · sobrantes',firmado(sobran)],
    ['Cierres con diferencia pendiente',revisables],['Cierres verificables',verificables],['Días abiertos',abiertos],['Cierres por reconstruir',historicos],
    ['Vendido a peso',fmtKg(redondear(kg))],['Unidades vendidas',fmtUd(uds)],['Margen tras merma',sinCoste ? 'Pendiente' : fmt(margen)],['Género tirado a coste',sinCoste && fechas.some(f => calcularDia(f).cerrado && calcularDia(f).lineas.some(l => l.costeTirado == null)) ? 'Pendiente' : fmt(mermas)]];
  $('cifras-mes').innerHTML = cifras.map(([k,v]) => `<div class="cifra"><small>${k}</small><strong>${v}</strong></div>`).join('');
}

function pintarProductos() {
  $('ajuste-ciegas').checked = ajustes.ciegas;
  $('ajuste-teclado').value = ajustes.teclado;

  $('lista-productos').innerHTML = Object.keys(TIPOS).map((tipo) => {
    const lista = porTipo(tipo);
    const esCong = tipo === 'congelado';
    const cab = esCong
      ? filaCab('Nombre', 'Formato', 'Se vende', 'Coste €', 'Venta €', 'Stock inicial', 'Stock ideal', '')
      : filaCab('Nombre', 'Limpieza %', 'Coste €/kg', '');
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
        : `<input class="num" inputmode="decimal" data-prod="merma" value="${numATexto(p.merma || null)}" placeholder="0" aria-label="Merma"><input class="num" inputmode="decimal" data-prod="coste" value="${centATexto(p.coste)}" placeholder="Pendiente" aria-label="Coste por kg">`;
      return `<div class="fila-prod" data-id="${p.id}">
        <input data-prod="nombre" value="${escapar(p.nombre)}" aria-label="Nombre">${campos}
        <button type="button" class="btn-borrar" data-borrar="${p.id}" aria-label="Archivar ${escapar(p.nombre)}">✕</button>
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) return;
  intentoCierre = false;
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
  if (dias[f]?.cerrado || bloqueoLectura) return;
  const { id } = i.dataset;
  const leido = fn => i.value.trim() && fn(i.value) == null ? i.value.trim() : fn(i.value);

  if (i.id === 'legado-parte') {
    diaEditable(f).parteLegado = i.value.trim();
  } else if (i.dataset.fresco) {
    const d = diaEditable(f);
    const r = (d.fresco[id] ||= {});
    const campo = i.dataset.fresco;
    r[campo] = leido(campo === 'pvp' ? aCentimos : aNumero);
    // Al poner kilos se fija el precio que se ve en pantalla para ese día
    if (campo === 'kg' && r.pvp == null) r.pvp = precio(f, id);
  } else if (i.dataset.congelado) {
    const d = diaEditable(f);
    const c = (d.congelado[id] ||= {});
    c[i.dataset.congelado] = leido(i.dataset.congelado === 'pvp' ? aCentimos : aNumero);
  } else if (i.dataset.caja) {
    const d = diaEditable(f);
    d.caja[i.dataset.caja] = i.dataset.caja === 'notas' ? i.value.trim() : leido(aCentimos);
  } else if (i.dataset.den) {
    const d = diaEditable(f);
    d.caja.desglose = leerDesglose();
    const total = Object.entries(d.caja.desglose).reduce((s, [den, n]) => s + den * n, 0);
    d.caja.contado = total;
    document.querySelector('#cierre-form [data-caja="contado"]').value = centATexto(total);
  } else {
    return;
  }
  fijarFichas(f);
  guardar();
  if (intentoCierre) mostrarFaltas(false);
});

// Al terminar de escribir kilos o reposiciones se actualizan el cierre y los pasos
$('vista-dia').addEventListener('change', (e) => {
  const i = e.target;
  if (i.dataset.fresco === 'kg' || ['repuesto','inicial'].includes(i.dataset.congelado)) {
    i.closest('.fila-prod')?.classList.toggle('con-dato', !!aNumero(i.value));
    actualizarConteos();
    pintarCierre();
    pintarPasos();
  }
});

$('vista-dia').addEventListener('click', (e) => {
  const f = $('fecha').value;

  if (e.target.id === 'reabrir') {
    if (bloqueoLectura || !dias[f]?.cerrado) return;
    const motivo = prompt('Motivo de la corrección. Se conservarán los valores anteriores y los nuevos.');
    if (!motivo?.trim()) return;
    const antes = MotorCierre.copia(dias[f]);
    MotorCierre.reabrir(dias[f], motivo, new Date().toISOString());
    if (!guardar()) { dias[f] = antes; return; }
    intentoCierre = false;
    pasoActual = 2;
    pintarDia();
    return;
  }

  const borrar = e.target.closest('[data-borrar-salida]');
  if (borrar && !dias[f]?.cerrado && !bloqueoLectura) {
    dias[f].salidas.splice(+borrar.dataset.borrarSalida, 1);
    guardar();
    pintarCierre(); pintarPasos();
  }
});

$('rapido-texto').addEventListener('input', () => { $('rapido-revision').innerHTML = ''; });

$('rapido-leer').addEventListener('click', () => {
  const texto = $('rapido-texto').value.trim();
  if (!texto) {
    avisar('Pega o dicta primero la lista.');
    return;
  }
  pintarRevision(leerLista(texto));
});

$('borrar-dia').addEventListener('click', () => {
  const f = $('fecha').value;
  if (dias[f]?.cerrado || dias[f]?.correccion || bloqueoLectura) return;
  if (!dias[f]) {
    avisar('Este día no tiene nada apuntado.');
    return;
  }
  if (!confirm(`¿Borrar todo lo apuntado el ${fechaCorta(f)}? Género, cierre, retiradas y caja. No se puede deshacer.`)) return;
  delete dias[f];
  guardar();
  pasoActual = 1;
  $('rapido-revision').innerHTML = '';
  pintarDia();
  avisar('Día borrado.');
});

$('rapido').addEventListener('click', (e) => {
  if (e.target.id === 'rapido-pasar') pasarRevision();
  if (e.target.id === 'rapido-cancelar') $('rapido-revision').innerHTML = '';
});

$('salida-tipo').addEventListener('change', configurarMovimiento);
$('lote-producto').addEventListener('change', pintarLote);
$('lote-guardar').addEventListener('click', () => {
  const f = $('fecha').value, id = $('lote-producto').value;
  if (!id || dias[f]?.cerrado || bloqueoLectura) return;
  const campos = ['cajas','precio','netos','luque'].map(k => $('lote-' + k).value.trim());
  const [cajas, precioCaja, kgNetos, kgLuque] = campos.map((v,i) => i === 1 ? aCentimos(v) : aNumero(v));
  if (campos.some((v,i) => v && [cajas,precioCaja,kgNetos,kgLuque][i] == null)
    || (cajas != null && (!Number.isSafeInteger(cajas) || cajas <= 0)) || (precioCaja != null && precioCaja < 0)
    || (kgNetos != null && (!MotorCierre.cantidad(kgNetos,'kg') || kgNetos <= 0))
    || (kgLuque != null && (!MotorCierre.cantidad(kgLuque,'kg') || (kgNetos != null && kgLuque > kgNetos)))) {
    avisar('Revisa cajas, precio y kilos. Luque solo puede recibir hasta el peso neto del lote.'); return;
  }
  const d = diaEditable(f);
  d.lotes ||= {};
  if (campos.some(Boolean)) d.lotes[id] = { cajas, precioCaja, kgNetos, kgLuque }; else delete d.lotes[id];
  fijarFichas(f);
  if (guardar()) { pintarLote(); avisar('Lote guardado.'); }
});
$('sin-genero').addEventListener('change', e => {
  const f = $('fecha').value;
  if (dias[f]?.cerrado || bloqueoLectura) return;
  if (e.target.checked && calcularDia(f).lineas.length) { e.target.checked = false; avisar('Hay existencias anotadas. Revisa el género.'); return; }
  diaEditable(f).sinGenero = e.target.checked;
  fijarFichas(f); guardar(); pintarPasos();
});
$('salida-anadir').addEventListener('click', () => {
  const f = $('fecha').value;
  if (dias[f]?.cerrado || bloqueoLectura) return;
  const p = fichasDelDia(f).find(p => p.id === $('salida-prod').value);
  const tipo = $('salida-tipo').value, cant = aNumero($('salida-cant').value), pvp = aCentimos($('mov-precio').value);
  const hora = $('mov-hora').value, orden = aNumero($('mov-orden').value), destino = $('mov-destino').value.trim();
  if (!p || !MotorCierre.cantidad(cant,p.unidad) || (tipo !== 'precio' && cant === 0)) { avisar('Revisa la cantidad y su unidad.'); return; }
  if (!MotorCierre.horaValida(hora) || !MotorCierre.validaOrden(orden)) { avisar('Indica la hora real y un orden del 1 al 99.'); return; }
  if (tipo === 'precio' && (!MotorCierre.moneda(pvp) || !pvp)) { avisar('Indica el nuevo precio.'); return; }
  if (tipo === 'traslado' && !destino) { avisar('Indica la tienda de destino.'); return; }
  const d = diaEditable(f);
  const m = { prod:p.id, tipo, cant, hora, orden, anotado:new Date().toISOString(), motivo:$('salida-motivo').value.trim() };
  if (tipo === 'precio') m.pvp = pvp;
  if (tipo === 'traslado') m.destino = destino;
  d.salidas.push(m); fijarFichas(f);
  $('salida-cant').value = ''; $('salida-motivo').value = ''; $('mov-precio').value = ''; $('mov-destino').value = '';
  const guardado = guardar();
  pintarCierre(); pintarPasos();
  if (guardado) avisar('Movimiento guardado.');
});
$('terminar-cierre').addEventListener('click', () => {
  const f = $('fecha').value;
  if (dias[f]?.cerrado || bloqueoLectura) return;
  if (calcularDia(f).faltas.length) { mostrarFaltas(true); return; }
  const aviso = $('confirmar-cierre');
  aviso.dataset.fecha = f;
  aviso.hidden = false;
  $('cierre-confirmar').focus();
  aviso.scrollIntoView({ block: 'center', behavior: 'smooth' });
});
$('cierre-cancelar').addEventListener('click', () => {
  $('confirmar-cierre').hidden = true;
  $('terminar-cierre').focus();
});
$('cierre-confirmar').addEventListener('click', () => {
  const f = $('fecha').value;
  $('confirmar-cierre').hidden = true;
  if ($('confirmar-cierre').dataset.fecha !== f || dias[f]?.cerrado || bloqueoLectura) return;
  if (calcularDia(f).faltas.length) { mostrarFaltas(true); return; }
  const d = diaEditable(f);
  fijarFichas(f);
  const antes = MotorCierre.copia(d);
  try { MotorCierre.cerrar(d, fichasDelDia(f), new Date().toISOString(), horaActual()); }
  catch (error) { mostrarFaltas(true); avisar(error.message || 'Revisa los datos del cierre.'); return; }
  if (!guardar()) { dias[f] = antes; return; }
  intentoCierre = false; pasoActual = 3; pintarDia(); window.scrollTo(0, 0);
});
$('cuadre').addEventListener('click', e => {
  if (e.target.id !== 'just-guardar' || bloqueoLectura) return;
  const f = $('fecha').value, d = dias[f], r = calcularDia(f);
  if (!d?.cerrado || !$('just-importe')) return;
  const importe = aCentimos($('just-importe').value.replace('−','-')), comprobante = $('just-ref').value.trim();
  try { MotorCierre.justificar(r.diferencia, d.justificaciones || [], importe, comprobante); }
  catch (err) { avisar(err.message); return; }
  (d.justificaciones ||= []).push({ importe, comprobante, fecha:new Date().toISOString() });
  if (!guardar()) { d.justificaciones.pop(); return; }
  pintarCuadre(); pintarPasos();
});
$('guardar-reintento').addEventListener('click', () => {
  if (bloqueoLectura) { window.location.reload(); return; }
  if (guardar()) { pintarDia(); avisar('Datos guardados.'); }
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
  productos.push(tipo === 'congelado' ? { id, nombre, tipo, unidad: 'ud' } : { id, nombre, tipo, merma: 0 });
  guardar();
  $('nuevo-nombre').value = '';
  pintarProductos();
  avisar(`«${nombre}» añadido.`);
});

$('lista-productos').addEventListener('input', (e) => {
  const i = e.target;
  const campo = i.dataset.prod;
  const p = producto(i.closest('[data-id]')?.dataset.id);
  if (!campo || !p || bloqueoLectura) return;
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
  if (!id || bloqueoLectura) return;
  const p = producto(id);
  if (!confirm(`¿Archivar «${p.nombre}» para las próximas aperturas? Se conservarán sus cierres.`)) return;
  p.archivado = true;
  guardar();
  pintarProductos();
});

$('exportar').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ version:3, productos, dias, ajustes }, null, 2)], { type: 'application/json' });
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
    const datos = MotorCierre.validarCopia(JSON.parse(await archivo.text()));
    if (!confirm('Restaurar esta copia en este dispositivo sustituirá sus jornadas y catálogo. ¿Continuar?')) return;
    const anterior = { productos, dias, ajustes, bloqueoLectura, versionLeida };
    productos = datos.productos; dias = datos.dias; ajustes = { ciegas:true, teclado:'auto', ...datos.ajustes };
    try {
      materializarAntiguos();
      // Una restauración explícita también permite recuperar un almacenamiento previo ilegible.
      versionLeida = localStorage.getItem(CLAVE_ESTADO); bloqueoLectura = false;
      if (!guardar()) throw new Error('guardado');
    } catch (error) {
      ({ productos, dias, ajustes, bloqueoLectura, versionLeida } = anterior);
      if (error.message === 'guardado') return;
      throw error;
    }
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

window.addEventListener('beforeunload', e => { if (errorGuardado) { e.preventDefault(); e.returnValue = ''; } });
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
materializarAntiguos();
pasoActual = pasoSugerido(hoyISO());
if (!bloqueoLectura) guardar();
mostrarVista('inicio');

// Instalable en el móvil y usable sin conexión
if (PILOTO) {
  $('estado-offline').textContent = 'Piloto de Luque · archivo completo para usar sin conexión. Los cierres se guardan en este navegador.';
} else if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').then(() => navigator.serviceWorker.ready).then(() => {
    $('estado-offline').textContent = 'Disponible sin conexión en este dispositivo.';
  }).catch(() => { $('estado-offline').textContent = 'Aún no se ha preparado el uso sin conexión. Abre la app de nuevo con cobertura.'; });
}
