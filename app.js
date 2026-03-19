/* ============================================
   RDF: Fairy-Led St. John's Passport
   app.js — Phase 1 MVP (Glassmorphism Update)
   
   Modules:
   1. Configuration & Constants
   2. Venue Directory Database (JSON)
   3. Newfoundland Slang Weather Engine
   4. Weather API Integration (Open-Meteo — no key needed)
   5. Directory Rendering & Filtering
   6. Push Notifications ("Duolingo" Guilt-Trip)
   7. Tab Navigation
   8. Service Worker Registration
   9. Initialization
   10. The Fairy Hunt (Mystery Crawl GPS Engine)
   ============================================ */


/* ═══════════════════════════════════════════════
   1. CONFIGURATION
   ───────────────────────────────────────────────
   Using Open-Meteo API — free, no API key required.
   https://open-meteo.com/
   ═══════════════════════════════════════════════ */

const CONFIG = {
  // St. John's, NL coordinates
  LAT: 47.5615,
  LON: -52.7126,
  CITY: "St. John's, NL",

  // Open-Meteo endpoint (no key needed)
  WEATHER_URL: 'https://api.open-meteo.com/v1/forecast',

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
   Maps WMO Weather Interpretation Codes (used by
   Open-Meteo) to NL slang and emoji.
   Reference: https://open-meteo.com/en/docs
   
   WMO Code Groups:
     0       = Clear sky
     1-3     = Partly cloudy → Overcast
     45, 48  = Fog / Depositing rime fog
     51-55   = Drizzle (light → dense)
     56-57   = Freezing drizzle
     61-65   = Rain (slight → heavy)
     66-67   = Freezing rain
     71-77   = Snowfall / Snow grains
     80-82   = Rain showers
     85-86   = Snow showers
     95      = Thunderstorm
     96, 99  = Thunderstorm with hail
   ═══════════════════════════════════════════════ */

/**
 * Returns an HTML string with NL slang for current weather.
 * @param {number} wmo — WMO weather interpretation code
 * @param {number} temp — Temperature in Celsius
 * @returns {string} — HTML with .slang-bold spans
 */
function getWeatherSlang(wmo, temp) {
  // Thunderstorm (95, 96, 99)
  if (wmo >= 95) {
    return `<span class="slang-bold">Lard tunderin'!</span> She's blowin' a gale. Stay put, me son.`;
  }
  // Snow showers (85-86)
  if (wmo >= 85 && wmo <= 86) {
    return `Snow squalls on the go. <span class="slang-bold">Not fit</span> — stay where it's warm, b'y.`;
  }
  // Rain showers (80-82)
  if (wmo >= 80 && wmo <= 82) {
    return `Weather: <span class="slang-bold">Not Fit.</span> RDF in full effect — showers lashing down.`;
  }
  // Snowfall & snow grains (71-77)
  if (wmo >= 71 && wmo <= 77) {
    if (temp <= -10) {
      return `<span class="slang-bold">Skin alive!</span> Freezin' cold and snow sideways. Don't be at it.`;
    }
    return `Snow on the go. Bit <span class="slang-bold">civil</span> if ya bundle up, but we got indoor spots.`;
  }
  // Freezing rain (66-67)
  if (wmo >= 66 && wmo <= 67) {
    return `<span class="slang-bold">Glitter!</span> Freezing rain — the roads are glass. Stay in, me duckie.`;
  }
  // Rain (61-65)
  if (wmo >= 61 && wmo <= 65) {
    return `Weather: <span class="slang-bold">Not Fit.</span> She's lashing rain — ye'd be drownded out there.`;
  }
  // Freezing drizzle (56-57)
  if (wmo >= 56 && wmo <= 57) {
    return `Freezing drizzle — <span class="slang-bold">mauzy</span> AND slippery. The worst combo, b'y.`;
  }
  // Drizzle (51-55) — quintessential RDF weather
  if (wmo >= 51 && wmo <= 55) {
    return `'Tis <span class="slang-bold">mauzy</span> out — damp enough to rot ya. Proper RDF weather, b'y.`;
  }
  // Fog (45, 48)
  if (wmo === 45 || wmo === 48) {
    return `<span class="slang-bold">Pea soup fog</span> — can't see yer hand before yer face. Classic St. John's.`;
  }
  // Overcast (3)
  if (wmo === 3) {
    return `<span class="slang-bold">Overcast</span> and moody. The fog's thinkin' about it. Grand day to explore inside.`;
  }
  // Partly cloudy (1-2)
  if (wmo >= 1 && wmo <= 2) {
    return `A few clouds about. Don't get <span class="slang-bold">cracked</span> — could change in five minutes.`;
  }
  // Clear sky (0)
  if (wmo === 0) {
    if (temp > 18) {
      return `Weather: <span class="slang-bold">Best Kind!</span> Sun's out — a rare gift. Go enjoy it, or don't.`;
    }
    return `Weather: <span class="slang-bold">Best Kind.</span> Clear skies — but this is St. John's, so give it a minute.`;
  }
  // Fallback
  return `Some <span class="slang-bold">weather</span> out there, b'y. Check the cams.`;
}

/**
 * Returns an emoji for the given WMO weather code.
 */
function getWeatherEmoji(wmo) {
  if (wmo >= 95) return '⛈️';          // Thunderstorm
  if (wmo >= 85) return '🌨️';          // Snow showers
  if (wmo >= 80) return '🌧️';          // Rain showers
  if (wmo >= 71) return '🌨️';          // Snow
  if (wmo >= 66) return '🧊';          // Freezing rain
  if (wmo >= 61) return '🌧️';          // Rain
  if (wmo >= 51) return '🌧️';          // Drizzle
  if (wmo === 45 || wmo === 48) return '🌫️'; // Fog
  if (wmo >= 1) return '⛅';            // Cloudy
  return '☀️';                          // Clear
}

/**
 * Returns a human-readable description for a WMO code.
 */
function getWmoDescription(wmo) {
  const descriptions = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    66: 'Light freezing rain', 67: 'Heavy freezing rain',
    71: 'Slight snowfall', 73: 'Moderate snowfall', 75: 'Heavy snowfall',
    77: 'Snow grains', 80: 'Slight rain showers', 81: 'Moderate rain showers',
    82: 'Violent rain showers', 85: 'Slight snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
  };
  return descriptions[wmo] || 'Unknown';
}


