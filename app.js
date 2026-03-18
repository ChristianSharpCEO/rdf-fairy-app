/* ============================================
   RDF: Fairy-Led St. John's Passport
   app.js — Phase 1 MVP (Glassmorphism Update)
   
   Modules:
   1. Configuration & Constants
   2. Venue Directory Database (JSON)
   3. Newfoundland Slang Weather Engine
   4. Weather API Integration (OpenWeatherMap)
   5. Directory Rendering & Filtering
   6. Push Notifications ("Duolingo" Guilt-Trip)
   7. Tab Navigation
   8. Service Worker Registration
   9. Initialization
   ============================================ */


/* ═══════════════════════════════════════════════
   1. CONFIGURATION
   ═══════════════════════════════════════════════ */

// ⚠️ REPLACE THIS with your OpenWeatherMap API key
// Get a free key at: https://openweathermap.org/api
const API_KEY = 'YOUR_API_KEY_HERE';

const CONFIG = {
  // St. John's, NL coordinates
  LAT: 47.5615,
  LON: -52.7126,
  CITY: "St. John's, NL",

  // Weather refresh interval (milliseconds)
  WEATHER_REFRESH: 10 * 60 * 1000, // 10 minutes
};


/* ═══════════════════════════════════════════════
   2. VENUE DIRECTORY DATABASE
   ───────────────────────────────────────────────
   Hardcoded JSON array of real St. John's indoor
   venues. Each entry has:
     - id:          Unique identifier
     - name:        Venue name
     - category:    Primary category for filtering
     - description: Short blurb (NL flavour welcome)
     - tags:        Array of filterable feature tags
   ═══════════════════════════════════════════════ */

const VENUES = [
  {
    id: 1,
    name: "The Rooms",
    category: "Museum & Gallery",
    description: "Provincial art gallery, museum, and archives under one roof. Three floors of rotating exhibits plus a café with the best harbour view in town. A rainy day staple since 2005.",
    tags: ["Culture", "Family Friendly", "Dry Parking"],
  },
  {
    id: 2,
    name: "Johnson Geo Centre",
    category: "Science Centre",
    description: "Built into the rock of Signal Hill itself. Hands-on geology and space exhibits — the Titanic story told from a Newfoundland perspective. Perfect for curious youngsters and clever adults alike.",
    tags: ["Culture", "Family Friendly", "Dry Parking"],
  },
  {
    id: 3,
    name: "Jack Axes",
    category: "Axe Throwing",
    description: "Hurl hatchets at wooden targets with your b'ys. Instructors will get you throwing bullseyes before you know it. BYOB-friendly and ideal for a rowdy RDF afternoon.",
    tags: ["Entertainment", "Groups"],
  },
  {
    id: 4,
    name: "The Rec Room",
    category: "Arcade & Entertainment",
    description: "Full arcade floor, VR stations, bowling lanes, and a scratch kitchen. If it's too mauzy outside, this is where the whole crew ends up. Gets packed on weekends — arrive early.",
    tags: ["Entertainment", "Family Friendly", "Dry Parking"],
  },
  {
    id: 5,
    name: "Escape Quest",
    category: "Escape Rooms",
    description: "Themed puzzle rooms where your group has 60 minutes to crack the code. Scenarios range from pirate ships to haunted lighthouses. Book ahead — rainy days fill the slots fast.",
    tags: ["Entertainment", "Groups"],
  },
  {
    id: 6,
    name: "Bannerman Brewing",
    category: "Craft Brewery",
    description: "Local microbrewery on Waterfront Drive with a cozy taproom. Rotating taps, board games on the shelf, and the kind of place where strangers end up sharing a table. Best kind.",
    tags: ["Pubs & Breweries"],
  },
  {
    id: 7,
    name: "Battery Café",
    category: "Café",
    description: "Tucked into the Battery neighbourhood, this tiny café serves proper coffee and baked goods with a view of the Narrows. Warm up, dry off, and watch the fog roll in from the window.",
    tags: ["Café", "Cozy Spots"],
  },
  {
    id: 8,
    name: "Newman Wine Vaults",
    category: "Historic Site",
    description: "One of St. John's oldest buildings — a 200-year-old wine cellar where port was once aged. Guided tours run seasonally. Dark, atmospheric, and dripping with history (literally).",
    tags: ["Culture", "Historic"],
  },
];


