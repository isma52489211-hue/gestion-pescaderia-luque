// Cantidades en milésimas de kg/ud; dinero en céntimos. El motor no lee el catálogo ni el reloj.
const MotorCierre = (() => {
  const copia = (obj) => JSON.parse(JSON.stringify(obj));
  const objeto = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
  const numero = (x) => typeof x === 'number' && Number.isFinite(x) && x >= 0;
  const moneda = (x) => numero(x) && Number.isSafeInteger(x);
  const cantidad = (x, unidad) => numero(x) && Number.isSafeInteger(Math.round(x * 1000))
    && Math.abs(x * 1000 - Math.round(x * 1000)) < 0.000001 && (unidad !== 'ud' || Number.isInteger(x));
  const mil = (x) => Math.round(x * 1000);
  const fmtN = (x) => x.toLocaleString('es-ES', { maximumFractionDigits: 3 });
  const tipos = ['entrada', 'precio', 'merma', 'traslado', 'retirada'];
  const horaValida = (x) => typeof x === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(x);
  const validaOrden = (x) => Number.isSafeInteger(x) && x >= 1 && x <= 99;
  const camposCaja = { fondo: 'fondo de apertura', contado: 'efectivo contado', tarjeta: 'total de tarjeta', bizum: 'total de Bizum' };
  // La báscula entrega gramos. Redondeamos al céntimo al final de cada tramo, incluso en un medio céntimo exacto.
  function importeTramo(gramos, precio, limpieza) {
    if (gramos <= 0 || !Number.isSafeInteger(gramos) || !moneda(precio) || !numero(limpieza) || limpieza > 100) return 0;
    if (limpieza === 0 && Number.isSafeInteger(gramos * precio)) return Math.round(gramos * precio / 1000);
    const [mantisa, exponente = '0'] = String(limpieza).split('e');
    const [entera, decimal = ''] = mantisa.split('.');
    const lugares = decimal.length - Number(exponente);
    const escala = 10n ** BigInt(Math.max(0, lugares));
    const porcentaje = BigInt(entera + decimal) * 10n ** BigInt(Math.max(0, -lugares));
    const dividendo = BigInt(gramos) * BigInt(precio) * (100n * escala - porcentaje);
    const divisor = 100000n * escala;
    return Number((2n * dividendo + divisor) / (2n * divisor));
  }
  function ficha(p, pvp, apertura) {
    return { id: p.id, nombre: p.nombre, tipo: p.tipo, unidad: p.tipo === 'congelado' && p.unidad !== 'kg' ? 'ud' : 'kg',
      formato: p.formato || '', merma: p.merma ?? 0, coste: p.coste ?? null, pvp: pvp ?? null, apertura: apertura ?? 0 };
  }
  function compra(lote) {
    if (!lote) return null;
    const { cajas, precioCaja, kgNetos, kgLuque } = lote;
    const base = Number.isSafeInteger(cajas) && cajas > 0 && moneda(precioCaja) ? cajas * precioCaja : null;
    const coste = base != null && cantidad(kgNetos, 'kg') && kgNetos > 0 ? base / kgNetos : null;
    const asignado = coste != null && cantidad(kgLuque, 'kg') && kgLuque <= kgNetos ? Math.round(base * mil(kgLuque) / mil(kgNetos)) : null;
    return { base, coste, asignado };
  }
  function linea(p, d, movimientos) {
    const id = p.id, unidad = p.unidad;
    const esCong = p.tipo === 'congelado';
    const r = (esCong ? d.congelado : d.fresco)?.[id] || {};
    const inicio = esCong ? (r.inicial ?? p.apertura) + (r.repuesto ?? 0) : (r.kg ?? 0);
    const queda = esCong ? r.quedan : r.sobra;
    const pvpInicial = Object.hasOwn(r, 'pvp') ? r.pvp : p.pvp;
    const lote = compra(d.lotes?.[id]);
    const coste = lote ? lote.coste : (p.coste ?? null);
    function costeDe(gramos) {
      if (gramos === 0) return 0;
      if (!numero(coste)) return null;
      return lote ? Math.round(gramos * lote.base / mil(d.lotes[id].kgNetos)) : Math.round(gramos * coste / 1000);
    }
    const margenPendiente = [];
    const faltas = [], tramos = [], salidas = [];
    const fallo = (s) => faltas.push(p.nombre + ' · ' + s);
    const neta = (x) => fmtN(x / 1000) + ' ' + unidad;
    if (!cantidad(inicio, unidad) || (esCong && !cantidad(r.repuesto ?? 0, unidad))) fallo('revisa la cantidad de apertura o reposición.');
    if (p.origenPendiente && r.inicial == null) fallo('falta el recuento de ' + p.origenPendiente + '. Confirma la apertura física del congelado en el paso 1.');
    if (queda == null) fallo('falta el recuento final. Escribe 0 si está agotado.');
    else if (!cantidad(queda, unidad)) fallo('revisa el recuento final en ' + unidad + '.');
    if (!numero(p.merma) || p.merma > 100) fallo('revisa el porcentaje de limpieza (0–100).');
    let stock = cantidad(inicio, unidad) ? mil(inicio) : 0;
    let precio = pvpInicial, desde = 'Apertura', entradas = 0, retiradas = 0, tirado = 0;
    let vendido = 0, neto = 0, importe = 0;
    const movs = [...movimientos].sort((a,b) => String(a.hora).localeCompare(String(b.hora)) || (a.orden ?? 1) - (b.orden ?? 1));
    const visto = new Set();
    function tramo(final, hasta) {
      const bruto = stock + entradas - retiradas - final;
      if (bruto < 0) fallo(hasta + ': apertura ' + neta(stock) + ', entradas ' + neta(entradas) + ', salidas '
        + neta(retiradas) + ' y recuento ' + neta(final) + '. Sobran ' + neta(-bruto) + ' en las anotaciones. Revisa el peso y el orden.');
      if (bruto > 0 && (!moneda(precio) || precio === 0)) fallo('falta un PVP positivo para el tramo ' + desde + '–' + hasta + '.');
      const pesoVenta = bruto / 1000 * (1 - p.merma / 100);
      const valor = importeTramo(bruto, precio, p.merma);
      tramos.push({ desde, hasta, inicio: stock/1000, entradas: entradas/1000, salidas: retiradas/1000, queda: final/1000,
        bruto: bruto/1000, neto: pesoVenta, pvp: precio, importe: valor });
      vendido += bruto; neto += pesoVenta; importe += valor;
      stock = final; entradas = 0; retiradas = 0; desde = hasta;
    }
    for (const m of movs) {
      if (!tipos.includes(m.tipo)) { fallo('movimiento de tipo desconocido.'); continue; }
      if (!horaValida(m.hora)) fallo('revisa la hora real de un movimiento.');
      if (m.orden != null && !validaOrden(m.orden)) fallo('revisa el orden del minuto ' + m.hora + '.');
      const llave = m.hora + '/' + (m.orden ?? 1);
      if (visto.has(llave) && movs.some((otro) => otro.hora === m.hora && otro.tipo === 'precio')) fallo('a las ' + m.hora + ' indica órdenes distintos para ordenar los movimientos y la rebaja.');
      visto.add(llave);
      if (!cantidad(m.cant, unidad) || (m.tipo !== 'precio' && m.cant === 0)) { fallo(m.hora + ': cantidad inválida.'); continue; }
      if (m.tipo === 'precio') {
        if (!moneda(m.pvp) || m.pvp === 0) fallo(m.hora + ': falta el nuevo PVP.');
        tramo(mil(m.cant), m.hora);
        precio = m.pvp;
      } else if (m.tipo === 'entrada') entradas += mil(m.cant);
      else {
        if (m.tipo === 'traslado' && !String(m.destino || '').trim()) fallo(m.hora + ': indica la tienda de destino.');
        retiradas += mil(m.cant);
        if (stock + entradas < retiradas) fallo(m.hora + ': las salidas superan el género disponible en ' + neta(retiradas - stock - entradas) + '. Revisa la cantidad o la hora.');
        if (m.tipo === 'merma') tirado += mil(m.cant);
        salidas.push({ ...m, p, valor: m.tipo === 'merma' ? costeDe(mil(m.cant)) : null });
      }
    }
    if (cantidad(queda, unidad)) tramo(mil(queda), 'Cierre');
    const finBruto = vendido / 1000;
    const costeTirado = costeDe(tirado);
    const costeVendido = costeDe(vendido);
    if ((vendido || tirado) && !numero(coste)) margenPendiente.push(p.nombre + (lote ? ' · falta completar el coste y el peso neto del lote.' : ' · falta el coste de compra.'));
    if (lote && lote.asignado == null) margenPendiente.push(p.nombre + ' · coste asignado a Luque pendiente. Revisa cajas, precio por caja, peso neto del lote y kg recibidos.');
    return { p, inicio, queda: queda ?? null, pvp: pvpInicial, coste, lote, tramos, salidasDetalle: salidas,
      salidas: salidas.reduce((n, s) => n + s.cant, 0), vendido: finBruto, neto, importe: faltas.length ? null : importe,
      costeTirado, costeVendido, margen: faltas.length || costeVendido == null || costeTirado == null ? null : importe - costeVendido - costeTirado,
      faltas: [...new Set(faltas)], margenPendiente };
  }
  function calcular(d, fichas) {
    const movimientos = d.salidas || [], caja = copia(d.caja || {});
    const activas = fichas.filter((p) => {
      const r = d.fresco?.[p.id] || d.congelado?.[p.id] || {};
      return (p.tipo === 'congelado' && (p.apertura !== 0 || p.origenPendiente)) || [r.kg, r.repuesto, r.inicial, r.sobra, r.quedan].some(v => v != null && v !== 0)
        || r.sobra === 0 || r.quedan === 0 || movimientos.some(m => m.prod === p.id);
    });
    const lineas = activas.map((p) => linea(p, d, movimientos.filter(m => m.prod === p.id)));
    const faltasGenero = lineas.flatMap(l => l.faltas);
    if (d.correccion?.antes?.cerrado?.informe?.legado && !d.parteLegado?.trim()) faltasGenero.push('Cierre antiguo · indica el comprobante con que has verificado pesos, unidades, PVP y limpieza.');
    if (d.sinGenero && lineas.some(l => l.inicio > 0 || l.vendido > 0)) faltasGenero.push('Apertura · hay género anotado. Desmarca «Hoy no hubo género» o revisa las existencias.');
    const ids = new Set(fichas.map(p => p.id));
    for (const id of [...Object.keys(d.fresco || {}), ...Object.keys(d.congelado || {}), ...movimientos.map(m => m.prod)]) {
      if (!ids.has(id)) faltasGenero.push('Referencia ' + id + ' · no se conserva su ficha. Revisa el producto.');
    }
    if (!lineas.length && !d.sinGenero) faltasGenero.push('Apertura · apunta el género o confirma que hoy no hubo existencias.');
    const faltasCaja = [];
    for (const [k, label] of Object.entries(camposCaja)) {
      if (!moneda(caja[k])) faltasCaja.push('Caja · revisa ' + label + '. Escribe 0 si corresponde.');
    }
    for (const [k,label] of Object.entries({ gastos: 'gastos', ingresos: 'entradas de efectivo', retiradas: 'retiradas de efectivo', fondoManana: 'fondo de mañana' })) {
      if (caja[k] != null && !moneda(caja[k])) faltasCaja.push('Caja · revisa ' + label + '.');
    }
    if (caja.fondoManana != null && caja.contado != null && caja.fondoManana > caja.contado) faltasCaja.push('Caja · el fondo de mañana supera el cajón contado.');
    const efectivoVendido = (caja.contado ?? 0) - (caja.fondo ?? 0) + (caja.gastos ?? 0) + (caja.retiradas ?? 0) - (caja.ingresos ?? 0);
    const real = faltasCaja.length ? null : efectivoVendido + caja.tarjeta + caja.bizum;
    const teorico = faltasGenero.length ? null : lineas.reduce((sum,l) => sum + l.importe, 0);
    return { lineas, salidas: lineas.flatMap(l => l.salidasDetalle), caja, teorico, real, efectivoVendido,
      diferencia: real == null || teorico == null ? null : real - teorico, hayCaja: real != null,
      faltas: [...new Set([...faltasGenero, ...faltasCaja])], margenPendiente: lineas.flatMap(l => l.margenPendiente) };
  }
  function justificar(diferencia, anteriores, valor, comprobante) {
    const resto = diferencia == null ? null : diferencia - anteriores.reduce((s,j) => s + j.importe, 0);
    if (!Number.isSafeInteger(valor) || valor === 0 || resto == null || Math.sign(valor) !== Math.sign(resto)
      || Math.abs(valor) > Math.abs(resto) || !String(comprobante || '').trim()) throw new Error('Indica el importe con su signo y un comprobante. El importe debe caber en la diferencia pendiente.');
  }
  function ver(d, informe) {
    const justificaciones = d.justificaciones || [];
    let resto = informe.diferencia;
    const validas = [];
    for (const j of justificaciones) {
      try { justificar(informe.diferencia, validas, j.importe, j.comprobante); }
      catch { return { ...informe, cerrado: d.cerrado ? { hora: d.cerrado.hora } : null, sinExplicar: null, faltas: [...informe.faltas, 'Caja · revisa las justificaciones.'] }; }
      validas.push(j); resto -= j.importe;
    }
    return { ...informe, cerrado: d.cerrado ? { hora: d.cerrado.hora } : null, sinExplicar: resto };
  }
  function cerrar(d, fichas, instante, hora) {
    if (d.cerrado) return;
    const informe = calcular(d, fichas);
    if (informe.faltas.length) throw new Error(informe.faltas.join('\n'));
    d.fichas = Object.fromEntries(informe.lineas.map(l => [l.p.id,copia(l.p)]));
    d.cerrado = { hora, instante, versionMotor: 2, informe: copia(informe) };
    if (d.correccion) {
      (d.revisiones ||= []).push({ ...d.correccion, terminado: instante, despues: captura(d) });
      delete d.correccion;
    }
  }
  function captura(d) {
    const { revisiones, correccion, ...datos } = d;
    return copia(datos);
  }
  function reabrir(d, motivo, instante) {
    if (!d.cerrado || !motivo?.trim()) throw new Error('Indica el motivo de la corrección.');
    d.correccion = { fecha: instante, motivo: motivo.trim(), antes: captura(d) };
    delete d.cerrado;
    d.justificaciones = [];
  }
  function validarCopia(datos) {
    const idValido = v => typeof v === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(v) && !['constructor','prototype','__proto__'].includes(v);
    const mal = () => { throw new Error('El archivo contiene datos de cierre no válidos.'); };
    if (!objeto(datos) || (datos.version != null && datos.version !== 3) || !Array.isArray(datos.productos) || !objeto(datos.dias)) mal();
    const ids = new Set();
    for (const p of datos.productos) {
      if (!objeto(p) || !idValido(p.id) || ids.has(p.id) || typeof p.nombre !== 'string' || !['fresco','gordo','marisco','congelado'].includes(p.tipo)) mal();
      ids.add(p.id);
    }
    for (const [fecha,d] of Object.entries(datos.dias)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !objeto(d)) mal();
      for (const k of ['fresco','congelado','caja','fichas','lotes']) if (d[k] != null && !objeto(d[k])) mal();
      for (const k of ['fresco','congelado','fichas','lotes']) for (const [id,v] of Object.entries(d[k] || {})) if (!idValido(id) || !objeto(v)) mal();
      if (d.salidas != null && (!Array.isArray(d.salidas) || d.salidas.some(s => !objeto(s) || !idValido(s.prod)))) mal();
      if (d.cerrado != null && (!objeto(d.cerrado) || !horaValida(d.cerrado.hora))) mal();
      const inf = d.cerrado?.informe;
      if (inf && (!Array.isArray(inf.lineas) || !Array.isArray(inf.faltas) || !Array.isArray(inf.salidas) || !Array.isArray(inf.margenPendiente)
        || !objeto(inf.caja) || inf.lineas.some(l => !objeto(l?.p) || !idValido(l.p.id) || !Array.isArray(l.tramos)))) mal();
      if (inf && !inf.legado) {
        if (inf.lineas.some(l => !moneda(l.importe)) || inf.teorico !== inf.lineas.reduce((n,l) => n + l.importe,0)
          || !Number.isSafeInteger(inf.real) || inf.diferencia !== inf.real - inf.teorico || !objeto(d.fichas)) mal();
      }
      // Una futura regla de redondeo debe respetar el informe que se guardó con una regla anterior.
      if (inf && !inf.legado && d.cerrado.versionMotor === 2) {
        const reconstruido = calcular(d,Object.values(d.fichas));
        if (reconstruido.faltas.length || ['teorico','real','diferencia'].some(k => inf[k] !== reconstruido[k])
          || inf.lineas.length !== reconstruido.lineas.length || inf.lineas.some(l => {
            const otra = reconstruido.lineas.find(x => x.p.id === l.p.id);
            return !otra || ['importe','costeTirado','margen','pvp','inicio','queda','vendido'].some(k => otra[k] !== l[k])
              || !Array.isArray(l.salidasDetalle);
          })) mal();
      }
      if (d.justificaciones != null && (!Array.isArray(d.justificaciones) || d.justificaciones.some(j => !objeto(j) || !Number.isSafeInteger(j.importe) || typeof j.comprobante !== 'string'))) mal();
      if (d.revisiones != null && !Array.isArray(d.revisiones)) mal();
    }
    return datos;
  }
  return { ficha, compra, calcular, justificar, ver, cerrar, reabrir, validarCopia, copia, tipos, horaValida, validaOrden, cantidad, moneda };
})();
if (typeof module !== 'undefined') module.exports = MotorCierre;
