export const UCSB_COORDS: [number, number] = [34.414, -119.8489];

// MCLA D-I team coordinates — keyed by lowercase normalized name
const TEAM_COORDS: Record<string, [number, number]> = {
  // ── UC campuses ───────────────────────────────────────────────────────────
  'uc santa barbara':       [34.414,   -119.8489],
  'ucsb':                   [34.414,   -119.8489],
  'ucla':                   [34.0689,  -118.4452],
  'usc':                    [34.0224,  -118.2851],
  'uc berkeley':            [37.8716,  -122.2727],
  'cal':                    [37.8716,  -122.2727],
  'uc davis':               [38.5382,  -121.7617],
  'uc san diego':           [32.8801,  -117.234],
  'ucsd':                   [32.8801,  -117.234],
  'uc irvine':              [33.6405,  -117.8443],
  'uci':                    [33.6405,  -117.8443],
  'uc santa cruz':          [36.9916,  -122.0583],
  'ucsc':                   [36.9916,  -122.0583],
  'uc riverside':           [33.9737,  -117.3281],
  // ── California state schools ──────────────────────────────────────────────
  'cal poly':               [35.305,   -120.6625],
  'cal poly slo':           [35.305,   -120.6625],
  'san jose state':         [37.3352,  -121.8811],
  'sjsu':                   [37.3352,  -121.8811],
  'fresno state':           [36.8127,  -119.7479],
  'long beach state':       [33.7839,  -118.1141],
  'csulb':                  [33.7839,  -118.1141],
  'san diego state':        [32.7757,  -117.0719],
  'sdsu':                   [32.7757,  -117.0719],
  'sacramento state':       [38.559,   -121.423],
  'csus':                   [38.559,   -121.423],
  'cal state fullerton':    [33.8822,  -117.8851],
  'csuf':                   [33.8822,  -117.8851],
  'cal state northridge':   [34.2395,  -118.527],
  'csun':                   [34.2395,  -118.527],
  // ── Stanford / privates ───────────────────────────────────────────────────
  'stanford':               [37.4275,  -122.1697],
  'san francisco':          [37.7749,  -122.4194],
  'usf':                    [37.7749,  -122.4194],
  'santa clara':            [37.3496,  -121.9390],
  'loyola marymount':       [33.9694,  -118.4164],
  'lmu':                    [33.9694,  -118.4164],
  'pepperdine':             [34.0359,  -118.7086],
  // ── Southwest ─────────────────────────────────────────────────────────────
  'arizona':                [32.2319,  -110.9501],
  'arizona state':          [33.4242,  -111.9281],
  'asu':                    [33.4242,  -111.9281],
  'grand canyon':           [33.5085,  -112.0927],
  'gcu':                    [33.5085,  -112.0927],
  'northern arizona':       [35.1983,  -111.6513],
  'nevada':                 [39.5296,  -119.8138],
  'unlv':                   [36.1088,  -115.1386],
  // ── Pacific Northwest ─────────────────────────────────────────────────────
  'oregon':                 [44.0461,  -123.0722],
  'oregon state':           [44.5646,  -123.262],
  'washington':             [47.6553,  -122.3035],
  'washington state':       [46.7298,  -117.1817],
  'boise state':            [43.6013,  -116.1996],
  'idaho':                  [46.7271,  -117.014],
  // ── Mountain West / Rockies ───────────────────────────────────────────────
  'utah':                   [40.7649,  -111.8421],
  'byu':                    [40.2518,  -111.6493],
  'utah state':             [41.7441,  -111.8096],
  'colorado':               [40.015,   -105.2705],
  'colorado state':         [40.5734,  -105.0865],
  'denver':                 [39.6787,  -104.9617],
  'du':                     [39.6787,  -104.9617],
  'air force':              [38.9983,  -104.8617],
  'wyoming':                [41.3149,  -105.5664],
  'new mexico':             [35.0845,  -106.619],
  // ── Texas / SLC ───────────────────────────────────────────────────────────
  'texas':                  [30.2849,  -97.7341],
  'ut austin':              [30.2849,  -97.7341],
  'texas a&m':              [30.6154,  -96.34],
  'tcu':                    [32.7091,  -97.3654],
  'baylor':                 [31.5493,  -97.1467],
  'smu':                    [32.8412,  -96.7848],
  'houston':                [29.72,    -95.342],
  'rice':                   [29.717,   -95.4017],
  'texas tech':             [33.5779,  -101.8552],
  'oklahoma':               [35.2058,  -97.4455],
  'ou':                     [35.2058,  -97.4455],
  'oklahoma state':         [36.1156,  -97.0584],
  'osu':                    [36.1156,  -97.0584],
  'kansas':                 [38.9543,  -95.2558],
  'kansas state':           [39.1836,  -96.5717],
  'arkansas':               [36.0674,  -94.1741],
  'lsu':                    [30.4133,  -91.18],
  'tulsa':                  [36.1509,  -95.9469],
  // ── Midwest ───────────────────────────────────────────────────────────────
  'notre dame':             [41.7052,  -86.2354],
  'ohio state':             [40.0011,  -83.0153],
  'michigan':               [42.2808,  -83.7430],
  'michigan state':         [42.7018,  -84.4822],
  'wisconsin':              [43.0766,  -89.4125],
  'illinois':               [40.1020,  -88.2272],
  // ── Hawaii ────────────────────────────────────────────────────────────────
  'hawaii':                 [21.2969,  -157.8172],
};

// Normalize a raw opponent name string → lookup key
function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9& ]/g, '').trim();
}

export function getCoords(opponent: string, isAway: boolean): [number, number] {
  if (!isAway) return UCSB_COORDS;

  const key = normalize(opponent);

  // Exact match
  if (TEAM_COORDS[key]) return TEAM_COORDS[key];

  // Partial match: check if any known key is contained in the opponent name
  for (const [k, v] of Object.entries(TEAM_COORDS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }

  // Fallback: stay at UCSB (unknown location)
  return UCSB_COORDS;
}

// Haversine distance in miles between two lat/lng points
export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
