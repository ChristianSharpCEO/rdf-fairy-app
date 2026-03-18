/* ============================================
   RDF: Fairy-Led St. John's Passport
   app.js — Phase 1 MVP
   ============================================ */

// ─── CONFIGURATION ───────────────────────────
const CONFIG = {
  // ⚠️ REPLACE WITH YOUR OPENWEATHER API KEY
  OPENWEATHER_API_KEY: 'YOUR_API_KEY_HERE',
  // St. John's, NL coordinates
  LAT: 47.5615,
  LON: -52.7126,
  CITY_NAME: "St. John's, NL",
  // NTV Sky Cam embed URL
  SKYCAM_URL: 'https://www.ntv.ca/skycam/',
};

// ─── DIRECTORY DATA (Hardcoded Phase 1) ──────
const VENUES = [
  {
    id: 1,
    name: "The Rooms",
    type: "Museum & Gallery",
    description: "Provincial art gallery, museum, and archives. Three floors of rotating exhibits, plus a café with the best harbour view in town.",
    address: "9 Bonaventure Ave",
    hours: "10AM – 5PM",
    tags: ["Family Friendly", "Dry Parking"],
    crowd: "quiet",        // quiet | busy | blocked
    crowdLabel: "Quiet",
    crowdEmoji: "🟢",
  },
  {
    id: 2,
    name: "The Rec Room",
    type: "Arcade Bar & Entertainment",
    description: "Full arcade, VR stations, bowling lanes, and a kitchen. Your go-to for a rainy-day blowout with the b'ys.",
    address: "70 Kenmount Rd (Avalon Mall)",
    hours: "11AM – 12AM",
    tags: ["Family Friendly", "Dry Parking"],
    crowd: "busy",
    crowdLabel: "Getting Busy",
    crowdEmoji: "🟡",
  },
  {
    id: 3,
    name: "The Duke of Duckworth",
    type: "Pub & Kitchen",
    description: "A proper downtown pub since 1992. Cold beer, hot fish & chips, and live trad on weekends. The kind of place where strangers become friends.",
    address: "325 Duckworth St",
    hours: "11AM – 2AM",
    tags: ["Pubs"],
    crowd: "blocked",
    crowdLabel: "Blocked",
    crowdEmoji: "🔴",
  },
];

// ─── NEWFOUNDLAND SLANG WEATHER MAP ──────────
function getWeatherSlang(weatherId, temp) {
  // OpenWeather condition codes: https://openweathermap.org/weather-conditions
  // Group 2xx: Thunderstorm, 3xx: Drizzle, 5xx: Rain, 6xx: Snow, 7xx: Atmosphere, 800: Clear, 80x: Clouds

  if (weatherId >= 200 && weatherId < 300) {
    return `<span class="slang-emphasis">Lard tunderin'!</span> It's blowin' a gale out there. Stay put, me son.`;
  }
  if (weatherId >= 300 && weatherId < 400) {
    return `'Tis <span class="slang-emphasis">mauzy</span> out — damp enough to rot ya. Proper RDF weather.`;
  }
  if (weatherId >= 500 && weatherId < 510) {
    return `Weather: <span class="slang-emphasis">Not Fit.</span> Heavy rain — ye'd be drownded out there, b'y.`;
  }
  if (weatherId >= 510 && weatherId < 600) {
    return `She's <span class="slang-emphasis">lashing</span> rain. Best kind of day to be inside.`;
  }
  if (weatherId >= 600 && weatherId < 700) {
    if (temp <= -10) {
      return `<span class="slang-emphasis">Skin alive!</span> Freezin' cold and snow sideways. Don't be at it.`;
    }
    return `Snow on the go. Bit <span class="slang-emphasis">civil</span> if you dress warm, but we got options inside.`;
  }
  if (weatherId >= 700 && weatherId < 800) {
    return `<span class="slang-emphasis">Pea soup fog</span> — can't see yer hand in front of yer face. Classic St. John's.`;
  }
  if (weatherId === 800) {
    if (temp > 18) {
      return `<span class="slang-emphasis">Deadly!</span> Sun's out — a rare gift. Go outside, or don't — we got ya either way.`;
    }
    return `Clear out, but don't get <span class="slang-emphasis">cracked</span> — could change in five minutes.`;
  }
  if (weatherId > 800) {
    return `<span class="slang-emphasis">Overcast</span> and moody. The fog's thinkin' about it. Good day to explore inside.`;
  }

  return `It's <span class="slang-emphasis">some weather</span> out there, b'y. Check the Sky Cam.`;
}

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

// ─── WEATHER FETCHING ────────────────────────
async function fetchWeather() {
  const container = document.getElementById('weather-content');

  // Show loading state
  container.innerHTML = `
    <div class="weather-loading">
      <div class="spinner"></div>
      Checking the weather on Signal Hill...
    </div>
  `;

  // Guard: no API key
  if (CONFIG.OPENWEATHER_API_KEY === 'YOUR_API_KEY_HERE') {
    renderWeatherFallback(container);
    return;
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${CONFIG.LAT}&lon=${CONFIG.LON}&appid=${CONFIG.OPENWEATHER_API_KEY}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data = await res.json();
    renderWeather(container, data);
  } catch (err) {
    console.warn('Weather fetch failed:', err);
    renderWeatherFallback(container);
  }
}

