/**
 * trip-renderer.js
 * Legge info.json dalla stessa cartella, applica il tema della nazione,
 * mostra la prima foto ritagliata a forma di nazione, e la galleria.
 */

(async function () {

  // ── 1. Leggi info.json ──────────────────────────────────────────────
  let info;
  try {
    const r = await fetch('info.json');
    if (!r.ok) throw new Error();
    info = await r.json();
  } catch {
    document.getElementById('trip-content').innerHTML =
      '<div class="loading-msg">Impossibile caricare info.json</div>';
    return;
  }

  // ── 2. Applica il tema nazione ──────────────────────────────────────
  applyTheme(info.nazione, info.tema);

  // ── 3. Aggiorna titolo pagina ────────────────────────────────────────
  document.title = `${info.titolo || info.nazione} — I Miei Viaggi`;

  // ── 4. Elenco foto dalla cartella ────────────────────────────────────
  // Le foto sono elencate in info.json nella chiave "foto": ["foto1.jpg", ...]
  // oppure generate automaticamente se presenti foto1..fotaN
  const photos = info.foto || [];

  // ── 5. Costruisci HTML pagina ────────────────────────────────────────
  const container = document.getElementById('trip-content');

  container.innerHTML = `
    <!-- HERO -->
    <div class="trip-hero">
      <div class="trip-hero-bg" id="hero-bg"></div>
      <div class="trip-hero-content">
        <div class="trip-hero-nation">${info.nazione.toUpperCase()}</div>
        <h1 class="trip-hero-title">${info.titolo || info.nazione}</h1>
        <div class="trip-hero-date">${formatDate(info.data)}</div>
        <p class="trip-hero-desc">${info.descrizione || ''}</p>
      </div>
    </div>

    <!-- FOTO COPERTINA CON FORMA NAZIONE -->
    <div class="cover-shape-section">
      <div>
        <div class="cover-shape-wrapper" id="cover-wrapper">
          <!-- SVG generato da JS -->
        </div>
        <p class="cover-shape-caption">✦ ${info.nazione} ✦</p>
      </div>
    </div>

    <!-- GALLERIA -->
    <div class="gallery-section">
      <h2>Fotografie</h2>
      <div class="photo-grid" id="photo-grid"></div>
    </div>
  `;

  // ── 6. Imposta hero background (prima foto) ─────────────────────────
  const firstPhoto = photos[0] || 'foto1.jpg';
  const heroBg = document.getElementById('hero-bg');
  heroBg.style.backgroundImage = `url('${firstPhoto}')`;
  setTimeout(() => heroBg.classList.add('loaded'), 100);

  // ── 7. Copertina con SVG nativo a forma di nazione ──────────────────
  buildCountrySVG('cover-wrapper', firstPhoto, info.nazione);

  // ── 8. Popola galleria (tutte le foto tranne la prima) ───────────────
  const grid = document.getElementById('photo-grid');
  const galleryPhotos = photos.length > 1 ? photos.slice(1) : photos;

  galleryPhotos.forEach((photo, i) => {
    const item = document.createElement('div');
    item.className = 'photo-item';
    item.innerHTML = `<img src="${photo}" alt="Foto ${i+2}" loading="lazy" />`;
    item.addEventListener('click', () => openLightbox(galleryPhotos, i));
    grid.appendChild(item);
  });

})();

// ── APPLICA TEMA ────────────────────────────────────────────────────────
function applyTheme(nazione, temaOverride) {
  const temi = {
    giappone:   { font: 'Noto Serif JP', accent: '#c0392b', bg: '#0d0a0a', card: '#1a1010', texture: 'sakura' },
    marocco:    { font: 'Amiri',         accent: '#d4960a', bg: '#0d0b06', card: '#1a1508', texture: 'geometric' },
    islanda:    { font: 'Icelandic',     accent: '#4db8ff', bg: '#060d14', card: '#0c1a24', texture: 'aurora' },
    giordania:  { font: 'Scheherazade New', accent: '#c8860a', bg: '#0d0a05', card: '#1a1408', texture: 'desert' },
    peru:       { font: 'Raleway',       accent: '#e8a020', bg: '#0a0805', card: '#181208', texture: 'inca' },
    irlanda:    { font: 'Lora',          accent: '#3a9a40', bg: '#060d08', card: '#0e1a10', texture: 'celtic' },
    norvegia:   { font: 'Josefin Sans',  accent: '#4d94c8', bg: '#06080d', card: '#0e1018', texture: 'fjord' },
    italia:     { font: 'Cinzel',        accent: '#c8960a', bg: '#0a0805', card: '#181208', texture: 'roman' },
    portogallo: { font: 'EB Garamond',   accent: '#2060a0', bg: '#060810', card: '#0c1018', texture: 'azulejo' },
    spagna:     { font: 'Abril Fatface', accent: '#c83020', bg: '#0d0806', card: '#1a100c', texture: 'flamenco' },
  };

  const key = nazione.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'_');
  const tema = temaOverride || temi[key] || { font: 'Playfair Display', accent: '#c9a84c', bg: '#0f0e0d', card: '#1a1815' };

  // CSS variables
  document.documentElement.style.setProperty('--accent', tema.accent);
  document.documentElement.style.setProperty('--dark', tema.bg);
  document.documentElement.style.setProperty('--gold', tema.accent);
  document.body.style.background = tema.bg;

  // Carica font Google se specificato
  if (tema.font && !document.querySelector(`link[data-font="${tema.font}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.dataset.font = tema.font;
    const fontParam = tema.font.replace(/ /g, '+');
    link.href = `https://fonts.googleapis.com/css2?family=${fontParam}:wght@400;700&display=swap`;
    document.head.appendChild(link);

    // Applica il font ai titoli
    link.onload = () => {
      document.querySelectorAll('.trip-hero-title, .site-title, .card-title').forEach(el => {
        el.style.fontFamily = `'${tema.font}', serif`;
      });
    };
  }
}