/* ═══════════════════════════════════════════════
   3. NEWFOUNDLAND SLANG WEATHER ENGINE
   ───────────────────────────────────────────────
   Maps OpenWeather condition codes to NL slang.
   Reference: https://openweathermap.org/weather-conditions
   ═══════════════════════════════════════════════ */

/**
 * Returns an HTML string with NL slang for the current weather.
 * @param {number} weatherId — OpenWeather condition code (e.g. 300, 800)
 * @param {number} temp — Temperature in Celsius
 * @returns {string} — HTML with .slang-bold spans for emphasis
 */
function getWeatherSlang(weatherId, temp) {
  // 2xx: Thunderstorm
  if (weatherId >= 200 && weatherId < 300) {
    return `<span class="slang-bold">Lard tunderin'!</span> She's blowin' a gale. Stay put, me son.`;
  }
  // 3xx: Drizzle — quintessential RDF weather
  if (weatherId >= 300 && weatherId < 400) {
    return `'Tis <span class="slang-bold">mauzy</span> out — damp enough to rot ya. Proper RDF weather, b'y.`;
  }
  // 5xx: Rain
  if (weatherId >= 500 && weatherId < 600) {
    return `Weather: <span class="slang-bold">Not Fit.</span> She's lashing rain — ye'd be drownded out there.`;
  }
  // 6xx: Snow
  if (weatherId >= 600 && weatherId < 700) {
    if (temp <= -10) {
      return `<span class="slang-bold">Skin alive!</span> Freezin' and sideways snow. Don't be at it.`;
    }
    return `Snow on the go. Bit <span class="slang-bold">civil</span> if ya bundle up, but we got indoor spots.`;
  }
  // 7xx: Atmosphere (fog, mist, haze)
  if (weatherId >= 700 && weatherId < 800) {
    return `<span class="slang-bold">Pea soup fog</span> — can't see yer hand before yer face. Classic St. John's.`;
  }
  // 800: Clear sky
  if (weatherId === 800) {
    if (temp > 18) {
      return `<span class="slang-bold">Deadly!</span> Sun's out — a rare gift. Go enjoy it, or don't, we got ya.`;
    }
    return `Clear out, but don't get <span class="slang-bold">cracked</span> — could change in five minutes.`;
  }
  // 80x: Clouds
  if (weatherId > 800) {
    return `<span class="slang-bold">Overcast</span> and moody. The fog's thinkin' about it. Grand day to explore inside.`;
  }
  // Fallback
  return `Some <span class="slang-bold">weather</span> out there, b'y. Check the cams.`;
}

/**
 * Returns an emoji for the given weather condition code.
 */
function getWeatherEmoji(weatherId) {
  if (weatherId >= 200 && weatherId < 300) return '⛈️';
  if (weatherId >= 300 && weatherId < 400) return '🌧️';
  if (weatherId >= 500 && weatherId < 600) return '🌧️';
  if (weatherId >= 600 && weatherId < 700) return '🌨️';
  if (weatherId >= 700 && weatherId < 800) return '🌫️';
  if (weatherId === 800) return '☀️';
  if (weatherId > 800 && weatherId <= 802) return '⛅';
  return '☁️';
}


/* ═══════════════════════════════════════════════
   4. WEATHER API INTEGRATION
   ═══════════════════════════════════════════════ */

/**
 * Fetches current weather from OpenWeatherMap and
 * renders it into the #weather-content container.
 * Falls back to simulated "mauzy" demo data if the
 * API key is missing or the request fails.
 */
