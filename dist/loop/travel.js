// Fast travel: hop to a real place on the map (a metro stop, an e-rickshaw, a paidal shortcut) for a couple of
// game minutes instead of a minute of jogging. The map is real-sized, so most of a day used to be walking.
// Pure module (no DOM, no engine import): rules.js hands it the engine helpers (createTravel), so a day clones,
// replays and runs in Node exactly as in the browser. Everything it remembers lives in the day (s.travel).
//
// act(s, { type: 'travel', to }) moves the player, whoever follows them (Nikhil, the crew) and what they carry,
// runs the world on for TRAVEL_MINUTES of clock, then says where you landed. A refusal is a player line.

/** Game minutes a hop costs. The world keeps running while you're on the way. */
export const TRAVEL_MINUTES = 2;
/** The objective card offers a hop when the thing to do is further than this (metres). */
export const HOP_FROM = 80;
/** Destinations this close are not offered: walk it. */
export const TRAVEL_NEAR = 40;

// Arrival points are on pavement (a kerb or a footpath, or a paved forecourt), clear of every wall in
// verify/world-obstacles.json, picked from the OpenStreetMap data in dist/map/delhi-map.js (see `from`).
// look: what you face on arrival. place: the PLACES id it stands in. edge: where you land instead while a police
// line or a charge holds that place (the side away from the line front).
export const DESTINATIONS = {
  metro: {
    name: 'Rajiv Chowk, Gate 6', mode: 'metro', x: 147.9, z: -291.5, look: { x: 151.6, z: -303.4 }, place: 'metro',
    from: 'PLACES.metro, by OSM metro-gate "Rajiv Chowk Metro Gate No 6" (151.6, -303.4)',
    card: 'Gate 6 se nikle, GPS abhi bhi confused',
    vibe: 'Gate 6 pe sab lost hain',
    arrive: ['Metro se bahar. Network kahan hai?', 'Gate 6. Sab yahin se shuru.', 'Wapas Rajiv Chowk. Deja vu, bhai.'],
  },
  cp: {
    name: 'CP shuttle stop', mode: 'auto', x: 93, z: -193, look: { x: 114, z: -191 }, place: 'cp', edge: { x: 89.5, z: -198.8 },
    from: 'PLACES.cp, the shuttle forecourt below Jeevan Bharti (OSM building at 112.6, -157.6)',
    card: '₹20, aur bhaiya ne gol gol ghumaya',
    vibe: 'Shuttle, chai aur Jeevan Bharti',
    arrive: ['CP. Chai ki khushboo, bus ka dhuaan.', 'Shuttle stop. "Bas aa rahi hai."', 'Wapas CP. Ravi bhaiya, ek chai.'],
  },
  stage: {
    name: 'Jantar Mantar stage', mode: 'auto', x: -46.3, z: 100.9, look: { x: -51, z: 95.5 }, place: 'stage', edge: { x: -46, z: 93 },
    from: 'PLACES.stage, the kerb of Jantar Mantar Road by OSM "Jantar Mantar Protest Site" (-47.7, 95.1)',
    card: '₹20, chaar gaddhe, ek gaana',
    vibe: 'Mic, tent aur naare',
    arrive: ['Stage pe phir mic check.', 'Jantar Mantar. Naare full volume.', 'Aa gaye. Ab scene banega.'],
  },
  barricade: {
    name: 'Sansad Marg barricade', mode: 'paidal', x: -49.5, z: 72.2, look: { x: -51, z: 80 }, place: 'barricade',
    from: 'PLACES.barricade, on the Jantar Mantar Road kerb on the open (north) side of the barricade',
    card: 'Sharma ji ko door se namaste',
    vibe: 'Lohe ki deewar, Sharma ji',
    arrive: ['Barricade. Lohe ki deewar, bhai.', 'Aage jaana? Sharma ji decide karenge.', 'Yahan se aage, mushkil hai.'],
  },
  parliament: {
    name: 'Parliament Street', mode: 'auto', x: -62.2, z: 56.7, look: { x: -58, z: 55 }, place: 'parliament', edge: { x: -54.5, z: 44 },
    from: 'PLACES.parliament, the kerb by OSM "Police Station Parliament Street"',
    card: 'Meter? Kaunsa meter, bhai?',
    vibe: 'Thana, sirens, VIP gaadi',
    arrive: ['Parliament Street. Har gaadi VIP.', 'Thane ke bahar. Selfie mat lena.', 'Yahan sirens hi playlist hain.'],
  },
  palika: {
    name: 'Palika Bazaar', mode: 'paidal', x: 133.4, z: -247.9, look: { x: 132.7, z: -242.4 },
    from: 'OSM shop "Palika Bazaar" (132.9, -247.9), its board at (132.7, -242.4)',
    card: 'Nakli Ray-Ban, asli AC',
    vibe: 'Underground AC, chashme ₹99',
    arrive: ['Palika. "Original hai, kasam se."', 'Neeche AC, upar protest. Choose.', 'Ray-Ban ₹99. Bilkul asli.'],
  },
  centralPark: {
    name: 'Central Park, CP', mode: 'metro', x: 177.9, z: -371.5, look: { x: 177, z: -385 },
    from: 'OSM park "Rajiv Chowk Central Park" (centre 176.7, -385.3), the path on its south side',
    card: 'Bada tiranga, chhota sa picnic',
    vibe: 'Tiranga, ghaas, couples',
    arrive: ['Central Park. Tiranga hil raha.', 'Ghaas pe baitho, koi nahi rokega.', 'Couples, kabootar, aur main.'],
  },
  hanuman: {
    name: 'Hanuman Mandir', mode: 'auto', x: -102.7, z: -230.6, look: { x: -95.5, z: -220.4 },
    from: 'OSM place_of_worship "Prachin Hanuman Mandir" (-95.5, -220.4), the Baba Kharak Singh Marg kerb',
    card: 'Prasad pehle, protest baad mein',
    vibe: 'Ghanti, laddoo, lambi line',
    arrive: ['Mandir. Ghanti baj rahi, laddoo bant rahe.', 'Prasad le lo, hausla free.', 'Jai Bajrangbali. Ab kaam pe.'],
  },
  rivoli: {
    name: 'Rivoli · Mohan Singh Place', mode: 'paidal', x: -24.7, z: -266.4, look: { x: -18.3, z: -263.5 },
    from: 'OSM cinema "PVR Rivoli Cinema" (-18.3, -263.5), by Khadi India and Mohan Singh Place',
    card: 'Coffee House wali chai, purana rate',
    vibe: 'Rivoli, Khadi, Coffee House',
    arrive: ['Rivoli. Poster purane, crowd naya.', 'Coffee House upar. Uncle politics pe.', 'Khadi ke bahar, chai ke paas.'],
  },
  janpath: {
    name: 'Janpath market', mode: 'auto', x: 165, z: 20, look: { x: 171.7, z: 16.4 },
    from: 'eval/delhi.json "janpath-market" (28.6268, 77.2195) projected, on the Janpath kerb',
    card: 'Jhumke ₹100, bargain ₹40',
    vibe: 'Jhumke, kurte, bargaining',
    arrive: ['Janpath. "Dekhne ke paise nahi, didi."', 'Aadha bolo, chal jaayega.', 'Jhumke dekhe, protest bhoole.'],
  },
  bangla: {
    name: 'Bangla Sahib', mode: 'auto', x: -418.8, z: 46.9, look: { x: -442.8, z: 46.2 },
    from: 'OSM "Gurudwara Bangla Sahib Sikh Temple" (-442.8, 46.2), the path in front of it',
    card: 'Langar zindabad, sar pe rumaal',
    vibe: 'Langar chal raha, sab welcome',
    arrive: ['Bangla Sahib. Langar ki khushboo.', 'Sar dhako, pet bharo, phir protest.', 'Yahan sab shaant. Ajeeb lagta hai.'],
  },
  patel: {
    name: 'Patel Chowk metro', mode: 'metro', x: -132.6, z: 244, look: { x: -126.1, z: 243.5 },
    from: 'OSM railway:station "Patel Chowk" (-126.1, 243.5), the kerb outside it',
    card: 'Ek stop, poora drama',
    vibe: 'Metro gate, chai thela',
    arrive: ['Patel Chowk. Sardar Patel dekh rahe.', 'Metro se bahar. Sansad bas aage.', 'Ek stop, poora drama.'],
  },
  shivaji: {
    name: 'Shivaji Stadium terminal', mode: 'auto', x: -61.7, z: -328.9, look: { x: -61.5, z: -331.9 },
    from: 'OSM stop "Shivaji Stadium Terminal" (-61.5, -331.9), the Jain Mandir Marg kerb',
    card: 'Bus terminal, bus gayab',
    vibe: 'Buses idle, conductor bhi',
    arrive: ['Shivaji Stadium. Bus kam, conductor zyada.', '"Aage chalo!" Kahan? Pata nahi.', 'Terminal pe bhi traffic jam.'],
  },
};
export const MODES = { metro: 'Metro', auto: 'E-rickshaw', paidal: 'Paidal shortcut' };