// ── COVER A FORMA DI NAZIONE — SVG NATIVO ───────────────────────────────
/**
 * Approccio: crea un <svg> visibile dentro il wrapper.
 * Dentro l'SVG usa <defs><clipPath> + <image> nello stesso documento SVG.
 * Questo è l'unico metodo garantito cross-browser: il clipPath
 * e l'elemento che clippa vivono nello stesso contesto SVG,
 * quindi non ci sono problemi di scope o objectBoundingBox.
 */
function buildCountrySVG(wrapperId, photoSrc, nazione) {
  if (!window.getCountryShape) return;
  const shape   = window.getCountryShape(nazione);
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;

  const clipId  = 'clip-' + Math.random().toString(36).slice(2, 8);
  const svgNS   = 'http://www.w3.org/2000/svg';
  const xlinkNS = 'http://www.w3.org/1999/xlink';
  const VB      = shape.viewBox; // es. "0 0 220 150"

  // Crea SVG responsivo: prende tutta la larghezza del wrapper, altezza auto
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('xmlns', svgNS);
  svg.setAttribute('viewBox', VB);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.style.cssText = 'display:block;width:100%;height:100%;';

  // <defs> con <clipPath> che usa il path della nazione
  const defs    = document.createElementNS(svgNS, 'defs');
  const clip    = document.createElementNS(svgNS, 'clipPath');
  clip.setAttribute('id', clipId);
  const pathEl  = document.createElementNS(svgNS, 'path');
  pathEl.setAttribute('d', shape.path);
  clip.appendChild(pathEl);
  defs.appendChild(clip);
  svg.appendChild(defs);

  // <image> che occupa tutta la viewBox, ritagliata dalla forma
  const [,, vw, vh] = VB.split(' ').map(Number);
  const img = document.createElementNS(svgNS, 'image');
  img.setAttribute('x', '0');
  img.setAttribute('y', '0');
  img.setAttribute('width',  String(vw));
  img.setAttribute('height', String(vh));
  img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  img.setAttribute('clip-path', `url(#${clipId})`);
  // href moderno + xlink:href per compatibilità
  img.setAttribute('href', photoSrc);
  img.setAttributeNS(xlinkNS, 'xlink:href', photoSrc);
  svg.appendChild(img);

  // Sostituisce il contenuto del wrapper
  wrapper.innerHTML = '';
  wrapper.appendChild(svg);
}

// ── VECCHIO CLIP-PATH (non più usato, tenuto per riferimento) ────────────
/**
 * @deprecated — usa buildCountrySVG al suo posto
 * Strategia: usa clipPathUnits="objectBoundingBox" con coordinate 0..1
 * Il path SVG viene normalizzato matematicamente dalla viewBox originale.
 * L'SVG <defs> viene iniettato direttamente nell'<img> wrapper,
 * e il clip-path applicato inline sull'immagine.
 * Non dipende da offsetWidth/offsetHeight né dal timing del layout.
 */
function applyCountryClipWithTransform(wrapperId, imgId, nazione) {
  if (!window.getCountryShape) return;

  const shape = window.getCountryShape(nazione);
  const wrapper = document.getElementById(wrapperId);
  const img     = document.getElementById(imgId);
  if (!wrapper || !img) return;

  const clipId = 'cc-' + Math.random().toString(36).slice(2, 8);
  const [vx, vy, vw, vh] = shape.viewBox.split(' ').map(Number);

  // Normalizza il path in coordinate 0..1 (objectBoundingBox)
  const normalizedPath = normalizeSvgPath(shape.path, vx, vy, vw, vh);

  // Costruisci l'SVG con clipPath
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg   = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('xmlns', svgNS);
  svg.setAttribute('width',  '0');
  svg.setAttribute('height', '0');
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';

  const defs = document.createElementNS(svgNS, 'defs');
  const clip = document.createElementNS(svgNS, 'clipPath');
  clip.setAttribute('id', clipId);
  clip.setAttribute('clipPathUnits', 'objectBoundingBox');

  const pathEl = document.createElementNS(svgNS, 'path');
  pathEl.setAttribute('d', normalizedPath);

  clip.appendChild(pathEl);
  defs.appendChild(clip);
  svg.appendChild(defs);

  // Inserisci SVG come primo figlio del wrapper (rimane nel DOM locale)
  wrapper.insertBefore(svg, wrapper.firstChild);

  // Applica il clip all'immagine con riferimento relativo all'elemento padre
  img.style.clipPath        = `url(#${clipId})`;
  img.style.webkitClipPath  = `url(#${clipId})`;
  // Assicura che l'immagine copra il wrapper correttamente
  img.style.width      = '100%';
  img.style.height     = '100%';
  img.style.objectFit  = 'cover';
  img.style.display    = 'block';
}

