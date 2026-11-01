// Caja Luque — lectura de la plantilla a partir de una foto, sin internet y sin coste.
// La plantilla tiene cuatro marcas negras en las esquinas y una casilla por cifra.
// Con las marcas se endereza la foto, se recorta cada casilla y una pequeña red neuronal
// (entrenada con miles de cifras escritas a mano) reconoce el número.

// ---------- Diseño de la plantilla (en milímetros, hoja A4) ----------

const PL = {
  ancho: 210,
  alto: 297,
  marca: 7,
  marcas: [[8, 8], [195, 8], [8, 282], [195, 282]], // esquina superior izquierda de cada marca
  fila: 7,
  celdaAncho: 5.5,
  celdaAlto: 6.2,
  columnas: [10, 108],
  arriba: 36,
  abajo: 279,
};

// Posición de las casillas dentro de cada fila (mm desde el inicio de la columna)
const KILOS = { enteras: [38, 43.5], decimales: [51, 56.5], centro: 50 };
const PRECIO = { enteras: [64, 69.5], decimales: [77, 82.5], centro: 76 };

const centroMarca = ([x, y]) => [x + PL.marca / 2, y + PL.marca / 2];

function disenoPlantilla(lista, tipos) {
  const filas = [];
  const campos = [];
  let col = 0;
  let y = PL.arriba;
  const hueco = (n) => {
    if (y + n * PL.fila > PL.abajo && col < PL.columnas.length - 1) {
      col++;
      y = PL.arriba;
    }
  };

  for (const tipo of ['fresco', 'gordo', 'marisco', 'congelado']) {
    const prods = lista.filter((p) => p.tipo === tipo).sort((a, b) => a.codigo - b.codigo);
    if (!prods.length) continue;
    if (y > PL.arriba) y += PL.fila * 0.4;
    hueco(2);
    filas.push({ tipo: 'titulo', x: PL.columnas[col], y, texto: tipos[tipo].nombre, cong: tipo === 'congelado' });
    y += PL.fila;

    for (const p of prods) {
      hueco(1);
      const x = PL.columnas[col];
      const cy = y + (PL.fila - PL.celdaAlto) / 2;
      const celda = (dx) => ({ x: x + dx, y: cy, w: PL.celdaAncho, h: PL.celdaAlto });
      const granel = tipo !== 'congelado' || p.unidad === 'kg';
      filas.push({ tipo: 'prod', x, y, p, cong: tipo === 'congelado', granel });
      const grupo = (g) => ({ enteras: g.enteras.map(celda), decimales: g.decimales.map(celda) });
      if (tipo === 'congelado') {
        campos.push(granel
          ? { id: p.id, campo: 'repuesto', ...grupo(PRECIO) }
          : { id: p.id, campo: 'repuesto', enteras: PRECIO.decimales.map(celda), decimales: [] });
      } else {
        campos.push({ id: p.id, campo: 'kg', ...grupo(KILOS) });
        campos.push({ id: p.id, campo: 'pvp', ...grupo(PRECIO) });
      }
      y += PL.fila;
    }
  }

  const celdaFondo = (x) => ({ x, y: 27, w: PL.celdaAncho, h: PL.celdaAlto });
  campos.push({ id: '__fondo', campo: 'fondo', enteras: [150, 155.5, 161].map(celdaFondo), decimales: [168.5, 174].map(celdaFondo) });
  return { filas, campos, desbordado: y > PL.abajo };
}

