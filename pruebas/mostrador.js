// Prueba la aplicación distribuida dentro de un iframe. Solo se instrumentan el almacenamiento de prueba,
// los diálogos nativos y la descarga. Las entradas, los clics, la exportación y la restauración usan su UI.
const marco = document.querySelector('iframe'), listado = document.querySelector('#resultados');
let html, prefijo, controles, doc, win, fallos, hechas;
const caja = { fondo:'150',contado:'154',tarjeta:'15',bizum:'5' };
const fresco = { id:'boqueron',nombre:'Boquerón de prueba',tipo:'fresco',codigo:1,merma:0,coste:400 };
const bolsa = { id:'bolsa',nombre:'Bolsa de prueba',tipo:'congelado',codigo:2,unidad:'ud',stockInicial:2,pvp:500,coste:200 };
const q = sel => doc.querySelector(sel);
function verificar(ok, msg) { if (!ok) throw new Error(msg); }
function texto(sel) { return q(sel).textContent.replace(/\s+/g,' ').trim(); }
function poner(sel,val) {
  const el = q(sel); verificar(el && !el.matches(':disabled'), 'Campo ausente o bloqueado: ' + sel);
  el.value=val; el.dispatchEvent(new win.Event('input',{bubbles:true})); el.dispatchEvent(new win.Event('change',{bubbles:true}));
}
function clic(sel) { const el=q(sel);verificar(el && !el.matches(':disabled'),'Botón ausente o bloqueado: '+sel);el.click(); }
function nav(v) { clic('[data-vista="'+v+'"]'); }
function paso(n) { clic('[data-paso="'+n+'"]'); }
const numerico = (v) => v.endsWith(' €') ? Number(v.replace(/[^0-9,−-]/g,'').replace(',','.').replace('−','-')) : v;
function cifras() { return [...q('.revision-cifras').querySelectorAll('strong')].map(x=>numerico(x.textContent.replace(/\s+/g,' '))); }
function igual(a,b,msg='') { verificar(JSON.stringify(a)===JSON.stringify(b),msg + ' ' + JSON.stringify(a)+' ≠ '+JSON.stringify(b)); }
async function caso(nombre, correr) {
  const li=document.createElement('li');listado.append(li);
  try { await correr(); li.textContent='✓ '+nombre; }
  catch(e) { fallos++;li.className='error'; li.textContent='FALLO · '+nombre+' · '+e.message; }
  hechas++;document.querySelector('#estado').textContent=hechas+' pruebas ejecutadas, '+fallos+' fallos';
}
function limpiar() {
  if (!prefijo) return;
  for (const k of Object.keys(localStorage)) if (k.startsWith(prefijo)) localStorage.removeItem(k);
}
async function cargar(nueva=true, catalogo=[fresco]) {
  if (nueva) {
    limpiar();prefijo='luque-qa/'+crypto.randomUUID()+'/';
    localStorage.setItem(prefijo+'gpl.estado.v3',JSON.stringify({version:3,productos:catalogo,dias:{},ajustes:{ciegas:true,teclado:'no'}}));
  }
  controles={ denegar:false, motivo:'Ticket recuperado', archivo:null, errores:[] };
  // Inserción exclusiva en la copia de prueba. La página normal y sus scripts no incluyen esta ruta.
  window.aislar = (w) => {
    const real=localStorage;
    Object.defineProperty(w,'localStorage',{value:{
      getItem:k=>real.getItem(prefijo+k),
      setItem:(k,v)=>{if(controles.denegar) throw new DOMException('Prueba','QuotaExceededError');real.setItem(prefijo+k,v);}
    }});
    w.confirm=()=>true;w.prompt=()=>controles.motivo;w.scrollTo=()=>{};
    const crear=w.URL.createObjectURL.bind(w.URL);
    w.URL.createObjectURL=b=>{controles.archivo=b;return crear(b);};
    const click=w.HTMLAnchorElement.prototype.click;
    w.HTMLAnchorElement.prototype.click=function(){if(!this.download) click.call(this);};
    w.addEventListener('error',e=>controles.errores.push(e.message));
  };
  const listo=new Promise(resolve=>marco.onload=resolve);
  marco.srcdoc=html.replace('<head>','<head><base href="'+new URL('../',location.href)+'"><script>parent.aislar(window)<\/script>');
  await listo;doc=marco.contentDocument;win=marco.contentWindow;
  igual(controles.errores,[],'Al abrir');nav('dia');
  // Fecha fija ajena a las operaciones reales de la tienda.
  poner('#fecha','2030-01-15');nav('dia');
}
function apertura(resto,contado='154') {
  paso(1);poner('[data-caja=fondo]',caja.fondo);
  poner('[data-fresco=kg]','5');poner('[data-fresco=pvp]','8');paso(2);
  if (resto !== null) poner('[data-fresco=sobra]',String(resto));
  for (const [k,v] of Object.entries({...caja,contado}).filter(([k])=>k!=='fondo')) poner('[data-caja='+k+']',v);
}
function mover(tipo,cant,orden=1,extra={}) {
  q('#movimientos').open=true;poner('#salida-tipo',tipo);poner('#salida-cant',String(cant));poner('#mov-hora',extra.hora || '10:00');poner('#mov-orden',String(orden));
  if(tipo==='precio') poner('#mov-precio',String(extra.precio || 6));
  if(tipo==='traslado') poner('#mov-destino','Baena');
  clic('#salida-anadir');
}
function cerrar() { clic('#terminar-cierre');clic('#cierre-confirmar');verificar(q('#panel-3').hidden===false,'No abrió el informe: '+texto('#faltas-cierre'));igual(controles.errores,[]); }
function cajaVisible(esperado,cobrado,inicial=0,resto=inicial) { igual(cifras(),[esperado,cobrado,inicial,resto],'Cuatro cifras'); }
async function importar(datos) {
  nav('productos');const archivo=new win.File([typeof datos==='string'?datos:JSON.stringify(datos)],'prueba-luque.json',{type:'application/json'});
  const t=new win.DataTransfer();t.items.add(archivo);q('#importar').files=t.files;q('#importar').dispatchEvent(new win.Event('change',{bubbles:true}));
  for(let i=0;i<100 && q('#importar').files.length;i++) await new Promise(resolve=>setTimeout(resolve,10));
  verificar(q('#importar').files.length===0,'No terminó la restauración');
}
function diaPrueba() {nav('dia');poner('#fecha','2030-01-15');}
async function ejecutar() {
  if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname)) {document.querySelector('#estado').textContent='Ejecuta estas pruebas en localhost.';return;}
  document.querySelector('#ejecutar').disabled=true;listado.replaceChildren();fallos=0;hechas=0;
  html=await (await fetch('../index.html',{cache:'no-store'})).text();
  await caso('A · vacío bloqueado, 2 kg = 24 € y cero explícito = 40 €',async()=>{
    await cargar();apertura(null);clic('#terminar-cierre');
    verificar(!q('#faltas-cierre').hidden && texto('#faltas-cierre').includes('Boquerón de prueba'),'No identificó la referencia pendiente');
    paso(3);verificar(!q('.revision-cifras'),'Se reveló el previsto a ciegas');paso(2);poner('[data-fresco=sobra]','2');cerrar();cajaVisible(24,24);
    paso(2);clic('#reabrir');poner('[data-fresco=sobra]','0');cerrar();cajaVisible(40,24,-16);
    verificar(texto('#cuadre').includes('Ticket recuperado') && texto('#cuadre').includes('Antes'),'Sin historial de corrección');
  });
  await caso('B · 1 kg tirado, doble toque: 24 € de venta, 4 € de coste, 8 € de margen',async()=>{
    await cargar();apertura(1);mover('merma',1);clic('#salida-anadir');igual(q('#lista-salidas').children.length,1);cerrar();cajaVisible(24,24);
    verificar(/Coste del género tirado 4,00 € · Margen tras merma 8,00 €/.test(texto('#cuadre')),'Coste o margen incorrectos');
  });
  await caso('C · 1 kg a Baena, 24 € de venta, sin merma y 12 € de margen',async()=>{
    await cargar();apertura(1);mover('traslado',1);cerrar();cajaVisible(24,24);
    verificar(/Coste del género tirado 0,00 € · Margen tras merma 12,00 €/.test(texto('#cuadre')) && texto('#cuadre').includes('Baena'),'Falta margen o destino');
  });
  await caso('D · rebaja con 3 kg, venta por dos tramos = 28 €',async()=>{
    await cargar();apertura(1,'158');mover('precio',3);cerrar();cajaVisible(28,28);
  });
  for(const [orden,importe] of [[1,20],[3,22]]) await caso('E · traslado '+(orden===1?'antes':'después')+' a la misma hora = '+importe+' €',async()=>{
    await cargar();apertura(1,String(130+importe));mover('precio',3,2);mover('traslado',1,orden);cerrar();cajaVisible(importe,importe);
  });
  await caso('F · 5 kg iniciales, 4 finales y 2 trasladados señalan el exceso de 1 kg',async()=>{
    await cargar();apertura(4,'150');poner('[data-caja=tarjeta]','0');poner('[data-caja=bizum]','0');mover('traslado',2);clic('#terminar-cierre');
    verificar(!q('#faltas-cierre').hidden && /Boquerón de prueba.*5 kg.*2 kg.*4 kg.*1 kg/.test(texto('#faltas-cierre')),'Falta desglose imposible');
  });
  await caso('G · congelado a 5 €, luego 7 € y archivo; histórico, mes y copia restaurada siguen en 10 €',async()=>{
    await cargar(true,[bolsa]);paso(1);poner('[data-caja=fondo]','150');paso(2);poner('[data-congelado=quedan]','0');
    for(const [k,v] of Object.entries({contado:'160',tarjeta:'0',bizum:'0'})) poner('[data-caja='+k+']',v);
    cerrar();cajaVisible(10,10);
    nav('productos');poner('[data-prod=pvp]','7');clic('[data-borrar=bolsa]');diaPrueba();paso(3);cajaVisible(10,10);
    nav('resumen');poner('#mes','2030-01');verificar((texto('#tabla-dias').match(/10,00 €/g)||[]).length===2,'Mes distinto del cierre');
    nav('productos');clic('#exportar');const copia=await controles.archivo.text();await cargar(true,[fresco]);await importar(copia);diaPrueba();paso(3);cajaVisible(10,10);
    nav('resumen');poner('#mes','2030-01');verificar(texto('#tabla-productos').includes('Bolsa de prueba'),'El archivo eliminó la referencia del mes');
  });
  await caso('H · 22 € previstos, 20 € cobrados; comentario, justificante de −1 € y diferencia original',async()=>{
    await cargar();apertura(1,'150');mover('precio',3,2);mover('traslado',1,3);poner('[data-caja=notas]','Comentario sin comprobante');
    cerrar();cajaVisible(22,20,-2);poner('#just-importe','−1');clic('#just-guardar');cajaVisible(22,20,-2);
    poner('#just-ref','Ticket QA-01');clic('#just-guardar');cajaVisible(22,20,-2,-1);
    verificar(texto('#cuadre').includes('Ticket QA-01'),'Sin comprobante');
  });
  await caso('Recarga a medio cierre, día abierto fuera del mes y movimientos de efectivo una sola vez',async()=>{
    await cargar();apertura(2);poner('[data-caja=contado]','152');poner('[data-caja=gastos]','3');poner('[data-caja=retiradas]','4');poner('[data-caja=ingresos]','5');poner('[data-caja=fondoManana]','140');
    nav('resumen');poner('#mes','2030-01');verificar(texto('#tabla-dias').includes('Pendiente · día abierto') && !texto('#cifras-mes').includes('24,00 €'),'Un abierto contaminó el mes');
    await cargar(false);paso(2);igual(q('[data-fresco=sobra]').value,'2');cerrar();cajaVisible(24,24);
  });
  await caso('Almacenamiento lleno: error visible, cierre no marcado, reintento y recarga',async()=>{
    await cargar();apertura(2);controles.denegar=true;clic('#terminar-cierre');clic('#cierre-confirmar');
    verificar(!q('#guardado-error').hidden && !q('#panel-2').hidden,'Dio por guardado un cierre fallido');
    controles.denegar=false;clic('#guardar-reintento');cerrar();await cargar(false);paso(3);cajaVisible(24,24);
  });
  await caso('Copia antigua: conserva caja y referencia perdida; previsto histórico no verificable',async()=>{
    await cargar();const legado={productos:[fresco],dias:{'2030-01-15':{fresco:{boqueron:{kg:5,pvp:800,sobra:2},borrado:{kg:1,sobra:0,pvp:700}},congelado:{},caja:{fondo:15000,contado:15400,tarjeta:1500,bizum:500},cerrado:{hora:'13:30'}}}};
    await importar(legado);diaPrueba();paso(3);cajaVisible('Pendiente',24,'Pendiente','Pendiente');
    verificar(texto('#cuadre').includes('borrado') && texto('#cuadre').includes('no es verificable'),'No identifica el origen');
    await importar({productos:[],dias:null});diaPrueba();paso(3);cajaVisible('Pendiente',24,'Pendiente','Pendiente');
  });
  await caso('Compra de seis cajas: 60 € de base, caja cuadrada y coste pendiente hasta pesar',async()=>{
    await cargar();apertura(2);paso(1);poner('#lote-cajas','6');poner('#lote-precio','10');clic('#lote-guardar');
    verificar(texto('#lote-estado').includes('60,00 €') && texto('#lote-estado').includes('pendiente del peso'),'Se inventó el peso');
    paso(2);cerrar();cajaVisible(24,24);verificar(texto('#cuadre').includes('Margen o reparto pendiente'),'Falta aviso de coste');
  });
  await caso('Falso cuadra: misma hora sin orden resoluble y salida superior a existencias',async()=>{
    await cargar();apertura(1);mover('precio',3,1);mover('traslado',1,1);clic('#terminar-cierre');
    verificar(texto('#faltas-cierre').includes('órdenes distintos'),'Empate no bloqueado');
  });
  await caso('Abre en pantalla estrecha; las cuatro cifras caben y las modificaciones del día cerrado se bloquean',async()=>{
    await cargar();apertura(2);cerrar();igual(q('.revision-cifras').querySelectorAll('.cifra').length,4);
    verificar(doc.documentElement.scrollWidth <= marco.clientWidth+1,'Desbordamiento horizontal');
    paso(1);verificar(q('[data-fresco=kg]').disabled && q('#borrar-dia').disabled,'Apertura cerrada editable');
    paso(3);cajaVisible(24,24);
  });
  await caso('Dictado · carga varias referencias, propone el último precio y avisa de ambigüedades', async () => {
    await cargar(true, [fresco, { id:'dorada',nombre:'Dorada',tipo:'fresco',merma:0 }]);
    paso(1);
    poner('#rapido-texto','Boquerón de prueba cinco kilos a ocho euros con cincuenta. Dorada seis kilos a nueve con noventa y cinco.');
    clic('#rapido-leer');
    igual(q('[data-rev=boqueron] [data-campo=pvp]').value,'8,50');
    igual(q('[data-rev=dorada] [data-campo=pvp]').value,'9,95');
    clic('#rapido-pasar');
    igual(q('[data-fresco=kg][data-id=boqueron]').value,'5');
    poner('#fecha','2030-01-16'); paso(1);
    poner('#rapido-texto','Dorada cuatro kilos Boquerón de prueba dos kilos Boquerón de prueba tres kilos');
    clic('#rapido-leer');
    igual(q('[data-rev=dorada] [data-campo=pvp]').value,'9,95');
    verificar(!q('[data-rev=boqueron] input[type=checkbox]').checked,'Se marcó un duplicado para guardar');
    clic('#rapido-pasar');
    igual(q('[data-fresco=kg][data-id=dorada]').value,'4');
    igual(q('[data-fresco=kg][data-id=boqueron]').value,'');
    verificar(!q('input[type=file][accept*="image"]'),'Sigue presente la carga de fotos');
  });
  await caso('Dictado flexible · reconoce expresiones de Luque y cantidades o precios en distinto orden', async () => {
    const catalogo = [
      ['chico', 'Boquerón chico'], ['mediano', 'Boquerón mediano'], ['grande', 'Boquerón grande'],
      ['bacaladilla', 'Bacaladillas'], ['bacaladilla-chica', 'Bacaladillas chicas'], ['pijota', 'Pijotas'],
    ].map(([id, nombre]) => ({ id, nombre, tipo:'fresco', merma:0 }));
    await cargar(true, catalogo);
    paso(1);
    const revisar = entrada => { poner('#rapido-texto', entrada); clic('#rapido-leer'); };
    const comprobar = (id, kg, pvp) => {
      igual(q(`[data-rev=${id}] [data-campo=kg]`).value, kg);
      igual(q(`[data-rev=${id}] [data-campo=pvp]`).value, pvp);
    };
    revisar('Boquerones grandes cinco kilos a seis euros bocalaíllo mediano dos kilos a ocho euros pijota cinco kilos a nueve euros');
    comprobar('grande', '5', '6,00');
    comprobar('bacaladilla', '2', '8,00');
    comprobar('pijota', '5', '9,00');
    revisar('Tres kilos de boquerón gordo a seis euros dos kilos de bacaladilla chica a ocho euros y después pijota a nueve euros cinco kilos');
    comprobar('grande', '3', '6,00');
    comprobar('bacaladilla-chica', '2', '8,00');
    comprobar('pijota', '5', '9,00');
    revisar('Boquerón chico medio kilo a seis euros boquerón mediano un kilo y medio a ocho euros');
    comprobar('chico', '0,5', '6,00');
    comprobar('mediano', '1,5', '8,00');
    revisar('Boquerón gordo tres kilos género desconocido ocho kilos a nueve euros');
    comprobar('grande', '3', '');
    verificar(texto('#rapido-revision').includes('desconocido'),'Falta el aviso de género desconocido');
  });
  document.querySelector('#estado').dataset.terminado=fallos?'error':'ok';document.querySelector('#ejecutar').disabled=false;
}
document.querySelector('#ejecutar').onclick=()=>ejecutar().catch(e=>{document.querySelector('#estado').textContent=e.message;document.querySelector('#estado').dataset.terminado='error';});