/**
 * Normalizza un SVG path da coordinate viewBox a range 0..1
 * necessario per clipPathUnits="objectBoundingBox".
 * Gestisce tutti i comandi assoluti: M, L, C, S, Q, A, Z
 */
function normalizeSvgPath(pathStr, vx, vy, vw, vh) {
  // Tokenizza il path in coppie comando + coordinate
  const tokens = pathStr.match(/[MmLlCcSsQqAaZz]|[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g) || [];

  let result = '';
  let i = 0;
  let cmd = '';

  const nx = n => ((parseFloat(n) - vx) / vw).toFixed(6); // normalizza X
  const ny = n => ((parseFloat(n) - vy) / vh).toFixed(6); // normalizza Y
  const nw = n => (parseFloat(n) / vw).toFixed(6);         // scala larghezza
  const nh = n => (parseFloat(n) / vh).toFixed(6);         // scala altezza

  while (i < tokens.length) {
    const t = tokens[i];
    if (/[MmLlCcSsQqAaZz]/.test(t)) {
      cmd = t;
      result += cmd;
      i++;
      continue;
    }

    switch (cmd.toUpperCase()) {
      case 'M': case 'L':
        result += ` ${nx(tokens[i])} ${ny(tokens[i+1])}`;
        i += 2; break;
      case 'C':
        result += ` ${nx(tokens[i])} ${ny(tokens[i+1])} ${nx(tokens[i+2])} ${ny(tokens[i+3])} ${nx(tokens[i+4])} ${ny(tokens[i+5])}`;
        i += 6; break;
      case 'S': case 'Q':
        result += ` ${nx(tokens[i])} ${ny(tokens[i+1])} ${nx(tokens[i+2])} ${ny(tokens[i+3])}`;
        i += 4; break;
      case 'A':
        // rx ry x-rot large-arc sweep x y
        result += ` ${nw(tokens[i])} ${nh(tokens[i+1])} ${tokens[i+2]} ${tokens[i+3]} ${tokens[i+4]} ${nx(tokens[i+5])} ${ny(tokens[i+6])}`;
        i += 7; break;
      case 'Z':
        result += ' Z';
        i++; break;
      default:
        result += ' ' + t;
        i++;
    }
  }

  return result.trim();
}

// Esporta
window.applyCountryClip = applyCountryClipWithTransform;

// Richiama dopo il rendering del contenuto (immagine già nel DOM)
// Usa MutationObserver per intercettare quando cover-img viene creato
const _observer = new MutationObserver(() => {
  const img = document.getElementById('cover-img');
  if (!img) return;
  _observer.disconnect();

  const applyWhenReady = () => {
    const naz = document.querySelector('.trip-hero-nation');
    if (naz) applyCountryClipWithTransform('cover-wrapper', 'cover-img', naz.textContent.trim());
  };

  if (img.complete && img.naturalWidth > 0) {
    applyWhenReady();
  } else {
    img.addEventListener('load',  applyWhenReady, { once: true });
    img.addEventListener('error', applyWhenReady, { once: true }); // applica anche se la foto manca
  }
});
_observer.observe(document.getElementById('trip-content') || document.body, { childList: true, subtree: true });

// ── LIGHTBOX ────────────────────────────────────────────────────────────
let currentPhotos = [];
let currentIndex  = 0;

window.openLightbox = function(photos, index) {
  currentPhotos = photos;
  currentIndex  = index;
  updateLightbox();
  document.getElementById('lightbox').classList.remove('hidden');
  document.addEventListener('keydown', handleKey);
};

window.closeLightbox = function() {
  document.getElementById('lightbox').classList.add('hidden');
  document.removeEventListener('keydown', handleKey);
};

window.changePhoto = function(dir) {
  currentIndex = (currentIndex + dir + currentPhotos.length) % currentPhotos.length;
  updateLightbox();
};

function updateLightbox() {
  document.getElementById('lightbox-img').src = currentPhotos[currentIndex];
  document.getElementById('lightbox-counter').textContent =
    `${currentIndex + 1} / ${currentPhotos.length}`;
}

function handleKey(e) {
  if (e.key === 'ArrowRight') window.changePhoto(1);
  if (e.key === 'ArrowLeft')  window.changePhoto(-1);
  if (e.key === 'Escape')     window.closeLightbox();
}

// ── UTILITY ─────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { year: 'numeric', month: 'long' });
  } catch { return dateStr; }
}