/* ═══════════════════════════════════════════════
   4. WEATHER API INTEGRATION (Open-Meteo)
   ───────────────────────────────────────────────
   Free API, no key required. Returns current
   conditions via WMO weather codes.
   https://open-meteo.com/en/docs
   ═══════════════════════════════════════════════ */

/**
 * Fetches current weather from Open-Meteo and renders
 * it into the #weather-content container.
 * Falls back to simulated "mauzy" data on failure.
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

  try {
    // Open-Meteo: request current weather with the fields we need
    const params = new URLSearchParams({
      latitude: CONFIG.LAT,
      longitude: CONFIG.LON,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
      wind_speed_unit: 'kmh',
      timezone: 'America/St_Johns',
    });

    const res = await fetch(`${CONFIG.WEATHER_URL}?${params}`);

    if (!res.ok) {
      throw new Error(`Open-Meteo returned status ${res.status}`);
    }

    const data = await res.json();
    renderWeatherLive(container, data);
  } catch (err) {
    console.warn('[RDF] Weather fetch failed:', err.message);
    renderWeatherFallback(container);
  }
}

/**
 * Renders live weather from Open-Meteo response.
 * Open-Meteo response shape:
 *   data.current.temperature_2m
 *   data.current.apparent_temperature
 *   data.current.relative_humidity_2m
 *   data.current.weather_code (WMO)
 *   data.current.wind_speed_10m
 */