async function fetchWeather() {
  const container = document.getElementById('weather-content');
  if (!container) return;

  // Show loading spinner
  container.innerHTML = `
    <div class="weather-loading">
      <div class="loading-ring"></div>
      Checking the weather on Signal Hill...
    </div>
  `;

  // If no API key, show demo/fallback weather
  if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
    renderWeatherFallback(container);
    return;
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${CONFIG.LAT}&lon=${CONFIG.LON}&appid=${API_KEY}&units=metric`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`OpenWeather API returned status ${res.status}`);
    }

    const data = await res.json();
    renderWeatherLive(container, data);
  } catch (err) {
    console.warn('[RDF] Weather fetch failed:', err.message);
    renderWeatherFallback(container);
  }
}

/**
 * Renders live weather data from the API response.
 */
function renderWeatherLive(container, data) {
  const temp      = Math.round(data.main.temp);
  const feelsLike = Math.round(data.main.feels_like);
  const weatherId = data.weather[0].id;
  const desc      = data.weather[0].description;
  const humidity  = data.main.humidity;
  const wind      = Math.round(data.wind.speed * 3.6); // m/s → km/h
  const emoji     = getWeatherEmoji(weatherId);
  const slang     = getWeatherSlang(weatherId, temp);

  container.innerHTML = `
    <div class="weather-row">
      <div>
        <div class="weather-location">📍 ${CONFIG.CITY}</div>
        <div class="weather-temp">${temp}<sup>°C</sup></div>
        <div class="weather-condition">${desc} · Feels like ${feelsLike}°C</div>
      </div>
      <div class="weather-emoji">${emoji}</div>
    </div>
    <div class="weather-slang">
      <div class="slang-text">${slang}</div>
    </div>
    <div class="weather-stats">
      <div class="weather-stat">💨 Wind <span>${wind} km/h</span></div>
      <div class="weather-stat">💧 Humidity <span>${humidity}%</span></div>
    </div>
  `;
}

/**
 * Renders simulated "mauzy" weather for demo / missing API key.
 */
function renderWeatherFallback(container) {
  container.innerHTML = `
    <div class="weather-row">
      <div>
        <div class="weather-location">📍 ${CONFIG.CITY}</div>
        <div class="weather-temp">7<sup>°C</sup></div>
        <div class="weather-condition">Drizzle &amp; Fog · Feels like 3°C</div>
      </div>
      <div class="weather-emoji">🌫️</div>
    </div>
    <div class="weather-slang">
      <div class="slang-text">
        'Tis <span class="slang-bold">mauzy</span> out — damp enough to rot ya. Proper RDF weather, b'y.
      </div>
    </div>
    <div class="weather-stats">
      <div class="weather-stat">💨 Wind <span>38 km/h</span></div>
      <div class="weather-stat">💧 Humidity <span>94%</span></div>
    </div>
  `;
}


/* ═══════════════════════════════════════════════
   5. DIRECTORY RENDERING & FILTERING
   ───────────────────────────────────────────────
   Dynamically generates filter chips from the
   venue data, then renders glass cards based on
   the active filter.
   ═══════════════════════════════════════════════ */

let activeFilter = 'All';

/**
 * Builds the filter chip bar dynamically from all
 * unique tags found across the venue database.
 */
function buildFilterChips() {
  const bar = document.getElementById('filter-bar');
  if (!bar) return;

  // Collect all unique tags across venues
  const tagSet = new Set();
  VENUES.forEach(v => v.tags.forEach(t => tagSet.add(t)));
  const allTags = ['All', ...Array.from(tagSet).sort()];

  bar.innerHTML = allTags.map(tag => {
    const isActive = tag === activeFilter ? 'active' : '';
    return `<button class="chip ${isActive}" data-filter="${tag}" role="tab" aria-selected="${tag === activeFilter}">${tag}</button>`;
  }).join('');

  // Attach click handlers
  bar.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      activeFilter = chip.dataset.filter;
      // Update chip states
      bar.querySelectorAll('.chip').forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-selected', 'false');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-selected', 'true');
      // Re-render venues
      renderDirectory();
    });
  });
}

/**
 * Renders venue cards into #venue-list, filtered
 * by the currently active tag filter.
 */
function renderDirectory() {
  const list = document.getElementById('venue-list');
  if (!list) return;

  // Filter venues by active tag (or show all)
  const filtered = activeFilter === 'All'
    ? VENUES
    : VENUES.filter(v => v.tags.includes(activeFilter));

  // Empty state
  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🧚</div>
        <div class="empty-text">
          Nothing matches that filter, b'y.<br>
          The fairies must've hidden them. Try another.
        </div>
      </div>
    `;
    return;
  }

  // Render glass cards
  list.innerHTML = filtered.map(v => `
    <article class="venue-card glass" data-id="${v.id}" role="listitem">
      <div class="venue-card-head">
        <div>
          <div class="venue-name">${v.name}</div>
          <div class="venue-category">${v.category}</div>
        </div>
        <div class="venue-cat-badge">${v.category}</div>
      </div>
      <div class="venue-desc">${v.description}</div>
      <div class="venue-tags">
        ${v.tags.map(t => `<span class="venue-tag">${t}</span>`).join('')}
      </div>
    </article>
  `).join('');
}


