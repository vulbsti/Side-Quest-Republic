// Where real Delhi lands in the game. Real metres are compressed by SCALE, x runs east and -z north (the minimap
// and eval/lib/place.mjs read it the same way). Pure: the engine, the client, the importer and the eval share it.
export const SCALE = 0.6;
/** The game's (0, 0): the Jantar Mantar observatory. */
export const ORIGIN = { lat: 28.62705, lon: 77.21665 };
const M_PER_DEG_LAT = 111_320;
const M_PER_DEG_LON = Math.cos((ORIGIN.lat * Math.PI) / 180) * M_PER_DEG_LAT;
export function project(lat, lon) {
  return { x: (lon - ORIGIN.lon) * M_PER_DEG_LON * SCALE, z: -(lat - ORIGIN.lat) * M_PER_DEG_LAT * SCALE };
}
export function unproject(x, z) {
  return { lat: ORIGIN.lat - z / SCALE / M_PER_DEG_LAT, lon: ORIGIN.lon + x / SCALE / M_PER_DEG_LON };
}
// The patch the game covers: CP's outer circle in the north to Patel Chowk in the south, Bangla Sahib to Janpath.
const sw = project(28.6195, 77.2085), ne = project(28.6365, 77.2232);
export const EXTENT = Object.freeze({ minX: Math.floor(sw.x), maxX: Math.ceil(ne.x), minZ: Math.floor(ne.z), maxZ: Math.ceil(sw.z) });