function svgPlantilla(d) {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const corta = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
  const caja = (c) => `<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="0.6" class="pl-c"/>`;
  const coma = (x, y) => `<text x="${x}" y="${y + 5.9}" class="pl-coma">,</text>`;
  const partes = [];

  for (const [x, y] of PL.marcas) partes.push(`<rect x="${x}" y="${y}" width="${PL.marca}" height="${PL.marca}" fill="#000"/>`);

  partes.push(`<rect x="20" y="8" width="170" height="16" rx="1.5" fill="#22326A"/>
    <svg x="23" y="9" width="53" height="14" viewBox="110 115 1250 330" preserveAspectRatio="xMinYMid meet">
      <image href="assets/logo-adolfo.png" width="1900" height="650"/>
    </svg>
    <text x="187" y="14.6" class="pl-titulo-hoja">Género del día · Tienda de Luque</text>
    <text x="187" y="20.4" class="pl-sub">Una cifra en cada casilla · la coma ya está puesta</text>
    <text x="20" y="31.6" class="pl-txt">Fecha: ______ / ______ / __________</text>
    <text x="148" y="31.6" class="pl-txt" text-anchor="end">Fondo de caja (€)</text>`);

  for (const c of d.campos) {
    for (const celda of [...c.enteras, ...c.decimales]) partes.push(caja(celda));
    if (c.decimales.length) partes.push(coma(c.enteras.at(-1).x + c.enteras.at(-1).w + 0.6, c.enteras[0].y - 0.5));
  }

  for (const f of d.filas) {
    if (f.tipo === 'titulo') {
      partes.push(`<text x="${f.x + 7}" y="${f.y + 4.8}" class="pl-cat">${esc(f.texto)}</text>`);
      partes.push(f.cong
        ? `<text x="${f.x + PRECIO.centro}" y="${f.y + 4.8}" class="pl-col">Repongo</text>`
        : `<text x="${f.x + KILOS.centro}" y="${f.y + 4.8}" class="pl-col">Kilos</text><text x="${f.x + PRECIO.centro}" y="${f.y + 4.8}" class="pl-col">€/kg</text>`);
      partes.push(`<line x1="${f.x}" x2="${f.x + 90}" y1="${f.y + PL.fila - 0.3}" y2="${f.y + PL.fila - 0.3}" class="pl-raya"/>`);
    } else {
      const largo = f.cong ? (f.granel ? 34 : 42) : 20;
      partes.push(`<text x="${f.x + 5.5}" y="${f.y + 4.6}" class="pl-cod">${f.p.codigo}</text>`);
      partes.push(`<text x="${f.x + 7}" y="${f.y + 4.6}" class="pl-nom">${esc(corta(f.p.nombre, largo))}</text>`);
      partes.push(`<line x1="${f.x}" x2="${f.x + 90}" y1="${f.y + PL.fila}" y2="${f.y + PL.fila}" class="pl-sep"/>`);
    }
  }

  partes.push(`<text x="105" y="287.2" class="pl-pie">Escribe números claros dentro de las casillas. Deja en blanco lo que no se lleve.</text>
    <text x="105" y="290.6" class="pl-pie">Foto con la hoja entera, recta y con luz: se deben ver las cuatro marcas negras.</text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PL.ancho} ${PL.alto}" width="${PL.ancho}mm" height="${PL.alto}mm">
    <style>
      .pl-c { fill: #fff; stroke: #22326A; stroke-width: .3; }
      .pl-coma { font: 700 5px 'Source Code Pro', monospace; fill: #22326A; }
      .pl-titulo-hoja { font: 900 4.2px Lato, Arial, sans-serif; fill: #fff; text-anchor: end; }
      .pl-sub { font: 400 2.8px Lato, Arial, sans-serif; fill: #fff; text-anchor: end; }
      .pl-txt { font: 400 3.4px Lato, Arial, sans-serif; fill: #172044; }
      .pl-cat { font: 900 3.6px Lato, Arial, sans-serif; fill: #22326A; }
      .pl-col { font: 700 2.8px 'Source Code Pro', monospace; fill: #4f5a78; text-anchor: middle; }
      .pl-raya { stroke: #22326A; stroke-width: .45; }
      .pl-sep { stroke: #dde1ea; stroke-width: .2; }
      .pl-cod { font: 700 2.9px 'Source Code Pro', monospace; fill: #4f5a78; text-anchor: end; }
      .pl-nom { font: 400 3.1px Lato, Arial, sans-serif; fill: #172044; }
      .pl-pie { font: 400 2.6px Lato, Arial, sans-serif; fill: #4f5a78; text-anchor: middle; }
    </style>
    ${partes.join('\n')}
  </svg>`;
}

// ---------- Lector de cifras (red neuronal pequeña) ----------

let modeloCifras = null;

async function cargarModelo() {
  if (modeloCifras) return modeloCifras;
  const datos = await (await fetch('assets/lector-cifras.json')).json();
  const capas = datos.capas.map((c) => {
    const bytes = Uint8Array.from(atob(c.pesos), (ch) => ch.charCodeAt(0));
    const q = new Int8Array(bytes.buffer);
    const w = new Float32Array(q.length);
    for (let i = 0; i < q.length; i++) w[i] = q[i] * c.escala;
    return { n: c.entradas, m: c.salidas, w, b: Float32Array.from(c.sesgos) };
  });
  modeloCifras = { cnn: datos.tipo === 'cnn', capas };
  return modeloCifras;
}

// Capa densa: salida = entrada · pesos + sesgo (con ReLU si se pide)
function densa(a, c, relu) {
  const out = Float32Array.from(c.b);
  for (let i = 0; i < c.n; i++) {
    const v = a[i];
    if (!v) continue;
    const base = i * c.m;
    for (let j = 0; j < c.m; j++) out[j] += v * c.w[base + j];
  }
  if (relu) for (let j = 0; j < c.m; j++) if (out[j] < 0) out[j] = 0;
  return out;
}

// Convolución 5x5 + ReLU + reducción 2x2 (mismo orden de datos que el entrenamiento)
function convolucion(entrada, lado, canales, c) {
  const sal = lado - 4;
  const k = c.m;
  const parche = new Float32Array(c.n);
  const a = new Float32Array(sal * sal * k);
  for (let y = 0; y < sal; y++) {
    for (let x = 0; x < sal; x++) {
      let p = 0;
      for (let ch = 0; ch < canales; ch++) {
        for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) parche[p++] = entrada[((y + i) * lado + x + j) * canales + ch];
      }
      const base = (y * sal + x) * k;
      for (let o = 0; o < k; o++) a[base + o] = c.b[o];
      for (let q = 0; q < c.n; q++) {
        const v = parche[q];
        if (!v) continue;
        const fila = q * k;
        for (let o = 0; o < k; o++) a[base + o] += v * c.w[fila + o];
      }
      for (let o = 0; o < k; o++) if (a[base + o] < 0) a[base + o] = 0;
    }
  }
  const mitad = sal / 2;
  const out = new Float32Array(mitad * mitad * k);
  for (let y = 0; y < mitad; y++) {
    for (let x = 0; x < mitad; x++) {
      for (let ch = 0; ch < k; ch++) {
        const v = (yy, xx) => a[((2 * y + yy) * sal + 2 * x + xx) * k + ch];
        out[(y * mitad + x) * k + ch] = Math.max(v(0, 0), v(0, 1), v(1, 0), v(1, 1));
      }
    }
  }
  return out;
}