/* ═══════════════════════════════════════════════
   6. PUSH NOTIFICATIONS — "DUOLINGO" GUILT-TRIP
   ───────────────────────────────────────────────
   Uses the browser Notification API to request
   permission and simulate rain alert pushes.
   
   The notification messages are passive-aggressive
   and guilt-tripping, NL slang style.
   ═══════════════════════════════════════════════ */

/**
 * Pool of guilt-trip notification messages.
 * Rotated randomly by triggerRainAlert().
 */
const GUILT_MESSAGES = [
  {
    title: "🧚 This weather, what a sin.",
    body: "You're really going to stay inside without catching a Fairy Charm? Get on the go, b'y!",
  },
  {
    title: "🌧️ 'Tis mauzy out, me duckie.",
    body: "The fairies are waiting in the fog and you're just sat there? They won't wait forever, ya know.",
  },
  {
    title: "🧚 The fairies noticed you haven't moved.",
    body: "They're not angry, just disappointed. Sure, get out of it and find a Charm before they vanish.",
  },
  {
    title: "📯 Fog Horn Alert!",
    body: "Luh! Everyone else is collecting Fairy Charms and you're scrolling on your phone. Wouldn't be me.",
  },
  {
    title: "🌫️ Pea soup fog rolling in.",
    body: "Perfect fairy weather and you're doing NOTHING? The b'ys are all out. Don't be the last one.",
  },
  {
    title: "🧚 Your fairy is wondering about you.",
    body: "She flew all the way from the Battery in the lashing rain, and you can't be bothered? Lovely.",
  },
  {
    title: "⛈️ Lard tunderin' Jesus.",
    body: "Storm's here. Fairy Charms are popping up all over downtown. You're missing them all. Just saying.",
  },
  {
    title: "🧚 Day 1 of you ignoring the fairies.",
    body: "They're keeping track, by the way. Get on the go before they hold a grudge.",
  },
];

/**
 * Requests Notification API permission and updates
 * the alert button UI to reflect the result.
 */
async function requestNotificationPermission() {
  const btn = document.getElementById('btn-enable-alerts');
  if (!btn) return;

  // Check if Notification API is available
  if (!('Notification' in window)) {
    btn.textContent = 'N/A';
    btn.classList.add('denied');
    console.warn('[RDF] Notifications not supported in this browser.');
    return;
  }

  // Already granted
  if (Notification.permission === 'granted') {
    btn.textContent = '✓ On';
    btn.classList.add('enabled');
    // Fire a welcome notification
    triggerRainAlert();
    return;
  }

  // Already denied
  if (Notification.permission === 'denied') {
    btn.textContent = 'Denied';
    btn.classList.add('denied');
    return;
  }

  // Request permission
  try {
    const result = await Notification.requestPermission();

    if (result === 'granted') {
      btn.textContent = '✓ On';
      btn.classList.add('enabled');
      // Immediate test notification
      triggerRainAlert();
    } else {
      btn.textContent = 'Denied';
      btn.classList.add('denied');
    }
  } catch (err) {
    console.warn('[RDF] Notification permission error:', err);
    btn.textContent = 'Error';
    btn.classList.add('denied');
  }
}