// What can go wrong, in the player's voice (six words or fewer).
const NO = {
  slice: 'Aaj sirf CP. Travel band.',
  over: 'Din khatam, ghar chalo.',
  detained: 'Van se teleport? Pehle chhooto.',
  riding: 'Rickshaw pe ho already, bhai.',
  chased: 'Peeche police hai! Pehle bhaago.',
  pinned: 'Uthak-baithak khatam karo pehle.',
  game: 'Game chal raha hai, ruk.',
  convo: 'Baat beech mein chhodoge?',
  where: 'Yeh jagah map pe nahi.',
  here: 'Bhai, yahin toh ho.',
};
const HAPPENED = {
  'biryani-rush': 'Biryani ki bhagdad', 'bus-key': 'Bus ki chabi gayab', 'bus-stalled': 'Bus atki padi hai',
  'cannon-dance': 'Water cannon mein naach', 'cannon-scare': 'Cannon ka darr', 'cannon-spray': 'Water cannon chala',
  'caught': 'Kisi ko utha liya', 'charge': 'Lathi charge hua', 'chase': 'Police daud rahi thi', 'crew-block': 'Crew ne road roki',
  'detainees-escape': 'Bus se log bhaage', 'faint': 'Koi behosh hua', 'gas': 'Aansu gas chali', 'heat': 'Garmi se haal kharab',
  'kabaddi': 'Police se kabaddi hui', 'minister-noshow': 'Mantri ji nahi aaye', 'provocateur-exposed': 'Nakli banda pakda gaya',
  'provocateur-joined': 'Nakli banda bhadka raha', 'roast': 'Mic pe roast hua', 'singalong': 'Sab ga rahe hain',
  'speaker-party': 'Speaker pe party', 'stone-thrown': 'Pathar chala', 'topi': 'Kisi ki topi udi', 'window-escape': 'Bus ki khidki se bhaaga',
};
const THING = { key: 'Bus ki chabi', speaker: 'Speaker', megaphone: 'Megaphone', phone: 'Phone', water: 'Paani' };
const NAME = (id) => id[0].toUpperCase() + id.slice(1);