function softmax(a) {
  const max = Math.max(...a);
  const e = a.map((v) => Math.exp(v - max));
  const suma = e.reduce((s, v) => s + v, 0);
  return e.map((v) => v / suma);
}

function probabilidades(x) {
  if (modeloCifras.cnn) {
    const [c1, c2, f1, f2] = modeloCifras.capas;
    const s1 = convolucion(x, 28, 1, c1);
    const s2 = convolucion(s1, 12, c1.m, c2);
    return softmax(densa(densa(s2, f1, true), f2, false));
  }
  let a = x;
  modeloCifras.capas.forEach((c, k) => {
    const out = Float32Array.from(c.b);
    for (let i = 0; i < c.n; i++) {
      const v = a[i];
      if (!v) continue;
      const base = i * c.m;
      for (let j = 0; j < c.m; j++) out[j] += v * c.w[base + j];
    }
    if (k < modeloCifras.capas.length - 1) for (let j = 0; j < c.m; j++) if (out[j] < 0) out[j] = 0;
    a = out;
  });
  return softmax(a);
}

// Se lee la cifra en su sitio y ligeramente movida, y se hace la media: acierta más y duda cuando debe
function clasificar(x) {
  const media = new Float32Array(10);
  const movimientos = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const [dx, dy] of movimientos) {
    const m = new Float32Array(784);
    for (let y = 0; y < 28; y++) {
      for (let xx = 0; xx < 28; xx++) {
        const sx = xx - dx;
        const sy = y - dy;
        if (sx >= 0 && sx < 28 && sy >= 0 && sy < 28) m[y * 28 + xx] = x[sy * 28 + sx];
      }
    }
    probabilidades(m).forEach((p, j) => { media[j] += p / movimientos.length; });
  }
  let digito = 0;
  for (let j = 1; j < 10; j++) if (media[j] > media[digito]) digito = j;
  return { digito, prob: media[digito] };
}

// ---------- Imagen ----------