function renderWeather(container, data) {
  const temp = Math.round(data.main.temp);
  const feelsLike = Math.round(data.main.feels_like);
  const weatherId = data.weather[0].id;
  const desc = data.weather[0].description;
  const humidity = data.main.humidity;
  const windSpeed = Math.round(data.wind.speed * 3.6); // m/s to km/h
  const emoji = getWeatherEmoji(weatherId);
  const slang = getWeatherSlang(weatherId, temp);

  container.innerHTML = `
    <div class="weather-top">
      <div>
        <div class="weather-location">📍 ${CONFIG.CITY_NAME}</div>
        <div class="weather-temp">${temp}<sup>°C</sup></div>
        <div class="weather-desc">${desc} · Feels like ${feelsLike}°C</div>
      </div>
      <div class="weather-icon-wrap">${emoji}</div>
    </div>
    <div class="weather-slang">
      <div class="weather-slang-label">${slang}</div>
    </div>
    <div class="weather-details">
      <div class="weather-detail-item">💨 Wind <span>${windSpeed} km/h</span></div>
      <div class="weather-detail-item">💧 Humidity <span>${humidity}%</span></div>
    </div>
  `;
}

function renderWeatherFallback(container) {
  // Simulated "mauzy" weather for demo / missing API key
  container.innerHTML = `
    <div class="weather-top">
      <div>
        <div class="weather-location">📍 ${CONFIG.CITY_NAME}</div>
        <div class="weather-temp">7<sup>°C</sup></div>
        <div class="weather-desc">Drizzle & Fog · Feels like 3°C</div>
      </div>
      <div class="weather-icon-wrap">🌫️</div>
    </div>
    <div class="weather-slang">
      <div class="weather-slang-label">
        'Tis <span class="slang-emphasis">mauzy</span> out — damp enough to rot ya. Proper RDF weather.
      </div>
    </div>
    <div class="weather-details">
      <div class="weather-detail-item">💨 Wind <span>38 km/h</span></div>
      <div class="weather-detail-item">💧 Humidity <span>94%</span></div>
    </div>
  `;
}

// ─── DIRECTORY RENDERING ─────────────────────
let activeFilter = 'All';

function renderDirectory() {
  const list = document.getElementById('venue-list');
  const filtered = activeFilter === 'All'
    ? VENUES
    : VENUES.filter(v => v.tags.includes(activeFilter));

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🧚</div>
        <div class="empty-state-text">No spots found for that filter, b'y.<br>Try another one.</div>
      </div>
    `;
    return;
  }

  list.innerHTML = filtered.map(v => {
    const crowdClass =
      v.crowd === 'quiet' ? 'crowd-quiet' :
      v.crowd === 'busy' ? 'crowd-busy' : 'crowd-blocked';

    return `
      <article class="venue-card" data-venue-id="${v.id}">
        <div class="venue-card-top">
          <div>
            <div class="venue-name">${v.name}</div>
            <div class="venue-type">${v.type}</div>
          </div>
          <div class="venue-crowd ${crowdClass}">
            ${v.crowdEmoji} ${v.crowdLabel}
          </div>
        </div>
        <div class="venue-description">${v.description}</div>
        <div class="venue-tags">
          ${v.tags.map(t => `<span class="venue-tag">${t}</span>`).join('')}
        </div>
        <div class="venue-footer">
          <div class="venue-address">📍 ${v.address}</div>
          <div class="venue-hours">${v.hours}</div>
        </div>
      </article>
    `;
  }).join('');
}

function initFilters() {
  const chips = document.querySelectorAll('.filter-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.filter;
      renderDirectory();
    });
  });
}

// ─── TAB NAVIGATION ──────────────────────────
function initNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  const views = document.querySelectorAll('.view');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update active view
      views.forEach(v => v.classList.remove('active'));
      document.getElementById(`view-${target}`).classList.add('active');

      // Scroll to top on tab switch
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

// ─── SERVICE WORKER REGISTRATION ─────────────
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      console.log('[RDF] Service Worker registered:', reg.scope);
    } catch (err) {
      console.warn('[RDF] Service Worker registration failed:', err);
    }
  }
}

// ─── PHASE 2 PLACEHOLDER: GEOLOCATION ────────
// [PHASE 2: The Fairy Hunt]
// - Request user's location via HTML5 Geolocation API
// - Compare user coords against fairy "hotspot" coordinates
// - Trigger card-hearth state when user is within radius
// - Display fairy markers on an embedded map
//
// function initGeolocation() {
//   if ('geolocation' in navigator) {
//     navigator.geolocation.watchPosition(
//       (position) => {
//         const { latitude, longitude } = position.coords;
//         // TODO: Check proximity to fairy hotspots
//         // TODO: Update UI with user's location
//       },
//       (error) => {
//         console.warn('Geolocation error:', error);
//       },
//       { enableHighAccuracy: true, maximumAge: 30000 }
//     );
//   }
// }

// ─── INIT ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  fetchWeather();
  renderDirectory();
  initFilters();
  initNavigation();
  registerServiceWorker();

  // Refresh weather every 10 minutes
  setInterval(fetchWeather, 10 * 60 * 1000);
});