/**
 * The travel engine, given rules.js's helpers:
 * { dist, mins, at, say, cue, advance, crowdAt, officerById, allOfficers, OBJECTS? }
 */
export function createTravel(E) {
  const { dist, mins, say, cue, advance, crowdAt, allOfficers } = E;

  /** Why the player can't hop anywhere right now (a NO key), or null. */
  function blocked(s) {
    const pl = s.player;
    if (s.slice) return 'slice'; // the three-minute slice stays near CP
    if (s.over) return 'over';
    if (pl.detained) return 'detained';
    if (pl.riding) return 'riding';
    if (pl.chasedBy) return 'chased';
    if (pl.pinned) return 'pinned';
    if (s.raid || s.action) return 'game';
    if (s.story?.convo) return 'convo';
    return null;
  }
  /** Why the player can't hop to `to`, or null. */
  function why(s, to) {
    const b = blocked(s);
    if (b) return b;
    const d = DESTINATIONS[to];
    if (!d) return 'where';
    if (dist(s.player, d) < 12) return 'here';
    return null;
  }
  // A police line or a charge holds the place: you land at its edge instead, the side away from the line.
  const held = (s, d) => !!d.place && !!d.edge && (s.police.line === d.place || (!!s.police.charge && !s.police.charge.over && s.police.charge.place === d.place));
  /** Where a hop to `to` lands right now. */
  const landing = (s, to) => { const d = DESTINATIONS[to]; return held(s, d) ? { x: d.edge.x, z: d.edge.z, held: true } : { x: d.x, z: d.z, held: false }; };
  /** The destination nearest a point (where the player is hopping from). */
  const nearest = (p) => Object.keys(DESTINATIONS).reduce((a, b) => (dist(p, DESTINATIONS[b]) < dist(p, DESTINATIONS[a]) ? b : a));

  function act(s, cmd) {
    const no = why(s, cmd.to);
    if (no) { say(s, 'player', NO[no], { key: 'travel-no' }); return { ok: false }; }
    const pl = s.player, d = DESTINATIONS[cmd.to], from = nearest(pl), land = landing(s, cmd.to);
    const tr = (s.travel ??= { hops: 0, last: null, been: {} });
    const dx = land.x - pl.x, dz = land.z - pl.z;
    pl.x = land.x; pl.z = land.z;
    // What you carry comes with you; so does whoever is following you.
    if (pl.carrying && s.objects[pl.carrying]) Object.assign(s.objects[pl.carrying], { x: land.x, z: land.z });
    const n = s.people.nikhil;
    if (n && !n.hidden && n.mode === 'follow') Object.assign(n, { x: land.x - 1.2, z: land.z + 1.2, path: [] });
    pl.crew.forEach((id, i) => { const m = s.crew[id]; if (m) Object.assign(m, { x: land.x + Math.cos(i * 2.4) * 1.8, z: land.z + Math.sin(i * 2.4) * 1.8, path: [] }); });
    if (pl.blocking) pl.blocking = null;
    tr.hops++;
    const k = tr.been[cmd.to] = (tr.been[cmd.to] ?? 0) + 1;
    tr.last = { from, to: cmd.to, mode: d.mode, t: s.t, held: land.held, dx, dz };
    // The clock runs on while you're on the way: the world doesn't wait for you.
    advance(s, mins(TRAVEL_MINUTES));
    if (s.over) return { ok: true };
    cue(s, 'travel', { pos: { x: land.x, z: land.z }, data: { from, to: cmd.to, mode: d.mode, held: land.held } });
    // The player's own one-liner on arrival (a bubble over you), a different one each time you come back.
    const line = land.held ? 'Aage police line. Yahin tak.' : d.arrive[(k - 1) % d.arrive.length];
    say(s, 'player', line, { key: 'travel', pos: { x: land.x, z: land.z } });
    return { ok: true };
  }

  /** Every hop on offer: [{ id, cmd }] (affordances() lists them at the player's feet). */
  function affordances(s) {
    if (blocked(s)) return [];
    return Object.keys(DESTINATIONS).filter((id) => dist(s.player, DESTINATIONS[id]) > TRAVEL_NEAR).map((id) => ({ id: `travel:${id}`, cmd: { type: 'travel', to: id } }));
  }

  /** The best hop towards a far target: { to, name, d } (d: what is left to walk), or null if it's near or no hop helps. */
  function hop(s, target, from = HOP_FROM) {
    if (!target || blocked(s)) return null;
    const far = dist(s.player, target);
    if (far <= from) return null;
    let best = null;
    for (const [id, d] of Object.entries(DESTINATIONS)) {
      if (dist(s.player, d) <= TRAVEL_NEAR) continue;
      const left = dist(landing(s, id), target);
      if (left + TRAVEL_NEAR < far && (!best || left < best.d)) best = { to: id, name: d.name, d: left };
    }
    return best;
  }
  /** The objective card, with a hop on it when the card points far away (the HUD says "M: seedha wahan"). */
  function offer(s, card) {
    const h = card ? hop(s, card) : null;
    return h ? { ...card, hop: h } : card;
  }

  /** What is going on at a destination right now, in one line: crowd, set piece, who's there. */
  function live(s, id) {
    const d = DESTINATIONS[id], p = { x: d.x, z: d.z }, bits = [];
    const ch = s.police.charge;
    if (d.place && ch && !ch.over && ch.place === d.place) return { text: 'Lathi charge chal raha hai!', heat: 3 };
    const h = (s.recent || []).filter((r) => s.t - r.t <= mins(10) && dist(r, p) <= 40).sort((a, b) => b.t - a.t)[0];
    let heat = 0;
    if (d.place && s.police.line === d.place) { bits.push('Police line lagi hai'); heat = 2; }
    if (h) { bits.push(HAPPENED[h.kind] ?? 'Kuch toh hua hai'); heat = Math.max(heat, 2); }
    const crowd = d.place ? crowdAt(s, d.place) : 0;
    if (crowd >= 3) { bits.push(`${crowd} log`); heat = Math.max(heat, crowd >= 12 ? 2 : 1); }
    const who = Object.values(s.people).filter((q) => !q.hidden && dist(q, p) <= 25).map((q) => NAME(q.id));
    if (who.length) { bits.push(who.slice(0, 3).join(', ') + (who.length > 3 ? ` +${who.length - 3}` : '')); heat = Math.max(heat, 1); }
    const cops = allOfficers(s).filter((o) => !o.hidden && dist(o, p) <= 25).length;
    if (cops >= 2) bits.push(`${cops} police wale`);
    const loose = Object.entries(s.objects).find(([, o]) => (o.holder === null || o.holder === 'hook' || o.holder === 'cart') && dist(o, p) <= 20);
    if (loose && bits.length < 3) { bits.push(`${THING[loose[0]] ?? loose[0]} pada hai`); heat = Math.max(heat, 1); }
    return bits.length ? { text: bits.slice(0, 3).join(' · '), heat } : { text: d.vibe, heat: 0 };
  }
  /** The travel panel: every destination, how far, whether you can go, and what's on there right now. */
  function board(s) {
    const b = blocked(s);
    return Object.entries(DESTINATIONS).map(([id, d]) => {
      const no = b || (dist(s.player, d) < 12 ? 'here' : null);
      return { id, name: d.name, mode: d.mode, modeName: MODES[d.mode], card: d.card, x: d.x, z: d.z, look: d.look, d: Math.round(dist(s.player, d)), ok: !no, why: no ? NO[no] : null, held: held(s, d), ...live(s, id) };
    });
  }

  return { act, affordances, hop, offer, board, why: (s, to) => { const k = why(s, to); return k ? NO[k] : null; } };
}