async function cargarImagen(archivo) {
  const bmp = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
  const k = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * k);
  const h = Math.round(bmp.height * k);
  const lienzo = document.createElement('canvas');
  lienzo.width = w;
  lienzo.height = h;
  const ctx = lienzo.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;
  const gris = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) gris[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
  return { w, h, gris };
}

function grisEn(img, x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  if (x0 < 0 || y0 < 0 || x0 >= img.w - 1 || y0 >= img.h - 1) return 255;
  const fx = x - x0;
  const fy = y - y0;
  const i = y0 * img.w + x0;
  const g = img.gris;
  return (g[i] * (1 - fx) + g[i + 1] * fx) * (1 - fy) + (g[i + img.w] * (1 - fx) + g[i + img.w + 1] * fx) * fy;
}

// Grupos de píxeles oscuros que se tocan
function componentes(mascara, w, h) {
  const etiqueta = new Int32Array(w * h);
  const lista = [];
  const pila = [];
  for (let inicio = 0; inicio < w * h; inicio++) {
    if (!mascara[inicio] || etiqueta[inicio]) continue;
    const c = { area: 0, x0: w, y0: h, x1: 0, y1: 0, sx: 0, sy: 0, px: [] };
    lista.push(c);
    etiqueta[inicio] = lista.length;
    pila.push(inicio);
    while (pila.length) {
      const i = pila.pop();
      const x = i % w;
      const y = (i - x) / w;
      c.area++;
      c.sx += x;
      c.sy += y;
      c.px.push(i);
      if (x < c.x0) c.x0 = x;
      if (x > c.x1) c.x1 = x;
      if (y < c.y0) c.y0 = y;
      if (y > c.y1) c.y1 = y;
      for (const j of [i - 1, i + 1, i - w, i + w]) {
        if (j < 0 || j >= w * h || etiqueta[j] || !mascara[j]) continue;
        if ((j === i - 1 && x === 0) || (j === i + 1 && x === w - 1)) continue;
        etiqueta[j] = lista.length;
        pila.push(j);
      }
    }
  }
  return lista;
}

// Las cuatro marcas negras de las esquinas
function buscarMarcas(img) {
  const f = Math.max(1, Math.round(Math.max(img.w, img.h) / 800));
  const w = Math.floor(img.w / f);
  const h = Math.floor(img.h / f);
  const peq = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let dy = 0; dy < f; dy++) for (let dx = 0; dx < f; dx++) s += img.gris[(y * f + dy) * img.w + x * f + dx];
      peq[y * w + x] = s / (f * f);
    }
  }
  // Umbral según la luz de alrededor (sirve con sombras)
  const integral = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let fila = 0;
    for (let x = 0; x < w; x++) {
      fila += peq[y * w + x];
      integral[(y + 1) * (w + 1) + x + 1] = integral[y * (w + 1) + x + 1] + fila;
    }
  }
  const r = Math.max(8, Math.round(Math.max(w, h) / 14));
  const mascara = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const xa = Math.max(0, x - r);
      const xb = Math.min(w, x + r + 1);
      const ya = Math.max(0, y - r);
      const yb = Math.min(h, y + r + 1);
      const s = integral[yb * (w + 1) + xb] - integral[ya * (w + 1) + xb] - integral[yb * (w + 1) + xa] + integral[ya * (w + 1) + xa];
      const media = s / ((xb - xa) * (yb - ya));
      mascara[y * w + x] = peq[y * w + x] < media * 0.6 ? 1 : 0;
    }
  }
  const lado = Math.max(w, h);
  const candidatos = componentes(mascara, w, h).filter((c) => {
    const bw = c.x1 - c.x0 + 1;
    const bh = c.y1 - c.y0 + 1;
    const proporcion = bw / bh;
    return bw >= lado * 0.008 && bw <= lado * 0.07 && proporcion > 0.6 && proporcion < 1.65 && c.area / (bw * bh) > 0.72;
  }).map((c) => ({ x: (c.sx / c.area + 0.5) * f, y: (c.sy / c.area + 0.5) * f, lado: Math.sqrt(c.area) * f }));

  if (candidatos.length < 4) return null;
  // Las marcas tienen un tamaño parecido entre sí: se toma el grupo más numeroso de tamaño similar
  const elegir = (fn) => candidatos.reduce((a, b) => (fn(b) > fn(a) ? b : a));
  const sel = [
    elegir((c) => -(c.x + c.y)), // arriba izquierda
    elegir((c) => c.x - c.y), // arriba derecha
    elegir((c) => c.y - c.x), // abajo izquierda
    elegir((c) => c.x + c.y), // abajo derecha
  ];
  if (new Set(sel).size < 4) return null;
  const lados = sel.map((c) => c.lado);
  if (Math.max(...lados) > Math.min(...lados) * 2.2) return null;
  return sel.map((c) => [c.x, c.y]);
}