/**
 * Fires a simulated push notification with a random
 * guilt-trip message from the pool.
 * 
 * In production, this would be triggered by a server
 * push via the Push API + Service Worker, keyed to
 * real weather conditions.
 */
function triggerRainAlert() {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.log('[RDF] Cannot send notification — permission not granted.');
    return;
  }

  // Pick a random guilt message
  const msg = GUILT_MESSAGES[Math.floor(Math.random() * GUILT_MESSAGES.length)];

  const notification = new Notification(msg.title, {
    body: msg.body,
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🧚</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🧚</text></svg>',
    tag: 'rdf-rain-alert', // prevents stacking duplicates
    requireInteraction: false,
  });

  // Log click (in production, deep-link to the Fairy Hunt tab)
  notification.onclick = () => {
    window.focus();
    notification.close();
    // [PHASE 2: Navigate to the Fairy Hunt tab]
  };
}

/**
 * Initializes the alert button with a click handler
 * and syncs UI to current permission state.
 */
function initNotifications() {
  const btn = document.getElementById('btn-enable-alerts');
  if (!btn) return;

  // Sync button state on load
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      btn.textContent = '✓ On';
      btn.classList.add('enabled');
    } else if (Notification.permission === 'denied') {
      btn.textContent = 'Denied';
      btn.classList.add('denied');
    }
  }

  // Click handler — request permission
  btn.addEventListener('click', requestNotificationPermission);
}


/* ═══════════════════════════════════════════════
   7. TAB NAVIGATION
   ───────────────────────────────────────────────
   Two-tab bottom nav: Radar (home) & Directory.
   Switches visible .view panels with a fade-in.
   ═══════════════════════════════════════════════ */

function initNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  const views = document.querySelectorAll('.view');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      // Update active tab styling
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Switch visible view
      views.forEach(v => v.classList.remove('active'));
      const targetView = document.getElementById(`view-${target}`);
      if (targetView) targetView.classList.add('active');

      // Scroll to top on tab change
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}


/* ═══════════════════════════════════════════════
   8. SERVICE WORKER REGISTRATION
   ═══════════════════════════════════════════════ */

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      console.log('[RDF] Service Worker registered, scope:', reg.scope);
    } catch (err) {
      console.warn('[RDF] SW registration failed:', err);
    }
  }
}


/* ═══════════════════════════════════════════════
   9. INITIALIZATION
   ───────────────────────────────────────────────
   Runs on DOMContentLoaded. Boots all modules.
   ═══════════════════════════════════════════════ */

// [PHASE 2 PLACEHOLDER: HTML5 GEOLOCATION]
// ─────────────────────────────────────────
// function initGeolocation() {
//   if ('geolocation' in navigator) {
//     navigator.geolocation.watchPosition(
//       (pos) => {
//         const { latitude, longitude } = pos.coords;
//         // TODO: Check proximity to fairy hotspot coordinates
//         // TODO: Trigger folk-glass "win state" on venue cards
//         // TODO: Update fairy markers on hunt map
//       },
//       (err) => console.warn('[RDF] Geo error:', err),
//       { enableHighAccuracy: true, maximumAge: 30000 }
//     );
//   }
// }

document.addEventListener('DOMContentLoaded', () => {
  // Boot weather
  fetchWeather();

  // Boot directory
  buildFilterChips();
  renderDirectory();

  // Boot navigation
  initNavigation();

  // Boot notifications
  initNotifications();

  // Boot service worker
  registerServiceWorker();

  // Auto-refresh weather
  setInterval(fetchWeather, CONFIG.WEATHER_REFRESH);

  console.log('[RDF] 🧚 Fairy-Led Passport initialized. Stay dry, b\'y.');
});
