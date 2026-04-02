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
          <!-- SVG clip-path iniettato da JS -->
          <img id="cover-img" class="cover-shape-img" src="" alt="Copertina ${info.nazione}" />
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

  // ── 7. Copertina con clip-path a forma di nazione ────────────────────
  const coverImg = document.getElementById('cover-img');
  coverImg.src = firstPhoto;
  applyCountryClip('cover-wrapper', 'cover-img', info.nazione);

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

// ── CLIP-PATH A FORMA DI NAZIONE ────────────────────────────────────────
function applyCountryClip(wrapperId, imgId, nazione) {
  if (!window.getCountryShape) return;

  const shape = window.getCountryShape(nazione);
  const wrapper = document.getElementById(wrapperId);
  const img = document.getElementById(imgId);
  if (!wrapper || !img) return;

  const clipId = 'country-clip-' + Date.now();

  // Inietta <svg> con il <clipPath>
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';

  const defs = document.createElementNS(svgNS, 'defs');
  const clip = document.createElementNS(svgNS, 'clipPath');
  clip.setAttribute('id', clipId);
  clip.setAttribute('clipPathUnits', 'objectBoundingBox');

  // Normalizza il path da viewBox a 0..1 spazio
  const [vx, vy, vw, vh] = shape.viewBox.split(' ').map(Number);
  const scaledPath = scaleSvgPath(shape.path, vx, vy, vw, vh);

  const pathEl = document.createElementNS(svgNS, 'path');
  pathEl.setAttribute('d', scaledPath);

  clip.appendChild(pathEl);
  defs.appendChild(clip);
  svg.appendChild(defs);
  wrapper.insertBefore(svg, wrapper.firstChild);

  img.style.clipPath = `url(#${clipId})`;
  img.style.webkitClipPath = `url(#${clipId})`;
}

function scaleSvgPath(pathStr, vx, vy, vw, vh) {
  // Trasforma coordinate assolute nel range 0..1 (objectBoundingBox)
  return pathStr.replace(/(-?[\d.]+)/g, (match, num, offset, str) => {
    // Determina se è coordinata X o Y dal contesto (alternanza semplificata)
    return match; // restituito così; la scala vera si fa sotto
  });

  // Approccio più robusto: applica un transform SVG
  // Invece di parsare il path, usiamo un transform sul clipPath stesso
}

// Approccio alternativo più robusto con transform
function applyCountryClipWithTransform(wrapperId, imgId, nazione) {
  if (!window.getCountryShape) return;

  const shape = window.getCountryShape(nazione);
  const wrapper = document.getElementById(wrapperId);
  const img = document.getElementById(imgId);
  if (!wrapper || !img || !wrapper.offsetWidth) {
    // Riprova quando l'immagine è caricata
    img && img.addEventListener('load', () => applyCountryClipWithTransform(wrapperId, imgId, nazione), { once: true });
    return;
  }

  const clipId = 'country-clip-' + Math.random().toString(36).slice(2);
  const W = wrapper.offsetWidth;
  const H = wrapper.offsetHeight || W;

  const [vx, vy, vw, vh] = shape.viewBox.split(' ').map(Number);
  const scaleX = W / vw;
  const scaleY = H / vh;
  const scale = Math.min(scaleX, scaleY);
  const tx = (W - vw * scale) / 2 - vx * scale;
  const ty = (H - vh * scale) / 2 - vy * scale;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('xmlns', svgNS);
  svg.setAttribute('width', String(W));
  svg.setAttribute('height', String(H));
  svg.style.position = 'absolute';
  svg.style.width = '0';
  svg.style.height = '0';

  const defs = document.createElementNS(svgNS, 'defs');
  const clip = document.createElementNS(svgNS, 'clipPath');
  clip.setAttribute('id', clipId);

  const g = document.createElementNS(svgNS, 'g');
  g.setAttribute('transform', `translate(${tx},${ty}) scale(${scale})`);

  const pathEl = document.createElementNS(svgNS, 'path');
  pathEl.setAttribute('d', shape.path);
  g.appendChild(pathEl);
  clip.appendChild(g);
  defs.appendChild(clip);
  svg.appendChild(defs);
  document.body.appendChild(svg);

  img.style.clipPath = `url(#${clipId})`;
}

// Usa la versione con transform (più affidabile)
window.applyCountryClip = applyCountryClipWithTransform;

// Richiama dopo il caricamento immagine
document.addEventListener('DOMContentLoaded', () => {
  const img = document.getElementById('cover-img');
  if (img) {
    img.addEventListener('load', () => {
      const info_naz = document.querySelector('.trip-hero-nation');
      if (info_naz) {
        const naz = info_naz.textContent.toLowerCase().trim();
        applyCountryClipWithTransform('cover-wrapper', 'cover-img', naz);
      }
    });
  }
});

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
