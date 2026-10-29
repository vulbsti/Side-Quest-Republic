# OSM extract — Connaught Place, Jantar Mantar Road, Sansad Marg

- **Downloaded:** 2026-10-29 via Overpass API (overpass-api.de)
- **Bounding box:** S 28.6140, W 77.2040, N 28.6380, E 77.2260
- **Licence:** Open Database License (ODbL) 1.0. © OpenStreetMap contributors — https://www.openstreetmap.org/copyright
  Any public use must credit "© OpenStreetMap contributors"; derived databases must stay ODbL.

All files are raw Overpass JSON (`out body geom;`): every element has its tags, and ways/relations carry inline
`geometry` (lat/lon arrays) plus `bounds`, so no separate node lookup is needed.

| File | Query | Elements |
|---|---|---|
| `highway.json` | `way["highway"]` — roads, footways, service roads, pedestrian areas | 2115 ways |
| `buildings.json` | `way["building"]`, `relation["building"]` | 1305 ways, 86 relations |
| `pois.json` | named nodes/ways with shop, amenity, tourism, historic, leisure, office, railway station/subway entrance, public_transport, bus_stop, place_of_worship; plus all `railway=subway_entrance` nodes (named or not) | 1121 nodes, 132 ways |
| `landuse.json` | landuse, leisure=park/garden, natural (includes `natural=tree` nodes), amenity=parking, water | 325 nodes, 237 ways, 5 relations |
