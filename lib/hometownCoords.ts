/**
 * Static city → [lat, lng] mapping for player hometown geocoding.
 *
 * Keys are lowercase "city, st" (matching MCLA roster format).
 * Lookup is exact-match first, then city-name-only fallback.
 *
 * No external API calls — coordinates are hardcoded so map renders instantly.
 *
 * To populate players.hometown_lat / hometown_lng in Supabase, run this SQL:
 *
 *   alter table public.players add column if not exists hometown_lat double precision;
 *   alter table public.players add column if not exists hometown_lng double precision;
 *   alter table public.players add column if not exists slug text;
 *
 * The syncRosterToSupabase function calls deriveHometownCoords() and stores the
 * result alongside each player row on every roster sync.
 */

const COORDS: Record<string, [number, number]> = {
  // ── Santa Barbara / Ventura ──────────────────────────────────────────────
  'santa barbara, ca':   [34.4208, -119.6982],
  'goleta, ca':          [34.4361, -119.8276],
  'carpinteria, ca':     [34.3991, -119.5287],
  'ventura, ca':         [34.2746, -119.2290],
  'ojai, ca':            [34.4480, -119.2429],
  'oxnard, ca':          [34.1975, -119.1771],
  'camarillo, ca':       [34.2164, -119.0376],
  'moorpark, ca':        [34.2853, -118.8817],

  // ── Conejo / Simi Valley ────────────────────────────────────────────────
  'thousand oaks, ca':   [34.1706, -118.8376],
  'westlake village, ca':[34.1517, -118.8198],
  'agoura hills, ca':    [34.1531, -118.7617],
  'simi valley, ca':     [34.2694, -118.7815],
  'calabasas, ca':       [34.1575, -118.6508],

  // ── West LA / Beach Cities ───────────────────────────────────────────────
  'los angeles, ca':     [34.0522, -118.2437],
  'malibu, ca':          [34.0259, -118.7798],
  'pacific palisades, ca':[34.0436, -118.5251],
  'santa monica, ca':    [34.0195, -118.4912],
  'venice, ca':          [33.9850, -118.4695],
  'brentwood, ca':       [34.0499, -118.4788],
  'west los angeles, ca':[34.0336, -118.4412],
  'culver city, ca':     [34.0211, -118.3965],
  'mar vista, ca':       [33.9997, -118.4292],
  'playa del rey, ca':   [33.9581, -118.4406],
  'el segundo, ca':      [33.9192, -118.4165],
  'manhattan beach, ca': [33.8847, -118.4109],
  'hermosa beach, ca':   [33.8622, -118.3995],
  'redondo beach, ca':   [33.8492, -118.3884],
  'torrance, ca':        [33.8358, -118.3406],
  'gardena, ca':         [33.8883, -118.3089],
  'hawthorne, ca':       [33.9164, -118.3526],
  'inglewood, ca':       [33.9617, -118.3531],

  // ── Palos Verdes / South Bay ────────────────────────────────────────────
  'palos verdes, ca':    [33.7445, -118.3870],
  'palos verdes estates, ca': [33.7924, -118.3924],
  'rancho palos verdes, ca':  [33.7444, -118.3870],
  'rolling hills, ca':   [33.7564, -118.3551],
  'rolling hills estates, ca':[33.7773, -118.3549],
  'lomita, ca':          [33.7920, -118.3159],
  'long beach, ca':      [33.7701, -118.1937],

  // ── San Fernando Valley / Northeast LA ──────────────────────────────────
  'studio city, ca':     [34.1397, -118.3870],
  'sherman oaks, ca':    [34.1503, -118.4493],
  'encino, ca':          [34.1580, -118.5009],
  'tarzana, ca':         [34.1664, -118.5490],
  'woodland hills, ca':  [34.1684, -118.6059],
  'reseda, ca':          [34.2002, -118.5356],
  'northridge, ca':      [34.2364, -118.5344],
  'chatsworth, ca':      [34.2570, -118.5997],
  'granada hills, ca':   [34.2817, -118.5026],
  'north hills, ca':     [34.2345, -118.4887],
  'porter ranch, ca':    [34.2799, -118.5567],
  'burbank, ca':         [34.1808, -118.3090],
  'glendale, ca':        [34.1425, -118.2551],
  'la canada flintridge, ca': [34.1992, -118.2000],
  'pasadena, ca':        [34.1478, -118.1445],
  'san marino, ca':      [34.1214, -118.1067],
  'arcadia, ca':         [34.1397, -118.0353],
  'monrovia, ca':        [34.1442, -117.9995],

  // ── Orange County ────────────────────────────────────────────────────────
  'anaheim, ca':         [33.8366, -117.9143],
  'fullerton, ca':       [33.8703, -117.9242],
  'brea, ca':            [33.9167, -117.9003],
  'yorba linda, ca':     [33.8886, -117.8131],
  'placentia, ca':       [33.8722, -117.8703],
  'orange, ca':          [33.7879, -117.8531],
  'villa park, ca':      [33.8142, -117.8131],
  'tustin, ca':          [33.7458, -117.8262],
  'irvine, ca':          [33.6846, -117.8265],
  'newport beach, ca':   [33.6189, -117.9289],
  'corona del mar, ca':  [33.6030, -117.8731],
  'costa mesa, ca':      [33.6411, -117.9187],
  'laguna beach, ca':    [33.5427, -117.7854],
  'laguna niguel, ca':   [33.5225, -117.7079],
  'laguna hills, ca':    [33.5967, -117.6954],
  'aliso viejo, ca':     [33.5768, -117.7254],
  'lake forest, ca':     [33.6469, -117.6891],
  'mission viejo, ca':   [33.5999, -117.6584],
  'rancho santa margarita, ca': [33.6409, -117.6032],
  'coto de caza, ca':    [33.6087, -117.5756],
  'ladera ranch, ca':    [33.5582, -117.6418],
  'dana point, ca':      [33.4669, -117.6981],
  'san clemente, ca':    [33.4269, -117.6120],
  'san juan capistrano, ca': [33.5009, -117.6622],

  // ── San Diego ─────────────────────────────────────────────────────────────
  'san diego, ca':       [32.7157, -117.1611],
  'la jolla, ca':        [32.8328, -117.2713],
  'del mar, ca':         [32.9595, -117.2653],
  'solana beach, ca':    [32.9907, -117.2712],
  'encinitas, ca':       [33.0369, -117.2920],
  'carlsbad, ca':        [33.1581, -117.3506],
  'oceanside, ca':       [33.1959, -117.3795],
  'vista, ca':           [33.2000, -117.2425],
  'san marcos, ca':      [33.1434, -117.1661],
  'escondido, ca':       [33.1192, -117.0864],
  'rancho santa fe, ca': [33.0152, -117.2005],
  'poway, ca':           [32.9628, -117.0359],
  'carmel valley, ca':   [32.9380, -117.2155],
  'point loma, ca':      [32.7313, -117.2419],
  'coronado, ca':        [32.6859, -117.1831],
  'chula vista, ca':     [32.6401, -117.0842],

  // ── Inland Empire ─────────────────────────────────────────────────────────
  'riverside, ca':       [33.9806, -117.3755],
  'corona, ca':          [33.8753, -117.5664],
  'ontario, ca':         [34.0633, -117.6509],
  'rancho cucamonga, ca':[34.1064, -117.5931],
  'claremont, ca':       [34.0966, -117.7198],
  'upland, ca':          [34.0975, -117.6484],
  'chino hills, ca':     [33.9898, -117.7326],
  'redlands, ca':        [34.0556, -117.1825],

  // ── Bay Area ─────────────────────────────────────────────────────────────
  'san francisco, ca':   [37.7749, -122.4194],
  'palo alto, ca':       [37.4419, -122.1430],
  'menlo park, ca':      [37.4530, -122.1817],
  'atherton, ca':        [37.4613, -122.1977],
  'portola valley, ca':  [37.3750, -122.2161],
  'woodside, ca':        [37.4291, -122.2538],
  'hillsborough, ca':    [37.5591, -122.3621],
  'san mateo, ca':       [37.5630, -122.3255],
  'burlingame, ca':      [37.5842, -122.3659],
  'mill valley, ca':     [37.9060, -122.5450],
  'tiburon, ca':         [37.8907, -122.4569],
  'belvedere, ca':       [37.8666, -122.4649],
  'ross, ca':            [37.9629, -122.5547],
  'kent woodlands, ca':  [37.9629, -122.5547],
  'marin, ca':           [37.9554, -122.5282],
  'sausalito, ca':       [37.8591, -122.4853],
  'lafayette, ca':       [37.8858, -122.1180],
  'moraga, ca':          [37.8349, -122.1299],
  'orinda, ca':          [37.8771, -122.1797],
  'walnut creek, ca':    [37.9101, -122.0652],
  'danville, ca':        [37.8218, -121.9999],
  'san ramon, ca':       [37.7799, -121.9780],
  'pleasanton, ca':      [37.6624, -121.8747],
  'berkeley, ca':        [37.8716, -122.2727],
  'oakland, ca':         [37.8044, -122.2712],
  'san jose, ca':        [37.3382, -121.8863],
  'santa clara, ca':     [37.3541, -121.9552],
  'cupertino, ca':       [37.3230, -122.0322],
  'los gatos, ca':       [37.2358, -121.9624],
  'campbell, ca':        [37.2872, -121.9499],
  'saratoga, ca':        [37.2638, -122.0230],
  'monte sereno, ca':    [37.2354, -121.9904],
  'los altos, ca':       [37.3852, -122.1141],
  'los altos hills, ca': [37.3694, -122.1427],
  'mountain view, ca':   [37.3861, -122.0839],
  'sunnyvale, ca':       [37.3688, -122.0363],

  // ── Central Coast / Central Valley ──────────────────────────────────────
  'san luis obispo, ca': [35.2828, -120.6596],
  'paso robles, ca':     [35.6268, -120.6909],
  'arroyo grande, ca':   [35.1186, -120.5908],
  'pismo beach, ca':     [35.1427, -120.6407],
  'fresno, ca':          [36.7378, -119.7871],
  'bakersfield, ca':     [35.3733, -119.0187],
  'sacramento, ca':      [38.5816, -121.4944],
  'folsom, ca':          [38.6779, -121.1761],
  'el dorado hills, ca': [38.6850, -121.0651],
  'granite bay, ca':     [38.7545, -121.1707],
  'roseville, ca':       [38.7521, -121.2880],

  // ── Other Western States ─────────────────────────────────────────────────
  'las vegas, nv':       [36.1699, -115.1398],
  'henderson, nv':       [36.0395, -114.9817],
  'phoenix, az':         [33.4484, -112.0740],
  'scottsdale, az':      [33.4942, -111.9261],
  'tempe, az':           [33.4255, -111.9400],
  'chandler, az':        [33.3062, -111.8413],
  'gilbert, az':         [33.3528, -111.7890],
  'mesa, az':            [33.4152, -111.8315],
  'denver, co':          [39.7392, -104.9903],
  'boulder, co':         [40.0150, -105.2705],
  'aurora, co':          [39.7294, -104.8319],
  'seattle, wa':         [47.6062, -122.3321],
  'bellevue, wa':        [47.6101, -122.2015],
  'portland, or':        [45.5051, -122.6750],
  'salt lake city, ut':  [40.7608, -111.8910],
  'boise, id':           [43.6150, -116.2023],

  // ── Hawaii ────────────────────────────────────────────────────────────────
  'honolulu, hi':        [21.3069, -157.8583],
  'kailua, hi':          [21.4022, -157.7394],
  'kaneohe, hi':         [21.4022, -157.8036],
  'aiea, hi':            [21.3858, -157.9311],

  // ── Mid-Atlantic / Lacrosse Belt ─────────────────────────────────────────
  'washington, dc':      [38.9072, -77.0369],
  'bethesda, md':        [38.9807, -77.1003],
  'chevy chase, md':     [38.9840, -77.0833],
  'potomac, md':         [39.0187, -77.2086],
  'rockville, md':       [39.0840, -77.1528],
  'north potomac, md':   [39.0717, -77.2400],
  'gaithersburg, md':    [39.1434, -77.2014],
  'germantown, md':      [39.1731, -77.2717],
  'annapolis, md':       [38.9784, -76.4922],
  'baltimore, md':       [39.2904, -76.6122],
  'towson, md':          [39.4015, -76.6019],
  'timonium, md':        [39.4376, -76.6161],
  'lutherville, md':     [39.4293, -76.6283],
  'vienna, va':          [38.9012, -77.2653],
  'mclean, va':          [38.9340, -77.1773],
  'great falls, va':     [39.0001, -77.2886],
  'reston, va':          [38.9687, -77.3411],
  'herndon, va':         [38.9696, -77.3860],
  'richmond, va':        [37.5407, -77.4360],
  'virginia beach, va':  [36.8529, -75.9780],
  'chantilly, va':       [38.8951, -77.4325],

  // ── Northeast ─────────────────────────────────────────────────────────────
  'new york, ny':        [40.7128, -74.0060],
  'garden city, ny':     [40.7268, -73.6360],
  'manhasset, ny':       [40.7006, -73.6988],
  'syosset, ny':         [40.8273, -73.5026],
  'jericho, ny':         [40.7912, -73.5387],
  'huntington, ny':      [40.8676, -73.4257],
  'cold spring harbor, ny': [40.8634, -73.4568],
  'dix hills, ny':       [40.8026, -73.3454],
  'westchester, ny':     [41.0534, -73.7629],
  'rye, ny':             [40.9807, -73.6871],
  'bronxville, ny':      [40.9387, -73.8321],
  'scarsdale, ny':       [40.9898, -73.7996],
  'greenwich, ct':       [41.0262, -73.6282],
  'darien, ct':          [41.0782, -73.4693],
  'new canaan, ct':      [41.1465, -73.4957],
  'westport, ct':        [41.1415, -73.3579],
  'wilton, ct':          [41.1954, -73.4368],
  'boston, ma':          [42.3601, -71.0589],
  'newton, ma':          [42.3370, -71.2092],
  'wellesley, ma':       [42.2968, -71.2924],
  'charlotte, nc':       [35.2271, -80.8431],
  'atlanta, ga':         [33.7490, -84.3880],
  'naples, fl':          [26.1420, -81.7948],
  'miami, fl':           [25.7617, -80.1918],
};

/**
 * Geocode a city + optional state string to [lat, lng].
 * Mirrors deriveHometownCoords but returns a tuple for direct Leaflet use.
 */
export function geocodeHometown(city: string, state?: string): [number, number] | null {
  const rawKey = state
    ? `${city.trim().toLowerCase()}, ${state.trim().toLowerCase()}`
    : city.trim().toLowerCase();

  if (COORDS[rawKey]) return COORDS[rawKey];

  const cityLower = city.trim().toLowerCase();
  const entry = Object.entries(COORDS).find(([k]) => k.split(',')[0].trim() === cityLower);
  return entry ? entry[1] : null;
}

export function deriveHometownCoords(hometown: string): { lat: number; lng: number } | null {
  if (!hometown) return null;
  const key = hometown.trim().toLowerCase();

  // 1. Exact match
  if (COORDS[key]) {
    const [lat, lng] = COORDS[key];
    return { lat, lng };
  }

  // 2. City-only fallback (before the first comma)
  const city = key.split(',')[0].trim();
  const entry = Object.entries(COORDS).find(([k]) => k.split(',')[0].trim() === city);
  if (entry) {
    const [lat, lng] = entry[1];
    return { lat, lng };
  }

  return null;
}
