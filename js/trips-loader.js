/**
 * trips-loader.js
 * Legge trips/index.json (lista dei viaggi) e genera le card sulla homepage.
 *
 * Struttura attesa in trips/index.json:
 * [
 *   { "folder": "giappone", "cover": "foto1.jpg" },
 *   { "folder": "marocco",  "cover": "foto1.jpg" },
 *   ...
 * ]
 *
 * Ogni cartella trips/<folder>/ deve contenere:
 *   - info.json
 *   - le foto (jpg/jpeg/png/webp)
 */

(async function () {
  const grid = document.getElementById('trips-grid');

  let tripsIndex;
  try {
    const res = await fetch('/viaggi/trips/index.json');
    if (!res.ok) throw new Error('index.json non trovato');
    tripsIndex = await res.json();
  } catch (e) {
    grid.innerHTML = `<div class="loading-msg">
      Nessun viaggio trovato.<br>
      <small style="color:#555">Aggiungi trips/index.json con la lista delle cartelle.</small>
    </div>`;
    return;
  }

  grid.innerHTML = '';

  for (const trip of tripsIndex) {
    const folder = trip.folder;
    let info;

    try {
      const r = await fetch(`/viaggi/trips/${folder}/info.json`);
      if (!r.ok) throw new Error();
      info = await r.json();
    } catch {
      console.warn(`Impossibile leggere trips/${folder}/info.json`);
      continue;
    }

    const coverSrc = `/viaggi/trips/${folder}/${trip.cover || info.cover || 'foto1.jpeg'}`;

    // Crea card
    const card = document.createElement('a');
    card.href = `/viaggi/trips/${folder}/`;
    card.className = 'trip-card';

    card.innerHTML = `
      <div class="card-cover">
        <img src="${coverSrc}" alt="${info.nazione}" loading="lazy" />
        <div class="card-overlay">
          <span class="card-country-badge">${info.nazione}</span>
        </div>
      </div>
      <div class="card-body">
        <h2 class="card-title">${info.titolo || info.nazione}</h2>
        <div class="card-date">${formatDate(info.data)}</div>
        <p class="card-desc">${info.descrizione || ''}</p>
      </div>
    `;

    grid.appendChild(card);

    // Animazione ingresso con stagger
    card.style.opacity = '0';
    card.style.transform = 'translateY(24px)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, tripsIndex.indexOf(trip) * 120);
  }
})();

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { year: 'numeric', month: 'long' });
  } catch { return dateStr; }
}