// Transformación de perspectiva que lleva puntos de la plantilla (mm) a la foto (px)
function homografia(origen, destino) {
  const A = [];
  const b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = origen[i];
    const [u, v] = destino[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }
  for (let c = 0; c < 8; c++) {
    let p = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    [b[c], b[p]] = [b[p], b[c]];
    for (let r = 0; r < 8; r++) {
      if (r === c) continue;
      const k = A[r][c] / A[c][c];
      for (let j = c; j < 8; j++) A[r][j] -= k * A[c][j];
      b[r] -= k * b[c];
    }
  }
  return [...b.map((v, i) => v / A[i][i]), 1];
}

const proyectar = (H, x, y) => {
  const d = H[6] * x + H[7] * y + H[8];
  return [(H[0] * x + H[1] * y + H[2]) / d, (H[3] * x + H[4] * y + H[5]) / d];
};

// ---------- Casillas ----------

const PX_MM = 8; // resolución a la que se recorta cada casilla

function leerCasilla(img, H, c) {
  // Se recorta la casilla con margen, para no cortar la cifra si llega al borde
  const e = 0.8;
  const x0 = c.x - e;
  const y0 = c.y - e;
  const W = Math.round((c.w + 2 * e) * PX_MM);
  const Hh = Math.round((c.h + 2 * e) * PX_MM);
  const total = W * Hh;
  const g = new Float32Array(total);
  for (let j = 0; j < Hh; j++) {
    for (let i = 0; i < W; i++) {
      const [u, v] = proyectar(H, x0 + (i + 0.5) / PX_MM, y0 + (j + 0.5) / PX_MM);
      g[j * W + i] = grisEn(img, u, v);
    }
  }
  const orden = Float32Array.from(g).sort();
  const fondo = orden[Math.floor(orden.length * 0.9)];
  const mascara = new Uint8Array(total);
  for (let i = 0; i < total; i++) mascara[i] = g[i] < fondo * 0.72 ? 1 : 0;

  // Borrar la raya impresa de la casilla (se sabe dónde está) sin tocar el resto
  const banda = 0.4 * PX_MM;
  const bordes = { izq: e * PX_MM, der: (e + c.w) * PX_MM, arr: e * PX_MM, aba: (e + c.h) * PX_MM };
  for (let j = 0; j < Hh; j++) {
    for (let i = 0; i < W; i++) {
      const enV = j > bordes.arr - banda && j < bordes.aba + banda;
      const enH = i > bordes.izq - banda && i < bordes.der + banda;
      if ((enV && (Math.abs(i - bordes.izq) < banda || Math.abs(i - bordes.der) < banda))
        || (enH && (Math.abs(j - bordes.arr) < banda || Math.abs(j - bordes.aba) < banda))) mascara[j * W + i] = 0;
    }
  }

  // Quedarse con los trazos cuyo centro cae dentro de la casilla (no la coma ni la casilla de al lado)
  const interior = c.w * c.h * PX_MM * PX_MM;
  const tinta = new Uint8Array(total);
  let cuenta = 0;
  for (const comp of componentes(mascara, W, Hh)) {
    if (comp.area < interior * 0.01) continue;
    const cx = comp.sx / comp.area;
    const cy = comp.sy / comp.area;
    if (cx < bordes.izq || cx > bordes.der || cy < bordes.arr || cy > bordes.aba) continue;
    for (const i of comp.px) tinta[i] = 1;
    cuenta += comp.area;
  }
  if (cuenta < interior * 0.016) return null; // casilla vacía

  // Igual que en el entrenamiento: recortar, ajustar a 20 px y centrar en 28x28
  let bx0 = W;
  let by0 = Hh;
  let bx1 = 0;
  let by1 = 0;
  const val = new Float32Array(total);
  for (let i = 0; i < total; i++) {
    if (!tinta[i]) continue;
    const x = i % W;
    const y = (i - x) / W;
    val[i] = Math.min(1, Math.max(0, (fondo - g[i]) / (fondo * 0.5)));
    if (x < bx0) bx0 = x;
    if (x > bx1) bx1 = x;
    if (y < by0) by0 = y;
    if (y > by1) by1 = y;
  }
  const rw = bx1 - bx0 + 1;
  const rh = by1 - by0 + 1;
  const k = 20 / Math.max(rw, rh);
  const nw = Math.max(1, Math.round(rw * k));
  const nh = Math.max(1, Math.round(rh * k));
  const peq = new Float32Array(nw * nh);
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      // promedio de la zona que cae en cada píxel pequeño
      const sx0 = bx0 + x / k;
      const sy0 = by0 + y / k;
      let s = 0;
      let n = 0;
      for (let yy = Math.floor(sy0); yy < Math.max(Math.floor(sy0) + 1, Math.ceil(sy0 + 1 / k)); yy++) {
        for (let xx = Math.floor(sx0); xx < Math.max(Math.floor(sx0) + 1, Math.ceil(sx0 + 1 / k)); xx++) {
          if (xx > bx1 || yy > by1) continue;
          s += val[yy * W + xx];
          n++;
        }
      }
      peq[y * nw + x] = n ? Math.min(1, (s / n) * 1.3) : 0;
    }
  }
  let masa = 0;
  let cx = 0;
  let cy = 0;
  for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) { const v = peq[y * nw + x]; masa += v; cx += v * x; cy += v * y; }
  cx /= masa || 1;
  cy /= masa || 1;
  const ox = Math.min(Math.max(Math.round(14 - cx), 0), 28 - nw);
  const oy = Math.min(Math.max(Math.round(14 - cy), 0), 28 - nh);
  const entrada = new Float32Array(784);
  for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) entrada[(y + oy) * 28 + x + ox] = peq[y * nw + x];
  return clasificar(entrada);
}