function renderWeatherLive(container, data) {
  const current   = data.current;
  const temp      = Math.round(current.temperature_2m);
  const feelsLike = Math.round(current.apparent_temperature);
  const wmo       = current.weather_code;
  const humidity  = current.relative_humidity_2m;
  const wind      = Math.round(current.wind_speed_10m);
  const desc      = getWmoDescription(wmo);
  const emoji     = getWeatherEmoji(wmo);
  const slang     = getWeatherSlang(wmo, temp);

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
 * Renders simulated "mauzy" weather when API fails.
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
   5b. LOCAL LINGO — Newfoundland Slang Teacher
   ───────────────────────────────────────────────
   Teaches tourists (CFAs) authentic NL slang.
   25 entries with word, meaning, and example.
   Randomly cycles on load and on button click.
   ═══════════════════════════════════════════════ */

const nlSlangList = [
  {
    word: "CFA",
    meaning: "Come From Away — anyone not born in Newfoundland.",
    example: "\"Don't mind him, he's a CFA. Only moved here last year.\""
  },
  {
    word: "Mauzy",
    meaning: "Damp, foggy, misty weather that clings to your skin.",
    example: "\"'Tis right mauzy out — yer clothes'll be damp before ya reach the car.\""
  },
  {
    word: "Best Kind",
    meaning: "Everything is great. The highest compliment.",
    example: "\"How's she going?\" \"Best kind, b'y. Best kind.\""
  },
  {
    word: "Rotted",
    meaning: "Extremely annoyed, upset, or furious.",
    example: "\"She was right rotted when they cancelled the flight.\""
  },
  {
    word: "B'y",
    meaning: "Universal term of address. Boy, girl, friend, stranger — anyone.",
    example: "\"Yes b'y!\" / \"Stay where you're to 'til I comes where you're at, b'y.\""
  },
  {
    word: "Streel",
    meaning: "A messy, untidy person — clothes all over the place.",
    example: "\"Look at the state of ya, ya proper streel.\""
  },
  {
    word: "Who Knit Ya?",
    meaning: "Who raised you? Said when someone does something foolish.",
    example: "\"You wore sneakers in a snowstorm? Who knit ya?\""
  },
  {
    word: "Stogged",
    meaning: "Completely stuffed full — usually from eating too much.",
    example: "\"I'm stogged to the gills after that Jiggs dinner.\""
  },
  {
    word: "Sin",
    meaning: "A shame, or something that evokes pity.",
    example: "\"The cat was out all night in the rain. What a sin.\""
  },
  {
    word: "Luh!",
    meaning: "Look! An exclamation to get someone's attention.",
    example: "\"Luh! There's a moose on the highway again!\""
  },
  {
    word: "Get On the Go",
    meaning: "To get going, head out, start doing something.",
    example: "\"Come on, get on the go — the pub won't wait forever.\""
  },
  {
    word: "Screeched In",
    meaning: "The honorary Newfoundlander ceremony — involves rum, cod, and an oath.",
    example: "\"Are ye a Newfoundlander?\" \"I got screeched in on George Street last night.\""
  },
  {
    word: "Long May Your Big Jib Draw",
    meaning: "A toast wishing you good fortune. Refers to a sailing ship's jib sail catching wind.",
    example: "\"Long may your big jib draw, me son!\" *clinks glass*"
  },
  {
    word: "Pea Soup",
    meaning: "Extremely thick fog — so dense you can barely see.",
    example: "\"Can't drive tonight, it's pea soup from here to Bay Bulls.\""
  },
  {
    word: "Jiggs Dinner",
    meaning: "Traditional Sunday boiled dinner — salt beef, cabbage, pease pudding, root vegetables, and figgy duff.",
    example: "\"Come over Sunday — nan's doing a Jiggs dinner.\""
  },
  {
    word: "Arse Over Kettle",
    meaning: "To fall head over heels, take a bad tumble.",
    example: "\"Hit a patch of ice and went arse over kettle on Water Street.\""
  },
  {
    word: "Stay Where You're To",
    meaning: "Stay right where you are — I'm coming to you.",
    example: "\"Stay where you're to 'til I comes where you're at.\""
  },
  {
    word: "On the Go",
    meaning: "Happening right now. In progress.",
    example: "\"What's on the go tonight?\" \"Kitchen party at Jim's.\""
  },
  {
    word: "Deadly",
    meaning: "Awesome, amazing, excellent.",
    example: "\"That fish and chips was deadly, b'y.\""
  },
  {
    word: "Not Fit",
    meaning: "The weather is terrible — not suitable for going outside.",
    example: "\"Don't bother. It's not fit out — blowin' a gale.\""
  },
  {
    word: "Gutfounded",
    meaning: "Starving, extremely hungry.",
    example: "\"I'm gutfounded — haven't had a bite since breakfast.\""
  },
  {
    word: "Ducky",
    meaning: "Term of endearment. Can be used for anyone.",
    example: "\"How are ya, me ducky?\" said every nan in Newfoundland."
  },
  {
    word: "Figgy Duff",
    meaning: "A traditional Newfoundland boiled pudding with raisins. Served with Jiggs dinner.",
    example: "\"Save room for the figgy duff — she's after making a big pot.\""
  },
  {
    word: "Lard Tunderin'",
    meaning: "An exclamation of surprise or frustration. The NL version of \"oh my god.\"",
    example: "\"Lard tunderin' Jesus, b'y — did ya see the size of that wave?\""
  },
  {
    word: "Screech",
    meaning: "Cheap, dark Jamaican rum that's become Newfoundland's unofficial spirit.",
    example: "\"Two glasses of screech and he was singin' shanties on the table.\""
  },
  {
    word: "Whaddya At?",
    meaning: "What are you doing? The universal Newfoundland greeting and conversation starter.",
    example: "\"Whaddya at tonight, b'y?\" \"Nuttin' — come over for a beer.\""
  },
  {
    word: "Whaddya Too?",
    meaning: "What are you up to? Variation of 'Whaddya At' — slightly more pointed, like asking someone's plan.",
    example: "\"Whaddya too this weekend?\" \"Heading out the bay if the weather's best kind.\""
  },
];

/**
 * Picks a random slang entry and injects it into
 * the #slang-word, #slang-meaning, and #slang-example
 * elements inside the Local Lingo card.
 */
function displayRandomSlang() {
  const wordEl    = document.getElementById('slang-word');
  const meaningEl = document.getElementById('slang-meaning');
  const exampleEl = document.getElementById('slang-example');
  if (!wordEl || !meaningEl || !exampleEl) return;

  // Pick a random entry
  const entry = nlSlangList[Math.floor(Math.random() * nlSlangList.length)];

  // Fade out, swap content, fade back in
  const card = wordEl.closest('.slang-card');
  if (card) {
    card.classList.add('slang-swap');
    setTimeout(() => {
      wordEl.textContent    = entry.word;
      meaningEl.textContent = entry.meaning;
      exampleEl.textContent = entry.example;
      card.classList.remove('slang-swap');
    }, 150);
  } else {
    wordEl.textContent    = entry.word;
    meaningEl.textContent = entry.meaning;
    exampleEl.textContent = entry.example;
  }
}

/**
 * Wires up the "Learn Another" button and fires the
 * first random slang on load.
 */
function initSlang() {
  // Display first word immediately
  displayRandomSlang();

  // "Learn Another" button
  const btn = document.getElementById('btn-next-slang');
  if (btn) {
    btn.addEventListener('click', displayRandomSlang);
  }
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

/* ═══════════════════════════════════════════════
   10. THE FAIRY HUNT — Mystery Crawl GPS Engine
   ───────────────────────────────────────────────
   Phase 3: Gamified GPS tracker. User generates a
   random mystery location, follows a folklore clue,
   and catches a fairy when within 75m.
   
   Uses Haversine formula + navigator.geolocation.
   ═══════════════════════════════════════════════ */

/**
 * Fairy location database — real St. John's businesses.
 * Each has coords, a cryptic folklore clue, and a reward.
 */
const fairyLocations = [
  {
    name: "Bannerman Brewing",
    lat: 47.5675,
    lng: -52.7072,
    clue: "Where the water meets the grain and the barrels dream of old ships, a fairy hides among the taps. Look for warmth on Waterfront Drive.",
    reward: "🍺 10% off a pint — tell 'em the fairy sent ya."
  },
  {
    name: "The Duke of Duckworth",
    lat: 47.5694,
    lng: -52.6984,
    clue: "On the oldest street where the duke once drank, she waits behind a wooden door. Follow the smell of fish and chips and the sound of trad fiddles.",
    reward: "🍟 Free side of fries with any entrée."
  },
  {
    name: "The Rooms",
    lat: 47.5720,
    lng: -52.7100,
    clue: "High on the hill where the past is kept in glass and stone, a fairy perches above the harbour. Three rooms, one roof, and a secret in the archives.",
    reward: "🎟️ Buy one admission, get one free."
  },
];

// ── Active hunt state ──
let activeHunt = null;   // Current fairy location object
let geoWatchId = null;   // Geolocation watch ID for cleanup

/**
 * Haversine formula — calculates the great-circle distance
 * between two lat/lng points in meters.
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Randomly selects a fairy location, hides the name,
 * and displays the cryptic clue in the UI.
 */
function generateMysteryCrawl() {
  // Clean up any previous hunt
  stopTracking();

  // Pick a random fairy location
  activeHunt = fairyLocations[Math.floor(Math.random() * fairyLocations.length)];

  // DOM references
  const clueEl     = document.getElementById('hunt-clue');
  const distEl     = document.getElementById('hunt-distance');
  const revealEl   = document.getElementById('hunt-location-reveal');
  const rewardEl   = document.getElementById('hunt-reward');
  const errorEl    = document.getElementById('hunt-error');
  const catchBtn   = document.getElementById('btn-catch-fairy');
  const genBtn     = document.getElementById('btn-generate-crawl');
  const card       = document.getElementById('fairy-hunt-card');

  if (!clueEl) return;

  // Reset UI to hunt state
  card.classList.remove('card-hearth');
  card.classList.add('card-hunt');
  revealEl.style.display  = 'none';
  rewardEl.style.display  = 'none';
  catchBtn.style.display  = 'none';
  errorEl.style.display   = 'none';
  distEl.className        = 'hunt-distance';
  genBtn.textContent      = 'New Mystery';

  // Show the clue
  clueEl.textContent = `"${activeHunt.clue}"`;
  distEl.textContent = 'Summoning the fairies... acquiring your location.';

  // Start GPS tracking
  startTracking();
}

/**
 * Starts the GPS watcher. Updates distance in real-time.
 * Handles permission denial with NL slang error.
 */
function startTracking() {
  const distEl  = document.getElementById('hunt-distance');
  const errorEl = document.getElementById('hunt-error');

  // Check for geolocation support
  if (!('geolocation' in navigator)) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.textContent = "Luh, b'y — yer browser don't support GPS. Try a different one.";
    }
    return;
  }

  geoWatchId = navigator.geolocation.watchPosition(
    // ── SUCCESS: Got a position ──
    (position) => {
      if (!activeHunt) return;

      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      const dist    = calculateDistance(userLat, userLng, activeHunt.lat, activeHunt.lng);
      const catchBtn = document.getElementById('btn-catch-fairy');

      // Update distance readout
      if (distEl) {
        if (dist > 1000) {
          distEl.textContent = `📍 ~${(dist / 1000).toFixed(1)} km away — keep going, b'y.`;
          distEl.className = 'hunt-distance';
        } else if (dist > 200) {
          distEl.textContent = `📍 ${Math.round(dist)}m away — you're getting warmer.`;
          distEl.className = 'hunt-distance';
        } else if (dist > 75) {
          distEl.textContent = `📍 ${Math.round(dist)}m away — she's close! The fairy can feel ya.`;
          distEl.className = 'hunt-distance close';
        } else {
          distEl.textContent = `📍 ${Math.round(dist)}m — YOU'RE HERE! Catch her!`;
          distEl.className = 'hunt-distance very-close';

          // Show the catch button
          if (catchBtn) catchBtn.style.display = 'inline-flex';
        }
      }

      // Hide catch button if user drifts away
      if (dist > 75 && catchBtn) {
        catchBtn.style.display = 'none';
      }
    },

    // ── ERROR: GPS denied or failed ──
    (error) => {
      if (errorEl) {
        errorEl.style.display = 'block';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorEl.textContent = "The arse is gone out of 'er! We need your location to find the fairies. Enable GPS in your browser settings, b'y.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorEl.textContent = "Can't get a fix — must be the pea soup fog jammin' the signal. Try again in a minute.";
            break;
          case error.TIMEOUT:
            errorEl.textContent = "Took too long to find ya. The fairies are impatient — give it another go.";
            break;
          default:
            errorEl.textContent = "Something's gone crooked with the GPS, b'y. Try again.";
        }
      }
      console.warn('[RDF] Geolocation error:', error.message);
    },

    // ── OPTIONS ──
    {
      enableHighAccuracy: true,
      maximumAge: 15000,   // Accept positions up to 15s old
      timeout: 20000,      // Wait up to 20s for a fix
    }
  );
}

