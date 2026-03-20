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
  {
    id: 9,
    name: "Boreal Café",
    category: "Café",
    description: "A bright, modern coffee bar on Water Street serving single-origin pour-overs and seasonal lattes. Clean lines, warm wood, and the kind of flat white that makes you forget it's lashing outside.",
    tags: ["Café", "Cozy Spots"],
  },
  {
    id: 10,
    name: "Birdie",
    category: "Café",
    description: "Airy specialty coffee spot on Water Street with a focus on quality roasts and simple, beautiful food. The pastry case alone is worth the walk downtown in the rain.",
    tags: ["Café", "Cozy Spots"],
  },
  {
    id: 11,
    name: "Rocket Bakery",
    category: "Café & Bakery",
    description: "A cultural hub of downtown St. John's and arguably where the local specialty coffee scene began. French-inspired baked goods, scratch soups, and legendary fish cakes. Eclectic, busy, and best kind.",
    tags: ["Café", "Family Friendly"],
  },
  {
    id: 12,
    name: "Jumping Bean",
    category: "Café",
    description: "Newfoundland's own coffee roaster with multiple locations. The Water Street spot has solid Wi-Fi, comfy seats, and locally roasted beans. A reliable go-to when you need caffeine and a dry chair.",
    tags: ["Café", "Family Friendly"],
  },
  {
    id: 13,
    name: "Terre Café",
    category: "Café & Restaurant",
    description: "A harbour-view café on Water Street serving food inspired by the local landscape and sea. Traditional cooking methods, modern plating, and coffee worth lingering over while watching the fog roll in.",
    tags: ["Café", "Cozy Spots"],
  },
  {
    id: 14,
    name: "Estée Café",
    category: "Café",
    description: "A stylish little café on Water Street with carefully crafted espresso drinks and light bites. Minimalist vibes with maximum flavour — the kind of spot that punches well above its square footage.",
    tags: ["Café", "Cozy Spots"],
  },
  {
    id: 15,
    name: "Cookie Shop Café",
    category: "Café & Bakery",
    description: "Exactly what it sounds like — a café on Water Street built around freshly baked cookies. Grab a warm one with a coffee and try to eat just one. You won't. Nobody does.",
    tags: ["Café", "Family Friendly"],
  },
  {
    id: 16,
    name: "Postmaster's Bakery",
    category: "Café & Bakery",
    description: "Started as a micro-bakery in the back of a B&B, now a proper bakery and café at Rawlin's Cross on Military Road. Sourdough, pastries, and excellent coffee in a space that feels like a well-kept secret.",
    tags: ["Café", "Cozy Spots"],
  },
  {
    id: 17,
    name: "Parlour",
    category: "Café & Ice Cream",
    description: "A charming café and ice cream parlour on Military Road. Great coffee, house-made ice cream, and a warm atmosphere that'll take the chill off any mauzy afternoon.",
    tags: ["Café", "Family Friendly"],
  },
  {
    id: 18,
    name: "Toslow",
    category: "Café & Restaurant",
    description: "A sleek, modern café on Duckworth Street with a farm-to-table ethos. Seasonal menus, excellent brunch, and specialty coffee in a space that feels effortlessly cool. Often packed — a good sign.",
    tags: ["Café", "Cozy Spots"],
  },
  {
    id: 19,
    name: "Theatre Hill",
    category: "Café & Bar",
    description: "A café by day, bar and performance space by night — all under one roof on Duckworth Street. Grab a coffee, settle into a corner, and you might catch a live set by evening. A proper St. John's gem.",
    tags: ["Café", "Pubs & Breweries", "Entertainment"],
  },
  {
    id: 20,
    name: "Memorial Café",
    category: "Café",
    description: "A cozy neighbourhood café on Duckworth Street serving solid coffee and comfort food. Unpretentious, friendly, and the kind of place where regulars know the staff by name.",
    tags: ["Café", "Cozy Spots"],
  },
  {
    id: 21,
    name: "Coffee Matters",
    category: "Café",
    description: "Italian-inspired coffee house with multiple locations around St. John's. Known for proper espresso, homemade soups, fresh sandwiches, and gluten-free options. The Military Road spot is a local favourite.",
    tags: ["Café", "Family Friendly"],
  },
  {
    id: 22,
    name: "Homage",
    category: "Café",
    description: "A neighbourhood café tucked away on Dennisoff Street. Thoughtful coffee, a small rotating menu, and a calm atmosphere that feels miles away from the downtown bustle.",
    tags: ["Café", "Cozy Spots"],
  },
  {
    id: 23,
    name: "Denissoff Coffee",
    category: "Café",
    description: "A specialty coffee shop on Cookstown Road with a focus on quality beans and precise brewing. A bit off the beaten path, which keeps it quiet — perfect for a mauzy morning escape.",
    tags: ["Café", "Cozy Spots"],
  },
  {
    id: 24,
    name: "Cape Coffee",
    category: "Café",
    description: "A neighbourhood coffee spot serving well-crafted drinks and baked goods. Friendly staff, good vibes, and the kind of place that makes you feel like a local even if you're a CFA.",
    tags: ["Café", "Cozy Spots"],
  },
  {
    id: 25,
    name: "Casablanca Bakery & Café",
    category: "Café & Bakery",
    description: "A beloved St. John's bakery and café known for handmade pastries, custom cakes, and hearty lunches. The baked goods are worth the trip alone — bring an extra bag.",
    tags: ["Café", "Family Friendly"],
  },
  {
    id: 26,
    name: "The Rooms Café",
    category: "Café",
    description: "Perched inside The Rooms with arguably the best harbour view of any café in the city. Scrumptious soups, salads, and chef's specials. Come for the exhibits, stay for the view and the coffee.",
    tags: ["Café", "Family Friendly", "Dry Parking"],
  },
  {
    id: 27,
    name: "Bellissimo Bistro",
    category: "Café & Bistro",
    description: "An Italian-inspired bistro and café serving espresso, paninis, and house-made desserts. A warm, welcoming spot that feels like a little slice of the Mediterranean dropped into Newfoundland.",
    tags: ["Café", "Family Friendly"],
  },
  {
    id: 28,
    name: "Classic Café East",
    category: "Café",
    description: "A no-fuss café on the east end serving solid coffee, all-day breakfast, and comfort food. The kind of place your nan would approve of — hearty portions and friendly faces.",
    tags: ["Café", "Family Friendly"],
  },
  {
    id: 29,
    name: "Bagel Café",
    category: "Café & Restaurant",
    description: "A Duckworth Street institution with an all-day breakfast menu the size of a novel. Famous for toutons, bagel sandwiches, and stained-glass charm. Get there early or expect a wait — it's worth it.",
    tags: ["Café", "Family Friendly"],
  },
  {
    id: 30,
    name: "Market Family Café",
    category: "Café",
    description: "A family-friendly café built around wholesome food and a welcoming atmosphere. Great for parents with little ones on a rainy day — the menu has something for every age and every appetite.",
    tags: ["Café", "Family Friendly"],
  },
  {
    id: 31,
    name: "Hungry Heart Café",
    category: "Café & Restaurant",
    description: "An award-winning social enterprise café on Military Road run by Stella's Circle. Full-service restaurant with nutritious, delicious meals and a mission to do good. Great food with a greater purpose.",
    tags: ["Café", "Family Friendly"],
  },
  {
    id: 32,
    name: "Fixed Coffee & Baking",
    category: "Café",
    description: "A local favourite since 2012, this bustling corner café by Harbourside Park serves premium coffee brewed six cups at a time or by pour-over. Eclectic furnishings, bright interior, and serious substance.",
    tags: ["Café", "Cozy Spots"],
  },
  {
    id: 33,
    name: "Newfoundland Chocolate Café",
    category: "Café & Chocolate Shop",
    description: "Chocolates as unique as the province, world-class gelato, and rich hot cocoa. Multiple locations around St. John's. A sweet escape when the weather's not fit — and honestly, even when it is.",
    tags: ["Café", "Family Friendly"],
  },
  {
    id: 34,
    name: "The Pantry",
    category: "Café & Garden",
    description: "A full-service café and restaurant by the Autism Society of NL. Explore the gardens and enjoy a daily menu featuring fresh produce grown right on-site. Wholesome food, meaningful work.",
    tags: ["Café", "Family Friendly"],
  },
  // ── PUBS, BARS & BREWERIES ──────────────────
  {
    id: 35,
    name: "The Duke of Duckworth",
    category: "Pub & Kitchen",
    description: "A Duckworth Street institution since the '90s. Cozy basement pub with the best fish & chips in town — get 'em Newfoundland-style with dressing and gravy. Premier League on the screens, cold beer on tap, and strangers become friends.",
    tags: ["Pubs & Breweries", "Groups"],
  },
  {
    id: 36,
    name: "The Ship Pub",
    category: "Pub & Live Music",
    description: "The beating heart of the St. John's arts scene, tucked down an alley off Duckworth. Wednesday folk night has been running since 1976. Proper pub grub, eclectic crowd, and live music Wed through Sat. If you only hit one pub, make it this one.",
    tags: ["Pubs & Breweries", "Entertainment"],
  },
  {
    id: 37,
    name: "The Merchant Tavern",
    category: "Restaurant & Bar",
    description: "Upscale dining in a stunning industrial-meets-rustic space on Water Street. Locally sourced seasonal menus — the cod is legendary. Not a cheap night out, but worth every penny for a special occasion or a proper feed.",
    tags: ["Pubs & Breweries", "Cozy Spots"],
  },
  {
    id: 38,
    name: "O'Reilly's Irish Newfoundland Pub",
    category: "Pub & Live Music",
    description: "A two-floor George Street institution where Irish and Newfoundland culture collide. Live music every night, open mic on Tuesdays, and Screech-Ins for $15. The mussels are unreal and the craic is mighty.",
    tags: ["Pubs & Breweries", "Entertainment", "Groups"],
  },
  {
    id: 39,
    name: "The Adelaide Oyster House",
    category: "Bar & Seafood",
    description: "A vibrant Water Street spot where craft cocktails meet fresh oysters from four provinces. Asian-fusion small plates, local craft beer, and an atmosphere that shifts from chill afternoon to buzzing nightlife.",
    tags: ["Pubs & Breweries", "Cozy Spots"],
  },
  {
    id: 40,
    name: "Quidi Vidi Brewery",
    category: "Brewery & Taproom",
    description: "Perched in the picturesque fishing village of Quidi Vidi, this is where they brew the famous Iceberg Beer from 10,000-year-old iceberg water. Tours, a heated patio, live music, and proper pub eats. A must-visit even in pea soup fog.",
    tags: ["Pubs & Breweries", "Culture"],
  },
  {
    id: 41,
    name: "Shamrock City Pub",
    category: "Pub & Live Music",
    description: "A massive Water Street pub with a large outdoor patio, daily live trad music, and proper Irish hospitality. Try the moose burger if you're feeling adventurous. Gets lively after 6 PM — the music doesn't stop 'til late.",
    tags: ["Pubs & Breweries", "Entertainment", "Groups"],
  },
  {
    id: 42,
    name: "Green Sleeves",
    category: "Pub & Nightclub",
    description: "A George Street classic with two clubs inside — folk music on Sundays, DJs on weekends, and pub fare all week. The Loose Tie cocktail bar upstairs is the best-kept secret on the street. An older, friendlier crowd than most.",
    tags: ["Pubs & Breweries", "Entertainment"],
  },
  {
    id: 43,
    name: "The Black Sheep",
    category: "Pub & Live Music",
    description: "A musician's bar on George Street — no VLTs, no TVs, just quality live music in a converted garage. Rockabilly to jazz, local talent that rivals anyone. Intimate, unpretentious, and the perfect antidote to a rowdy George Street night.",
    tags: ["Pubs & Breweries", "Entertainment"],
  },
  {
    id: 44,
    name: "Rob Roy",
    category: "Pub & Dance Bar",
    description: "The most popular dance floor on George Street. Live bands, accordion and fiddle sets on weekends, and legendary drink specials. It's loud, it's packed, and it's exactly the kind of night out St. John's does best.",
    tags: ["Pubs & Breweries", "Entertainment", "Groups"],
  },
  {
    id: 45,
    name: "YellowBelly Brewery",
    category: "Brewery & Restaurant",
    description: "A historic brewpub on Water Street that's been anchoring the craft beer scene since 2008. House-brewed ales, wood-fired pizzas, and a beautiful old building with traces of its fire-scarred past. Two happy hours daily.",
    tags: ["Pubs & Breweries", "Groups"],
  },
  {
    id: 46,
    name: "Trapper John's",
    category: "Pub & Screech-In",
    description: "A legendary George Street dive bar and the original Screech-In spot. Kiss a cod, down some rum, and become an honorary Newfoundlander. Rough around the edges and proud of it — this is the real deal, not the tourist-polished version.",
    tags: ["Pubs & Breweries", "Entertainment"],
  },
  {
    id: 47,
    name: "Christian's Pub",
    category: "Pub",
    description: "A cozy George Street pub with live music and traditional Screech-In ceremonies. Friendly staff, cold beer, and the kind of unpretentious atmosphere where you can actually have a conversation between sets.",
    tags: ["Pubs & Breweries", "Cozy Spots"],
  },
  {
    id: 48,
    name: "Ches's Famous Fish & Chips",
    category: "Restaurant & Pub",
    description: "A Newfoundland legend since 1951. Fresh cod straight off the boat, hand-cut fries, and the chips-dressing-and-gravy combo you didn't know you needed. Old-school diner vibes. Seven locations across NL — the Freshwater Road original is the one.",
    tags: ["Pubs & Breweries", "Family Friendly"],
  },
  {
    id: 49,
    name: "Mallard Cottage",
    category: "Restaurant & Bar",
    description: "A rustic gem in the fishing village of Quidi Vidi, housed in one of the oldest wooden buildings in St. John's. The daily-rotating menu is locally sourced and seasonal — halibut cheeks, molasses-glazed pork belly, and whatever the boat brought in. Live local music some evenings. Worth the drive.",
    tags: ["Pubs & Breweries", "Cozy Spots"],
  },
  {
    id: 50,
    name: "Bridie Molloy's",
    category: "Pub & Kitchen",
    description: "A cozy George Street Irish pub with braised lamb shepherd's pie, moose tacos with blueberry pickles, and the famous jiggs dinner pie that tastes like nan made it. Live music, cold drafts, and proper hospitality.",
    tags: ["Pubs & Breweries", "Entertainment"],
  },
  {
    id: 51,
    name: "The Celtic Hearth",
    category: "Pub & Restaurant",
    description: "An Irish-Newfoundland pub on Water Street serving hearty brunch, seafood, and pub classics. Great for families — the fish & chips and sexy nachos are both winners. Draft Newfoundland beer and a warm, inviting atmosphere.",
    tags: ["Pubs & Breweries", "Family Friendly"],
  },
  {
    id: 52,
    name: "Bitters Pub & Restaurant",
    category: "Pub",
    description: "The MUN campus pub, open to everyone. Solid fish & chips, reasonable prices, free pool, and trivia nights run by hilarious hosts. A neighbourhood pub feel in the heart of the university — great beer selection and no pretence.",
    tags: ["Pubs & Breweries", "Groups"],
  },
  {
    id: 53,
    name: "Waterwest Kitchen & Meats",
    category: "Restaurant & Bar",
    description: "A butcher-driven restaurant, bar, deli, and bakery on the west end of Water Street. From the team behind Mallard Cottage — fresh pastas, charcuterie, and a community atmosphere that feels like a neighbourhood market with a liquor licence.",
    tags: ["Pubs & Breweries", "Cozy Spots"],
  },
  {
    id: 54,
    name: "St. John's Fish Exchange",
    category: "Restaurant & Bar",
    description: "A seafood-focused kitchen and wet bar on Water Street — think raw bar, craft cocktails, and the freshest catch in town. The scallop crudo is a standout. A newer addition to the downtown scene and already a local favourite.",
    tags: ["Pubs & Breweries", "Cozy Spots"],
  },
  {
    id: 55,
    name: "Chinched Bistro",
    category: "Bistro & Bar",
    description: "A beloved downtown bistro with a loyal following. Creative small plates, local ingredients, and a cozy room that fills up fast. The kind of place where the chef actually cares and you can taste it in every dish. Book ahead.",
    tags: ["Pubs & Breweries", "Cozy Spots"],
  },
  // ── INDOOR ACTIVITIES & RAINY DAY SPOTS ─────
  {
    id: 56,
    name: "Get Air Trampoline Park",
    category: "Trampoline Park",
    description: "Wall-to-wall trampolines, foam pits, dodgeball courts, and ninja obstacles. Club Air nights on Fridays and Saturdays add lights and music. Toddler hours on Tuesdays and Thursdays. Best way to burn off energy when it's bucketing down.",
    tags: ["Entertainment", "Family Friendly"],
  },
  {
    id: 57,
    name: "Frontline Action",
    category: "Laser Tag & Paintball",
    description: "Indoor laser tag, Nerf wars, paintball, airsoft, and iCombat — all under one roof. Special weekly events keep it fresh. Perfect for groups, birthday parties, or just pretending you're in an action movie while it's lashing outside.",
    tags: ["Entertainment", "Groups"],
  },
  {
    id: 58,
    name: "Wallnuts Climbing Centre",
    category: "Indoor Climbing",
    description: "A well-equipped indoor climbing and bouldering facility open year-round. Routes for all levels, youth programs, and drop-in sessions. Competitions like Bloc On The Rock draw climbers from across the island. Great workout, rain or shine.",
    tags: ["Entertainment", "Groups"],
  },
  {
    id: 59,
    name: "The Cove Bouldering & Café",
    category: "Indoor Climbing & Café",
    description: "A bouldering gym with a built-in café — climb a wall, then grab a coffee. Welcoming community vibe with problems for beginners through to seasoned crushers. A uniquely St. John's way to spend a mauzy afternoon.",
    tags: ["Entertainment", "Café", "Groups"],
  },
  {
    id: 60,
    name: "The Fluvarium",
    category: "Nature Centre",
    description: "Explore the life of a river from the inside — underwater viewing windows show brown trout in their natural habitat, plus aquariums with local species. In the heart of Pippy Park. Educational, weird, and completely unlike anything else in the city.",
    tags: ["Culture", "Family Friendly"],
  },
  {
    id: 61,
    name: "Mad Catter Café",
    category: "Cat Café",
    description: "Newfoundland's first cat café and lounge. Grab a coffee, a freshly baked snack, and spend time with adoptable rescue cats. Therapeutic, adorable, and the perfect antidote to a grey RDF day. You will not want to leave.",
    tags: ["Café", "Family Friendly", "Cozy Spots"],
  },
  {
    id: 62,
    name: "Mochanopoly",
    category: "Board Game Café",
    description: "St. John's premier board game café on Water Street. Hundreds of games to choose from, warm drinks, and a friendly atmosphere. Grab a group, pick a game, and lose track of time while the fog does its thing outside.",
    tags: ["Entertainment", "Café", "Groups"],
  },
  {
    id: 63,
    name: "Holiday Lanes",
    category: "Bowling Alley",
    description: "A fully licensed 12-lane, 5-pin bowling alley with automatic scoring. Well-maintained lanes, clean rental shoes, and a solid snack bar. Old-school fun that never gets old — especially on a not-fit evening.",
    tags: ["Entertainment", "Family Friendly", "Groups"],
  },
  {
    id: 64,
    name: "Breakout NL",
    category: "Escape Rooms",
    description: "Newfoundland's first escape game provider with four themed rooms. Challenge your crew's problem-solving, logic, and teamwork under pressure. A different flavour from Escape Quest — do both if you're competitive enough.",
    tags: ["Entertainment", "Groups"],
  },
  {
    id: 65,
    name: "Spirit of Newfoundland",
    category: "Dinner Theatre",
    description: "Live dinner theatre productions that celebrate NL culture, music, and humour. Tribute shows, original productions, and a proper meal included. An evening of laughs, tunes, and storytelling — the most Newfoundland night out you can have indoors.",
    tags: ["Entertainment", "Culture", "Groups"],
  },
  {
    id: 66,
    name: "Railway Coastal Museum",
    category: "Museum",
    description: "Housed in the beautifully restored 1903 railway station on Water Street. Exhibits on the history of Newfoundland's railway and coastal travel — real train cars to climb aboard. A hidden gem that most tourists walk right past.",
    tags: ["Culture", "Family Friendly"],
  },
  {
    id: 67,
    name: "Axtion",
    category: "Indoor Amusement",
    description: "Amusement rides, massive bouncy castles, indoor snow tubes, go-karts, rope courses, and a toddler area. Basically an indoor fairground. If you've got kids and it's raining, this is where you go. End of discussion.",
    tags: ["Entertainment", "Family Friendly"],
  },
  {
    id: 68,
    name: "Craft Council Shop & Gallery",
    category: "Gallery & Shop",
    description: "A curated gallery and shop showcasing the work of 150+ Newfoundland artisans. Ceramics, textiles, jewellery, prints — the best place to find a unique keepsake that isn't a moose magnet. Free to browse, dangerous for your wallet.",
    tags: ["Culture", "Cozy Spots"],
  },
  {
    id: 69,
    name: "Quidi Vidi Village Plantation",
    category: "Artisan Village",
    description: "A vibrant artisan hub in the historic fishing village of Quidi Vidi. Emerging craftspeople, historical interpretation, and a gorgeous setting. Browse studios, watch artists at work, and pick up something handmade. Free admission.",
    tags: ["Culture", "Family Friendly"],
  },
  {
    id: 70,
    name: "Wee Indoor Playground",
    category: "Indoor Playground",
    description: "Over 8,000 square feet of climbing structures, slides, and play zones for kids. One of the largest indoor playgrounds in St. John's. Parents can sit and breathe while the little ones go feral in a safe, padded environment.",
    tags: ["Family Friendly"],
  },
  {
    id: 71,
    name: "Landwash Brewery",
    category: "Brewery & Taproom",
    description: "A newer face on the craft beer scene, known for flavour-forward brews served in a beer-hall taproom. The Saucy Mouth food truck parked outside keeps the kitchen game strong. A proper alternative to the downtown brewery crawl.",
    tags: ["Pubs & Breweries"],
  },
  // ── BOOKSTORES & LIBRARIES ──────────────────
  {
    id: 72,
    name: "Breakwater Books",
    category: "Bookstore & Publisher",
    description: "Newfoundland's premier publisher since 1973, with a retail shop on Duckworth Street. Fiction, poetry, children's books, and NL non-fiction — all championing local voices. If you want to understand this place through its writing, start here.",
    tags: ["Bookstores & Libraries", "Culture"],
  },
  {
    id: 73,
    name: "Elaine's Books & Café",
    category: "Bookstore & Café",
    description: "A cozy Duckworth Street gem combining a curated bookshop with locally roasted coffee. New, used, and hard-to-find Newfoundland titles. Occasional readings and concerts. The kind of place where you come for one book and leave with five.",
    tags: ["Bookstores & Libraries", "Café", "Cozy Spots"],
  },
  {
    id: 74,
    name: "Second Page Bookstore & Poster Shop",
    category: "Bookstore",
    description: "An independent bookstore with a lovingly curated selection of fiction, non-fiction, and local literature, plus a poster shop for art lovers. A quiet downtown retreat that smells exactly the way a bookshop should.",
    tags: ["Bookstores & Libraries", "Cozy Spots"],
  },
  {
    id: 75,
    name: "Broken Books",
    category: "Bookstore",
    description: "An eclectic independent bookshop on Duckworth Street stocking quality books and magazines from some of the finest publishers around. Small, thoughtfully curated, and the kind of place book nerds dream about finding.",
    tags: ["Bookstores & Libraries", "Cozy Spots"],
  },
  {
    id: 76,
    name: "Downtown Comics",
    category: "Comic Book Store",
    description: "St. John's friendliest comic shop since 1997. New and back-issue comics, graphic novels, manga, trading cards, board games, collectible figures, and NL literature. A welcoming atmosphere whether you're into Spider-Man or local zines.",
    tags: ["Bookstores & Libraries", "Entertainment"],
  },
  {
    id: 77,
    name: "Granny Bates Children's Books",
    category: "Bookstore",
    description: "A dedicated children's bookshop — picture books, early readers, middle grade, and YA. Thoughtful recommendations, a warm atmosphere, and the best place in town to find a gift for a young reader. Every kid deserves a bookshop like this.",
    tags: ["Bookstores & Libraries", "Family Friendly"],
  },
  {
    id: 78,
    name: "The Travel Bug",
    category: "Bookstore & Travel Shop",
    description: "A niche bookshop specializing in travel guides, maps, globes, and travel accessories. If you're planning your next adventure — or just dreaming about one on a mauzy day — this is the spot.",
    tags: ["Bookstores & Libraries", "Cozy Spots"],
  },
  {
    id: 79,
    name: "Chapters St. John's",
    category: "Bookstore",
    description: "The big-box bookstore at Avalon Mall — massive selection across all genres, a Starbucks inside, and comfortable chairs to sink into. Grab a coffee, pick a shelf, and disappear for a few hours while the rain does its worst.",
    tags: ["Bookstores & Libraries", "Family Friendly", "Dry Parking"],
  },
  {
    id: 80,
    name: "Johnny Ruth",
    category: "Boutique & Bookshop",
    description: "A beautifully curated Water Street boutique carrying NL-made goods, local books, art prints, clothing, and gifts. Part bookshop, part design store, all Newfoundland. The best place to buy something you'll actually keep.",
    tags: ["Bookstores & Libraries", "Culture", "Cozy Spots"],
  },
  {
    id: 81,
    name: "A.C. Hunter Public Library",
    category: "Public Library",
    description: "St. John's main public library inside the Arts & Culture Centre on Allandale Road. Borrow books, board games, audio books, even musical instruments — all free. Separate adult and children's sections. A proper civic treasure on a rainy afternoon.",
    tags: ["Bookstores & Libraries", "Family Friendly"],
  },
  {
    id: 82,
    name: "Michael Donovan Public Library",
    category: "Public Library",
    description: "A branch library in the Waterford Valley Mall on Topsail Road. Book clubs, storytime for kids, free Wi-Fi, and a solid collection. Convenient if you're on the west end of town and need somewhere warm and quiet to land.",
    tags: ["Bookstores & Libraries", "Family Friendly", "Dry Parking"],
  },
  {
    id: 83,
    name: "Queen Elizabeth II Library (MUN)",
    category: "University Library",
    description: "Memorial University's main library on Prince Philip Drive. Open to the public for on-site reading — five floors of books, study space, and the Centre for Newfoundland Studies archive. The biggest library in the province, free to walk in.",
    tags: ["Bookstores & Libraries", "Culture"],
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

      // Render passport gallery when switching to that tab
      if (target === 'passport') renderPassport();
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
 * Fairy database — populated at runtime from Google Sheet CSV.
 * Columns: Name, Lat, Lng, Clue, Reward, ImageURL
 */
let fairyDatabase = [];

// ⚠️ PASTE YOUR PUBLISHED GOOGLE SHEET CSV URL HERE
// (Google Sheets → File → Share → Publish to Web → CSV)
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSiOoFFaCMgboUK_oSpPsexOTVMbBF-dGzZDmWdgZ_nZtOiya7cjafbgSGj2zfDs9IbgqSg7tmsYnjC/pub?gid=0&single=true&output=csv';

/**
 * Fetches the Google Sheet CSV and parses it into fairyDatabase.
 * Falls back to a small hardcoded set if the fetch fails.
 *
 * CSV Parser: Splits by newlines, then by commas.
 * Handles quoted fields containing commas (basic RFC 4180).
 */
async function initDatabase() {
  try {
    const res = await fetch(SHEET_URL);
    if (!res.ok) throw new Error(`Sheet returned ${res.status}`);

    const csvText = await res.text();
    fairyDatabase = parseCSV(csvText);

    console.log(`[RDF] 🧚 Fairy database loaded: ${fairyDatabase.length} locations.`);
  } catch (err) {
    console.warn('[RDF] CSV fetch failed, using fallback data:', err.message);

    // Fallback — 3 hardcoded locations so the app always works
    fairyDatabase = [
      {
        Name: "Bannerman Brewing",
        Lat: "47.5675", Lng: "-52.7072",
        Clue: "Where the water meets the grain and the barrels dream of old ships, a fairy hides among the taps. Look for warmth on Waterfront Drive.",
        Reward: "🍺 10% off a pint — tell 'em the fairy sent ya.",
        ImageURL: ""
      },
      {
        Name: "The Duke of Duckworth",
        Lat: "47.5694", Lng: "-52.6984",
        Clue: "On the oldest street where the duke once drank, she waits behind a wooden door. Follow the smell of fish and chips and the sound of trad fiddles.",
        Reward: "🍟 Free side of fries with any entrée.",
        ImageURL: ""
      },
      {
        Name: "The Rooms",
        Lat: "47.5720", Lng: "-52.7100",
        Clue: "High on the hill where the past is kept in glass and stone, a fairy perches above the harbour. Three rooms, one roof, and a secret in the archives.",
        Reward: "🎟️ Buy one admission, get one free.",
        ImageURL: ""
      },
    ];
  }
}

/**
 * Simple CSV-to-JSON parser.
 * Handles quoted fields with commas inside them.
 * Returns array of objects keyed by header row.
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse header row
  const headers = splitCSVLine(lines[0]);

  // Parse data rows
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = splitCSVLine(line);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h.trim()] = (values[idx] || '').trim();
    });

    // Skip rows missing required fields
    if (obj.Name && obj.Lat && obj.Lng && obj.Clue) {
      results.push(obj);
    }
  }
  return results;
}

/**
 * Splits a single CSV line by commas, respecting quoted fields.
 * e.g., 'hello,"world, foo",bar' → ['hello', 'world, foo', 'bar']
 */
function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

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
 * Randomly selects a fairy location from the database,
 * hides the name, and displays the cryptic clue in the UI.
 */
function generateMysteryCrawl() {
  // Clean up any previous hunt
  stopTracking();

  // Guard: database not loaded yet
  if (fairyDatabase.length === 0) {
    const errorEl = document.getElementById('hunt-error');
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.textContent = "Hold on b'y — the fairy database isn't loaded yet. Give it a sec and try again.";
    }
    return;
  }

  // DOM references
  const clueEl     = document.getElementById('hunt-clue');
  const distEl     = document.getElementById('hunt-distance');
  const revealEl   = document.getElementById('hunt-location-reveal');
  const rewardEl   = document.getElementById('hunt-reward');
  const errorEl    = document.getElementById('hunt-error');
  const catchBtn   = document.getElementById('btn-catch-fairy');
  const genBtn     = document.getElementById('btn-generate-crawl');
  const card       = document.getElementById('fairy-hunt-card');
  const fairyImg   = document.getElementById('fairy-image');
  const rewardDisp = document.getElementById('reward-display');

  if (!clueEl) return;

  // ── TASK 1: Filter out already-caught fairies ──
  const caughtFairies = getCaughtFairies(); // returns [] if empty or missing
  const availableFairies = fairyDatabase.filter(
    fairy => !caughtFairies.includes(fairy.Name)
  );

  // ── TASK 2: 100% Completion State ──
  if (availableFairies.length === 0) {
    // Reset card to a warm hearth glow for the victory lap
    card.classList.remove('card-hunt');
    card.classList.add('card-hearth');

    clueEl.textContent = "Lord t'underin', you've scoured the whole island! There's not a fairy left in the RDF right now. Kick back at the pub, or check back later for new ones.";
    distEl.textContent = `🏆 ${caughtFairies.length} / ${fairyDatabase.length} fairies collected — 100% Complete!`;
    distEl.className = 'hunt-distance';

    revealEl.style.display  = 'none';
    rewardEl.style.display  = 'none';
    catchBtn.style.display  = 'none';
    errorEl.style.display   = 'none';
    if (fairyImg)   { fairyImg.style.display = 'none'; fairyImg.src = ''; }
    if (rewardDisp) {
      rewardDisp.innerHTML = '<span class="reward-badge">🏆 PASSPORT COMPLETE</span><span class="reward-text">You found every fairy on the island. You\'re an honorary Newfoundlander now, b\'y.</span>';
      rewardDisp.style.display = 'block';
    }

    genBtn.textContent = 'All Fairies Caught!';
    genBtn.disabled = true;
    genBtn.style.opacity = '0.5';

    return; // Don't start GPS — nothing left to hunt
  }

  // ── TASK 3: Standard Hunt — pick from uncaught fairies only ──
  activeHunt = availableFairies[Math.floor(Math.random() * availableFairies.length)];

  // Reset UI to hunt state
  card.classList.remove('card-hearth');
  card.classList.add('card-hunt');
  revealEl.style.display  = 'none';
  rewardEl.style.display  = 'none';
  catchBtn.style.display  = 'none';
  errorEl.style.display   = 'none';
  distEl.className        = 'hunt-distance';
  genBtn.textContent      = 'New Mystery';
  genBtn.disabled         = false;
  genBtn.style.opacity    = '1';
  if (fairyImg)   { fairyImg.style.display = 'none'; fairyImg.src = ''; }
  if (rewardDisp) { rewardDisp.style.display = 'none'; rewardDisp.textContent = ''; }

  // Show the clue + progress count
  clueEl.textContent = `"${activeHunt.Clue}"`;
  distEl.textContent = `Summoning the fairies... (${caughtFairies.length}/${fairyDatabase.length} caught)`;

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
      const dist    = calculateDistance(userLat, userLng, parseFloat(activeHunt.Lat), parseFloat(activeHunt.Lng));
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
 * Cheeky consolation messages for locations with no reward.
 * Randomly selected when foundFairy.Reward is empty.
 */
const NO_REWARD_QUIPS = [
  "✨ You found the {NAME}! No coupon here today, but it's about the journey, not the destination, and the friends you made along the way. Sorry if you didn't make any...",
  "✨ You found the {NAME}! No deal this time. The fairy said she left it in her other wings. Classic fairy behaviour.",
  "✨ You found the {NAME}! The reward? The warm feeling in your heart. What, you wanted a discount too? Greedy.",
  "✨ You found the {NAME}! No coupon, but the fairy did leave you an imaginary high-five. You're welcome.",
  "✨ You found the {NAME}! The fairy was here but she spent the reward budget on screech. Can't blame her really.",
  "✨ You found the {NAME}! Your reward is the knowledge that you walked here in mauzy weather like a true Newfoundlander. Best kind.",
  "✨ You found the {NAME}! No deal unlocked — but the fairy says you looked wonderful doing it. She's very supportive.",
  "✨ You found the {NAME}! The deal fairy called in sick. The vibes fairy is covering her shift. Enjoy the vibes.",
];

/**
 * WIN STATE — Called when user taps "Catch Fairy" within 75m.
 * Reveals the location, applies conditional reward logic,
 * sets the fairy image, and transitions to Hearth theme.
 */
function revealFairy() {
  if (!activeHunt) return;

  const foundFairy = activeHunt;

  // Stop tracking — hunt is over
  stopTracking();

  // DOM references
  const card       = document.getElementById('fairy-hunt-card');
  const clueEl     = document.getElementById('hunt-clue');
  const distEl     = document.getElementById('hunt-distance');
  const revealEl   = document.getElementById('hunt-location-reveal');
  const rewardEl   = document.getElementById('hunt-reward');
  const catchBtn   = document.getElementById('btn-catch-fairy');
  const genBtn     = document.getElementById('btn-generate-crawl');
  const fairyImg   = document.getElementById('fairy-image');
  const rewardDisp = document.getElementById('reward-display');

  // ── Transition to Hearth theme ──
  if (card) {
    card.classList.remove('card-hunt');
    card.classList.add('card-hearth');
  }

  // Reveal the location name
  if (revealEl) {
    revealEl.textContent = `🧚 ${foundFairy.Name}`;
    revealEl.style.display = 'block';
  }

  // ── Conditional Reward Logic ──
  const hasReward = foundFairy.Reward && foundFairy.Reward.trim().length > 0;

  if (hasReward) {
    // Has a deal — show it prominently
    if (rewardDisp) {
      rewardDisp.innerHTML = `<span class="reward-badge">🎁 DEAL UNLOCKED</span><span class="reward-text">${foundFairy.Reward}</span><span class="reward-cta">Show this screen to staff to claim.</span>`;
      rewardDisp.style.display = 'block';
    }
    if (clueEl) {
      clueEl.textContent = "You found her! The fairy's been caught and she brought a gift.";
    }
  } else {
    // No deal — pick a random cheeky message
    const quip = NO_REWARD_QUIPS[Math.floor(Math.random() * NO_REWARD_QUIPS.length)];
    if (rewardDisp) {
      rewardDisp.innerHTML = `<span class="reward-text reward-text--quip">${quip.replace('{NAME}', foundFairy.Name)}</span>`;
      rewardDisp.style.display = 'block';
    }
    if (clueEl) {
      clueEl.textContent = "You found her! No deal this time, but the fairy appreciates the effort.";
    }
  }

  // Hide the old reward element (replaced by reward-display)
  if (rewardEl) rewardEl.style.display = 'none';

  // ── Image Logic ──
  if (fairyImg && foundFairy.ImageURL && foundFairy.ImageURL.trim().length > 0) {
    fairyImg.src = foundFairy.ImageURL.trim();
    fairyImg.alt = `Photo of ${foundFairy.Name}`;
    fairyImg.style.display = 'block';

    // Handle broken image gracefully
    fairyImg.onerror = () => {
      fairyImg.style.display = 'none';
      console.warn(`[RDF] Failed to load image for ${foundFairy.Name}`);
    };
  } else if (fairyImg) {
    fairyImg.style.display = 'none';
  }

  // Update distance text
  if (distEl) {
    distEl.textContent = '✨ Fairy Charm collected!';
    distEl.className = 'hunt-distance';
  }

  // Hide catch button, update generate button for next round
  if (catchBtn) catchBtn.style.display = 'none';
  if (genBtn) genBtn.textContent = 'Hunt Another Fairy';

  // ── Save to Passport ──
  saveCaughtFairy(foundFairy.Name);

  // Clear active hunt
  activeHunt = null;

  // Fire a celebratory notification if permission granted
  if ('Notification' in window && Notification.permission === 'granted') {
    const notifBody = hasReward
      ? `You found her at ${foundFairy.Name}! Show your phone to claim: ${foundFairy.Reward}`
      : `You found her at ${foundFairy.Name}! No deal this time, but you're a legend.`;

    new Notification('🧚 Fairy Caught!', {
      body: notifBody,
      tag: 'rdf-fairy-catch',
    });
  }
}

/**
 * Initializes the Fairy Hunt: loads the CSV database,
 * wires Generate and Catch buttons.
 */
async function initFairyHunt() {
  // Load fairy locations from Google Sheet CSV
  await initDatabase();

  const genBtn   = document.getElementById('btn-generate-crawl');
  const catchBtn = document.getElementById('btn-catch-fairy');

  if (genBtn) {
    genBtn.addEventListener('click', generateMysteryCrawl);
  }
  if (catchBtn) {
    catchBtn.addEventListener('click', revealFairy);
  }
}


/* ═══════════════════════════════════════════════
   11. DIGITAL PASSPORT GALLERY
   ───────────────────────────────────────────────
   Tracks which fairies the user has caught using
   localStorage. Renders a grid of collected fairy
   cards in the Passport tab.
   ═══════════════════════════════════════════════ */

/**
 * Saves a caught fairy's name to localStorage.
 * Prevents duplicates. Called from revealFairy().
 * @param {string} fairyName — The Name field from the fairy database
 */
function saveCaughtFairy(fairyName) {
  if (!fairyName) return;

  let caught = [];
  try {
    const stored = localStorage.getItem('caughtFairies');
    if (stored) caught = JSON.parse(stored);
  } catch (e) {
    console.warn('[RDF] Failed to read caughtFairies from localStorage:', e);
    caught = [];
  }

  // Don't add duplicates
  if (caught.includes(fairyName)) {
    console.log(`[RDF] Fairy "${fairyName}" already in passport.`);
    return;
  }

  caught.push(fairyName);

  try {
    localStorage.setItem('caughtFairies', JSON.stringify(caught));
    console.log(`[RDF] 🧚 Fairy saved to passport: "${fairyName}" (${caught.length} total)`);
  } catch (e) {
    console.warn('[RDF] Failed to save to localStorage:', e);
  }
}

/**
 * Retrieves the list of caught fairy names from localStorage.
 * @returns {string[]}
 */
function getCaughtFairies() {
  try {
    const stored = localStorage.getItem('caughtFairies');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.warn('[RDF] Failed to read caughtFairies:', e);
    return [];
  }
}

/**
 * Renders the Passport Gallery grid.
 * Matches saved fairy names against fairyDatabase to
 * retrieve ImageURL. Falls back to an emoji placeholder
 * if no image exists.
 */
function renderPassport() {
  const grid = document.getElementById('passport-grid');
  if (!grid) return;

  const caught = getCaughtFairies();

  // ── Empty state ──
  if (caught.length === 0) {
    grid.innerHTML = `
      <div class="passport-empty">
        <span class="passport-empty-icon">🧚</span>
        <p class="passport-empty-text">
          Empty as a dory in drydock, b'y.<br>
          Get out in the RDF and catch some fairies!
        </p>
      </div>
    `;
    return;
  }

  // ── Build cards ──
  const cards = caught.map(name => {
    // Try to find the fairy in our database for the image
    let imageURL = '';
    if (typeof fairyDatabase !== 'undefined' && Array.isArray(fairyDatabase)) {
      const match = fairyDatabase.find(f => f.Name === name);
      if (match && match.ImageURL && match.ImageURL.trim()) {
        imageURL = match.ImageURL.trim();
      }
    }

    const imageHTML = imageURL
      ? `<img class="collected-card-img" src="${imageURL}" alt="${name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
         <div class="collected-card-placeholder" style="display:none;">🧚</div>`
      : `<div class="collected-card-placeholder">🧚</div>`;

    return `
      <div class="collected-card">
        ${imageHTML}
        <div class="collected-card-name">${name}</div>
      </div>
    `;
  }).join('');

  grid.innerHTML = `
    ${cards}
    <div class="passport-count" style="grid-column: 1 / -1; justify-content: center; padding-top: var(--s-sm);">
      🧚 ${caught.length} ${caught.length === 1 ? 'fairy' : 'fairies'} collected
    </div>
  `;
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


/* ═══════════════════════════════════════════════
   🛠️ TEMPORARY DEV TOOL — CSV EXPORT
   ───────────────────────────────────────────────
   Exports the hardcoded VENUES array to a
   downloadable CSV file for Google Sheets import.
   
   ⚠️ DELETE THIS ENTIRE BLOCK BEFORE PRODUCTION.
   ═══════════════════════════════════════════════ */

function exportDirectoryToCSV() {
  // Guard: make sure VENUES exists
  if (typeof VENUES === 'undefined' || !Array.isArray(VENUES) || VENUES.length === 0) {
    alert("No VENUES data found to export.");
    return;
  }

  // Dynamically extract headers from the first object's keys
  const headers = Object.keys(VENUES[0]);

  /**
   * Escapes a single CSV field value.
   * - Converts arrays to semicolon-separated strings (e.g., tags)
   * - Wraps in double quotes if it contains commas, quotes, or newlines
   * - Escapes internal double quotes by doubling them ("")
   */
  function escapeCSVField(value) {
    if (value === null || value === undefined) return '';

    // Convert arrays to semicolon-delimited string
    if (Array.isArray(value)) {
      value = value.join('; ');
    }

    // Convert to string
    let str = String(value);

    // If it contains commas, quotes, or newlines — wrap in quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      // Escape internal double quotes by doubling them
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    }

    return str;
  }

  // Build CSV header row
  const csvRows = [headers.join(',')];

  // Build data rows
  VENUES.forEach(venue => {
    const row = headers.map(key => escapeCSVField(venue[key]));
    csvRows.push(row.join(','));
  });

  // Join all rows with newlines
  const csvString = csvRows.join('\n');

  // Create Blob and trigger download
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'fairy_directory_export.csv';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log(`[RDF DEV] Exported ${VENUES.length} venues to CSV.`);
}