function recorteCampo(img, H, campo) {
  const celdas = [...campo.enteras, ...campo.decimales];
  const x0 = Math.min(...celdas.map((c) => c.x)) - 0.8;
  const x1 = Math.max(...celdas.map((c) => c.x + c.w)) + 0.8;
  const y0 = celdas[0].y - 0.6;
  const y1 = celdas[0].y + celdas[0].h + 0.6;
  const ppm = 7;
  const w = Math.round((x1 - x0) * ppm);
  const h = Math.round((y1 - y0) * ppm);
  const lienzo = document.createElement('canvas');
  lienzo.width = w;
  lienzo.height = h;
  const ctx = lienzo.getContext('2d');
  const datos = ctx.createImageData(w, h);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const [u, v] = proyectar(H, x0 + (i + 0.5) / ppm, y0 + (j + 0.5) / ppm);
      const g = grisEn(img, u, v);
      const k = (j * w + i) * 4;
      datos.data[k] = datos.data[k + 1] = datos.data[k + 2] = g;
      datos.data[k + 3] = 255;
    }
  }
  ctx.putImageData(datos, 0, 0);
  return lienzo.toDataURL('image/jpeg', 0.8);
}

// ---------- Lectura completa ----------

async function leerFotoPlantilla(archivo, diseno) {
  await cargarModelo();
  const img = await cargarImagen(archivo);
  const marcas = buscarMarcas(img);
  if (!marcas) {
    throw new Error('No encuentro las cuatro marcas negras de las esquinas. Haz la foto con la hoja entera, recta y con buena luz.');
  }
  const H = homografia(PL.marcas.map(centroMarca), marcas);
  const resultados = [];
  for (const campo of diseno.campos) {
    const ent = campo.enteras.map((c) => leerCasilla(img, H, c));
    const dec = campo.decimales.map((c) => leerCasilla(img, H, c));
    const leidas = [...ent, ...dec].filter(Boolean);
    if (!leidas.length) continue;
    const textoEnt = ent.filter(Boolean).map((r) => r.digito).join('') || '0';
    const textoDec = dec.map((r) => (r ? r.digito : 0)).join('');
    resultados.push({
      id: campo.id,
      campo: campo.campo,
      valor: Number(textoDec ? `${textoEnt}.${textoDec}` : textoEnt),
      confianza: Math.min(...leidas.map((r) => r.prob)),
      recorte: recorteCampo(img, H, campo),
    });
  }
  return resultados;
}
