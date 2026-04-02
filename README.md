# 🌍 I Miei Viaggi — Sito GitHub Pages

Un sito elegante per presentare i tuoi viaggi, con:
- Homepage con griglia delle destinazioni
- Pagina per ogni viaggio con foto a forma di nazione
- Tema visivo ispirato a ogni paese
- Lightbox per sfogliare le foto
- Galleria con layout editoriale

---

## 📁 Struttura del progetto

```
travel-site/
├── index.html              ← Homepage
├── style.css               ← Stile globale
├── js/
│   ├── trips-loader.js     ← Carica la lista viaggi
│   ├── trip-renderer.js    ← Renderizza la pagina del viaggio
│   └── country-shapes.js   ← Forme SVG delle nazioni
└── trips/
    ├── index.json           ← Lista di tutti i viaggi
    ├── giappone/
    │   ├── index.html
    │   ├── info.json
    │   ├── foto1.jpg
    │   ├── foto2.jpg
    │   └── ...
    ├── marocco/
    │   ├── index.html
    │   ├── info.json
    │   └── foto*.jpg
    └── _template/
        └── index.html       ← Template da copiare per nuovi viaggi
```

---

## 🚀 Come pubblicare su GitHub Pages

### 1. Crea un repository GitHub

Vai su [github.com](https://github.com) → **New repository**
- Nome: `viaggi` (o quello che preferisci)
- Visibilità: Public
- Non aggiungere README (lo aggiungeremo noi)

### 2. Carica i file

```bash
# Clona il repository
git clone https://github.com/TUO-USERNAME/viaggi.git
cd viaggi

# Copia tutti i file di questo progetto nella cartella
# poi:
git add .
git commit -m "Primo caricamento sito viaggi"
git push origin main
```

### 3. Attiva GitHub Pages

Nel repository su GitHub:
- Vai in **Settings** → **Pages**
- Source: `Deploy from a branch`
- Branch: `main` / `/ (root)`
- Clicca **Save**

Dopo ~2 minuti il sito sarà online su:
`https://TUO-USERNAME.github.io/viaggi/`

---

## ✈️ Aggiungere un nuovo viaggio

### 1. Crea la cartella

```
trips/
└── nome-nazione/
    ├── index.html   ← copia da trips/_template/index.html
    ├── info.json    ← vedi esempio sotto
    ├── foto1.jpg
    ├── foto2.jpg
    └── ...
```

### 2. Compila info.json

```json
{
  "nazione": "Portogallo",
  "titolo": "Fado e Azulejos",
  "data": "2024-09-10",
  "descrizione": "La tua descrizione del viaggio...",
  "foto": [
    "foto1.jpg",
    "foto2.jpg",
    "foto3.jpg"
  ]
}
```

> ⚠️ La **prima foto** dell'array verrà usata come copertina e ritagliata a forma di nazione.

### 3. Aggiorna trips/index.json

```json
[
  { "folder": "giappone", "cover": "foto1.jpg" },
  { "folder": "marocco",  "cover": "foto1.jpg" },
  { "folder": "portogallo", "cover": "foto1.jpg" }
]
```

### 4. Copia il template HTML

Copia `trips/_template/index.html` in `trips/nome-nazione/index.html`.
Puoi personalizzare il font nell'head per la nazione.

---

## 🎨 Personalizzazioni

### Aggiungere una forma di nazione

In `js/country-shapes.js` aggiungi:

```javascript
window.COUNTRY_SHAPES.portogallo = {
  viewBox: "0 0 120 260",
  path: "M60,10 C75,8 ..." // SVG path della nazione
};
```

Per ottenere path SVG di una nazione:
- [simplemaps.com/resources/svg-world](https://simplemaps.com/resources/svg-world)
- [geojson-maps.ash.ms](https://geojson-maps.ash.ms/)
- Copia il `<path d="...">` dall'SVG della nazione desiderata

### Cambiare il tema di una nazione

In `js/trip-renderer.js`, nella funzione `applyTheme()`:

```javascript
temi.nuova_nazione = {
  font: 'Nome Font Google',
  accent: '#colore-hex',
  bg: '#colore-sfondo-scuro',
  card: '#colore-card'
};
```

---

## 📷 Consigli per le foto

- Formato: JPG o WebP (più leggero)
- Dimensioni: max 2000px sul lato lungo
- Peso: idealmente < 500KB per foto
- La prima foto (`foto1.jpg`) è la più importante: è quella ritagliata a forma di nazione e usata come hero

---

## 🌐 Nazioni già supportate

Con forma SVG: Italia, Giappone, Marocco, Islanda, Giordania, Perù, Irlanda, Norvegia, Portogallo, Spagna

Con tema visivo: le stesse + molte altre tramite il campo `"tema"` custom in info.json.

---

Buoni viaggi! ✦
