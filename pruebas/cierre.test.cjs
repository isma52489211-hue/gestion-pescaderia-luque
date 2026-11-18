const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../motor-cierre.js');
const t0 = '2026-11-10T12:30:00.000Z';
const p = M.ficha({ id:'boqueron', tipo:'fresco', nombre:'Boquerón', coste:400, merma:0 },800,0);
const mov = (tipo, cant, extra = {}) => ({ prod:p.id, tipo, cant, hora:'10:00', orden:1, ...extra });
const rebaja = mov('precio',3,{ pvp:600, orden:2 });
const tienda = (extra = {}) => mov('traslado',1,{ destino:'Baena', ...extra });
function jornada(sobra, salidas = [], cobrado = 2400) {
  return { fresco:{ boqueron:{kg:5,pvp:800,sobra} }, congelado:{}, salidas, caja:{fondo:15000,contado:15000+cobrado-2000,tarjeta:1500,bizum:500} };
}
const calcular = d => M.calcular(d,[p]);
test('A · vacío, dos kilos comprobados y agotado', () => {
  const d = jornada(null);
  assert.equal(calcular(d).teorico,null); assert.throws(() => M.cerrar(d,[p],t0,'13:30'),/Boquerón/);
  d.fresco.boqueron.sobra=2; assert.equal(calcular(d).teorico,2400); assert.equal(calcular(d).real,2400);
  d.fresco.boqueron.sobra=0; assert.equal(calcular(d).teorico,4000); M.cerrar(d,[p],t0,'13:30');
});
test('B · un kilo tirado a coste, margen tras merma', () => {
  const r=calcular(jornada(1,[mov('merma',1)]));
  assert.deepEqual([r.teorico,r.lineas[0].costeTirado,r.lineas[0].margen],[2400,400,800]);
});
test('C · traslado conserva destino y excluye su coste del margen vendido', () => {
  const r=calcular(jornada(1,[tienda()]));
  assert.deepEqual([r.teorico,r.lineas[0].costeTirado,r.lineas[0].margen,r.salidas[0].destino],[2400,0,1200,'Baena']);
  assert.equal(calcular(jornada(1,[tienda({destino:''})])).teorico,null);
});
test('D · rebaja 2×8 más 2×6', () => {
  const r=calcular(jornada(1,[rebaja]));
  assert.equal(r.teorico,2800); assert.deepEqual(r.lineas[0].tramos.map(t=>t.pvp),[800,600]);
});
test('E · mismo minuto, orden físico y registro tardío', () => {
  assert.equal(calcular(jornada(1,[rebaja,tienda()])).teorico,2000);
  assert.equal(calcular(jornada(1,[tienda({orden:3}),rebaja])).teorico,2200);
  assert.equal(calcular(jornada(1,[tienda({orden:2}),rebaja])).teorico,null);
  assert.equal(calcular(jornada(1,[rebaja,tienda({hora:'09:59',orden:2})])).teorico,2000);
  assert.equal(calcular(jornada(1,[tienda({hora:'10:01'}),rebaja])).teorico,2200);
});
test('F · 4 kg finales más 2 trasladados frente a 5; ni siquiera con cobros cero', () => {
  const d=jornada(4,[mov('traslado',2,{destino:'Baena'})],0);
  const r=calcular(d); assert.deepEqual([r.real,r.teorico,r.diferencia],[0,null,null]);
  assert.match(r.faltas.join(' '),/Boquerón.*5 kg.*2 kg.*4 kg.*1 kg/);
  assert.throws(()=>M.cerrar(d,[p],t0,'13:30'));
});
test('G · instantánea conserva precio, coste, unidad y stock después de edición y copia', () => {
  const catalogo={id:'bolsas',nombre:'Bolsas',tipo:'congelado',unidad:'ud',pvp:500,coste:200};
  const ficha=M.ficha(catalogo,500,2), d={congelado:{bolsas:{quedan:0}},caja:{fondo:15000,contado:16000,tarjeta:0,bizum:0}};
  M.cerrar(d,[ficha],t0,'13:30'); catalogo.pvp=700;catalogo.archivado=true; ficha.unidad='kg';
  const copia=M.validarCopia(JSON.parse(JSON.stringify({version:3,productos:[catalogo],dias:{'2026-11-10':d}}))).dias['2026-11-10'];
  const r=M.ver(copia,copia.cerrado.informe);
  assert.deepEqual([r.teorico,r.real,r.sinExplicar,r.lineas[0].p.unidad,r.lineas[0].p.coste],[1000,1000,0,'ud',200]);
});
test('H · diferencia firmada inalterable, justificación parcial y límites', () => {
  const d=jornada(1,[rebaja,tienda({orden:3})],2000);
  d.caja.notas='sobra un papel'; M.cerrar(d,[p],t0,'13:30');
  let r=M.ver(d,d.cerrado.informe); assert.deepEqual([r.teorico,r.real,r.diferencia,r.sinExplicar],[2200,2000,-200,-200]);
  for (const v of [0,100,-201]) assert.throws(()=>M.justificar(-200,[],v,'ticket de prueba'));
  assert.throws(()=>M.justificar(-200,[],-100,' '));
  M.justificar(-200,[],-100,'ticket de prueba');d.justificaciones=[{importe:-100,comprobante:'ticket de prueba',fecha:t0}];
  r=M.ver(d,d.cerrado.informe);assert.deepEqual([r.diferencia,r.sinExplicar],[-200,-100]);
});
test('Eventos tardíos: entradas y pescado tirado se imputan al tramo físico; no se admite stock negativo intermedio',()=>{
  assert.equal(calcular(jornada(1,[rebaja,mov('entrada',1,{hora:'09:00'})])).teorico,3600);
  assert.equal(calcular(jornada(1,[mov('entrada',1,{hora:'11:00'}),rebaja])).teorico,3400);
  assert.equal(calcular(jornada(1,[rebaja,mov('merma',1,{hora:'09:00'})])).teorico,2000);
  assert.equal(calcular(jornada(1,[rebaja,mov('merma',1,{hora:'11:00'})])).teorico,2200);
  assert.equal(calcular(jornada(1,[mov('merma',6),mov('entrada',3,{hora:'11:00'})])).teorico,null);
});
test('Limpieza y pescado tirado se aplican una sola vez',()=>{
  const r=M.calcular(jornada(1,[mov('merma',1)]),[{...p,merma:10}]);
  assert.deepEqual([r.teorico,r.lineas[0].costeTirado,r.lineas[0].margen],[2160,400,560]);
});
test('Compra a cajas: coste medio sin redondeo anticipado y reparto independiente del cobro',()=>{
  const lote={cajas:6,precioCaja:1000,kgNetos:null,kgLuque:null},d=jornada(2);d.lotes={boqueron:lote};
  assert.deepEqual(M.compra(lote),{base:6000,coste:null,asignado:null});
  assert.equal(calcular(d).diferencia,0);assert.equal(calcular(d).lineas[0].margen,null);
  lote.kgNetos=17;assert.equal(M.compra(lote).asignado,null);
  lote.kgLuque=5;assert.equal(M.compra(lote).asignado,1765);assert.equal(calcular(d).lineas[0].costeVendido,1059);
});
test('Caja mixta, entradas, gastos, retiradas y fondo de mañana',()=>{
  const d=jornada(2); assert.equal(calcular(d).real,2400);
  Object.assign(d.caja,{contado:15200,gastos:300,retiradas:400,ingresos:500,fondoManana:14000});
  assert.equal(calcular(d).diferencia,0); d.caja.fondoManana=5000;assert.equal(calcular(d).real,2400);
  d.caja.fondoManana=30000;assert.equal(calcular(d).real,null);
});
test('Corrección exige motivo y conserva valores íntegros antes y después; doble cierre idempotente',()=>{
  const d=jornada(2);M.cerrar(d,[p],t0,'13:30');const antes=M.copia(d.cerrado);
  M.cerrar(d,[],t0,'14:00');assert.deepEqual(d.cerrado,antes);
  assert.throws(()=>M.reabrir(d,' ',t0));M.reabrir(d,'Ticket de tarjeta recuperado',t0);d.caja.tarjeta=1600;
  M.cerrar(d,[p],t0,'14:05');assert.deepEqual(d.revisiones[0].antes.cerrado,antes);assert.equal(d.revisiones[0].despues.caja.tarjeta,1600);
});
test('Una referencia agotada, cantidades inválidas, céntimos pequeños y efectivo sin género',()=>{
  const d=jornada(0);d.fresco.boqueron.sobra=-1;assert.equal(calcular(d).teorico,null);
  d.fresco.boqueron.sobra=2;d.caja.contado--;assert.equal(calcular(d).diferencia,-1);
  d.fresco={};assert.equal(calcular(d).teorico,null);d.sinGenero=true;assert.equal(calcular(d).teorico,0);
  d.caja.tarjeta=null;assert.equal(calcular(d).real,null);
});
test('La restauración rechaza estructuras inválidas antes de sustituir datos',()=>{
  for (const x of [{productos:[],dias:null},{version:4,productos:[],dias:{}},{productos:[],dias:{'2026-11-10':{salidas:'error'}}}]) assert.throws(()=>M.validarCopia(x));
});
test('Una copia con importes de cierre cambiados se rechaza',()=>{
  const d=jornada(2);M.cerrar(d,[p],t0,'13:30');
  const archivo={version:3,productos:[p],dias:{'2026-11-10':d}};
  d.cerrado.informe.teorico=2300;assert.throws(()=>M.validarCopia(archivo));
});
test('Un congelado arrastrado desde un recuento pendiente exige pesar o contar al abrir',()=>{
  const p=M.ficha({id:'bolsa',nombre:'Bolsa',tipo:'congelado',unidad:'ud'},500,2);
  p.origenPendiente='2026-11-10';
  const d={congelado:{bolsa:{quedan:0}},caja:{fondo:15000,contado:16000,tarjeta:0,bizum:0}};
  assert.match(M.calcular(d,[p]).faltas.join(' '),/2026-11-10/);d.congelado.bolsa.inicial=2;assert.equal(M.calcular(d,[p]).teorico,1000);
});
test('Los cambios de un céntimo y las bolsas fraccionarias nunca quedan marcados como cuadre',()=>{
  const bolsa=M.ficha({id:'b',nombre:'B',tipo:'congelado',unidad:'ud'},500,2);
  const d={congelado:{b:{quedan:0.5}},caja:{fondo:0,contado:0,tarjeta:0,bizum:0}};
  assert.equal(M.calcular(d,[bolsa]).teorico,null);
  const otro=jornada(2);otro.caja.contado=15399;assert.equal(M.ver(otro,calcular(otro)).sinExplicar,-1);
});
test('La báscula redondea medio céntimo al alza, también con un porcentaje de limpieza',()=>{
  const d=jornada(0);d.fresco.boqueron={kg:1.005,pvp:100,sobra:0};
  const r=M.calcular(d,[{...p,coste:100}]);assert.deepEqual([r.teorico,r.lineas[0].costeVendido],[101,101]);
  d.fresco.boqueron.kg=0.5;d.fresco.boqueron.pvp=1000;
  assert.equal(M.calcular(d,[{...p,merma:10.1}]).teorico,450);
});