/**
 * Stops the GPS watcher to conserve battery.
 */
function stopTracking() {
  if (geoWatchId !== null) {
    navigator.geolocation.clearWatch(geoWatchId);
    geoWatchId = null;
  }
}

/**
 * WIN STATE — Triggered when user taps "Catch Fairy"
 * within 75m of the target. Reveals the location,
 * shows the reward, and transitions the card to
 * the warm Hearth theme.
 */
function catchFairy() {
  if (!activeHunt) return;

  // Stop tracking — hunt is over
  stopTracking();

  // DOM references
  const card      = document.getElementById('fairy-hunt-card');
  const clueEl    = document.getElementById('hunt-clue');
  const distEl    = document.getElementById('hunt-distance');
  const revealEl  = document.getElementById('hunt-location-reveal');
  const rewardEl  = document.getElementById('hunt-reward');
  const catchBtn  = document.getElementById('btn-catch-fairy');
  const genBtn    = document.getElementById('btn-generate-crawl');

  // ── Transition to Hearth theme ──
  if (card) {
    card.classList.remove('card-hunt');
    card.classList.add('card-hearth');
  }

  // Reveal the location name
  if (revealEl) {
    revealEl.textContent = `🧚 ${activeHunt.name}`;
    revealEl.style.display = 'block';
  }

  // Show the reward
  if (rewardEl) {
    rewardEl.textContent = activeHunt.reward;
    rewardEl.style.display = 'block';
  }

  // Update clue text to victory message
  if (clueEl) {
    clueEl.textContent = "You found her! The fairy's been caught. Show this screen to claim your deal.";
  }

  // Update distance text
  if (distEl) {
    distEl.textContent = '✨ Fairy Charm collected!';
    distEl.className = 'hunt-distance';
  }

  // Hide catch button, show "New Mystery" for next round
  if (catchBtn) catchBtn.style.display = 'none';
  if (genBtn) genBtn.textContent = 'Hunt Another Fairy';

  // Clear active hunt
  activeHunt = null;

  // Fire a celebratory notification if permission granted
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('🧚 Fairy Caught!', {
      body: `You found her at ${revealEl.textContent.replace('🧚 ', '')}! Show your phone to claim: ${rewardEl.textContent}`,
      tag: 'rdf-fairy-catch',
    });
  }
}

/**
 * Initializes the Fairy Hunt: wires Generate and
 * Catch buttons.
 */
function initFairyHunt() {
  const genBtn   = document.getElementById('btn-generate-crawl');
  const catchBtn = document.getElementById('btn-catch-fairy');

  if (genBtn) {
    genBtn.addEventListener('click', generateMysteryCrawl);
  }
  if (catchBtn) {
    catchBtn.addEventListener('click', catchFairy);
  }
}

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

  // Boot Local Lingo slang card
  initSlang();

  // Boot Fairy Hunt (Mystery Crawl GPS)
  initFairyHunt();

  // Boot service worker
  registerServiceWorker();

  // Auto-refresh weather
  setInterval(fetchWeather, CONFIG.WEATHER_REFRESH);

  console.log('[RDF] 🧚 Fairy-Led Passport initialized. Stay dry, b\'y.');
});
