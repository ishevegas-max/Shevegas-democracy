const lineEl = document.getElementById("line");
const choicesEl = document.getElementById("choices");
const wakeEl = document.getElementById("wake");
const talkEl = document.getElementById("talk");
const mapBtn = document.getElementById("mapbtn");
const boardEl = document.getElementById("board");
const placesEl = document.getElementById("places");
const pawnEl = document.getElementById("pawn");
const whooshEl = document.getElementById("whoosh");
const stageEl = document.getElementById("stage");
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

let tree = null;
let chipTimer = 0;
let speakGen = 0;
let popGen = 0;
let currentAudio = null;
let rec = null;
let currentId = null;
let pinsPopped = false;
let walking = false;

const TALK_HITS = [
  [/johnston/, "johnstons"],
  [/oostburg bakery/, "oostburgbakery"],
  [/city bakery/, "citybakery"],
  [/rosa/, "rosas"],
  [/vene|venegas|benny|pancake/, "venes"],
  [/kwik trip|kwikery|quik trip|quick trip|county road j/, "kwiktrip"],
  [/mcdonald|macdonald|micky d|\bcone\b/, "mcdonalds"],
  [/bakery|hard roll/, "bakery"],
  [/oostburg/, "oostburg"],
  [/plymouth/, "plymouth"],
  [/elkhart/, "elkhart"],
  [/cedar grove/, "cedargrove"],
  [/sheboygan falls|\bfalls\b/, "falls"],
  [/kohler/, "kohler"],
  [/the county|other towns|walk the county/, "county"],
  [/il ritrovo|ritrovo|neapolitan/, "ilritrovo"],
  [/stefano stretch|the stretch/, "stefano"],
  [/stefano|trattoria/, "stefanos"],
  [/field to fork|field/, "fieldtofork"],
  [/slo food|grocery|market/, "slofood"],
  [/black pig|\bpig\b/, "blackpig"],
  [/tochi|toshi|ramen/, "tochi"],
  [/umi|sushi|hibachi/, "umi"],
  [/spices|indian/, "indian"],
  [/majerle|wand|black river/, "majerle"],
  [/turk|timber/, "turks"],
  [/bourbon/, "bourbon"],
  [/blast|chester|soft serve|ice cream/, "blast"],
  [/harbor centre|harbour centre|\bmarina\b|broughton/, "marina"],
  [/sheboygan pd|\bspd\b|police|23rd/, "spd"],
  [/city hall|\b828\b|center avenue|centre avenue/, "cityhall"],
  [/bar pizza/, "barpizza"],
  [/pizza|triangle/, "pizza"],
  [/bar food|\bbars\b/, "bars"],
  [/brat/, "brat"],
  [/perch/, "perch"],
  [/lighthouse|the light/, "light"],
  [/wscs|community tv|community television/, "wscs"],
  [/school|campus|university|college|uw|green bay|university drive/, "school"],
  [/925|pelican|rupp|downtown 925/, "n8th925"],
  [/downtown|eighth|8th|going out/, "downtown"],
  [/north/, "north"],
  [/south/, "south"],
  [/map|city|board|sheboygan/, "map"],
  [/food|eat|hungry|bite/, "food"],
  [/move|walk|foot|run|pier|miles/, "move"],
  [/water|lake|swim|surf|splash|harbor|beach/, "water"],
  [/nothing|nowhere|hid|alone|quiet|hush|bench/, "nothing"],
];

function stopAudio() {
  if (!currentAudio) return;
  try { currentAudio.pause(); } catch (_) {}
  currentAudio.src = "";
  currentAudio = null;
}

function stopListen() {
  if (!rec) return;
  try { rec.abort(); } catch (_) {}
  rec = null;
  talkEl.classList.remove("hot");
}

function routeTalk(text) {
  const t = String(text || "").toLowerCase();
  for (const [re, id] of TALK_HITS) {
    if (re.test(t) && tree.nodes[id]) {
      go(id);
      return true;
    }
  }
  return false;
}

function startListen() {
  if (!SpeechRec) return;
  stopListen();
  const r = new SpeechRec();
  rec = r;
  r.lang = "en-US";
  r.interimResults = true;
  r.continuous = false;
  r.maxAlternatives = 3;
  r.onresult = (e) => {
    const last = e.results[e.results.length - 1];
    const said = last[0] && last[0].transcript;
    if (said) bumpLine(said.toUpperCase());
    if (last.isFinal && routeTalk(said)) return;
  };
  r.onend = () => {
    if (rec === r) {
      talkEl.classList.remove("hot");
      rec = null;
    }
  };
  r.onerror = () => talkEl.classList.remove("hot");
  try {
    r.start();
    talkEl.classList.add("hot");
  } catch (_) {}
}

function speak(node, onDone) {
  const gen = ++speakGen;
  let done = false;
  const finish = () => {
    if (done || gen !== speakGen) return;
    done = true;
    if (onDone) onDone();
  };

  stopAudio();
  try { window.speechSynthesis.cancel(); } catch (_) {}

  const playFile = (url) => {
    const a = new Audio(url);
    currentAudio = a;
    a.onended = finish;
    a.onerror = () => tts(node.speak, finish);
    const p = a.play();
    if (p && p.catch) p.catch(() => tts(node.speak, finish));
    clearTimeout(chipTimer);
    chipTimer = setTimeout(finish, 7000);
  };

  if (node && node.audio) {
    playFile(node.audio);
    return;
  }
  tts(node && node.speak, finish);
}

function tts(text, finish) {
  if (!window.speechSynthesis || !text) {
    finish();
    return;
  }
  try { window.speechSynthesis.resume(); } catch (_) {}
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.92;
  u.pitch = 0.85;
  u.lang = "en-US";
  u.onend = finish;
  u.onerror = finish;
  window.speechSynthesis.speak(u);
  const ms = Math.min(8000, Math.max(2200, String(text).length * 90));
  clearTimeout(chipTimer);
  chipTimer = setTimeout(finish, ms);
}

function renderChoices(node) {
  const gen = ++popGen;
  const list = (node && node.choices) || [];
  choicesEl.innerHTML = "";
  choicesEl.classList.toggle("many", list.length > 8);
  if (!list.length) {
    choicesEl.hidden = true;
    return;
  }
  choicesEl.hidden = false;

  const addOne = (i) => {
    if (gen !== popGen) return;
    if (i >= list.length) return;
    const c = list[i];
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = c.label;
    b.addEventListener("click", () => go(c.next));
    choicesEl.appendChild(b);

    let advanced = false;
    const next = () => {
      if (advanced || gen !== popGen) return;
      advanced = true;
      addOne(i + 1);
    };

    if (c.audio) {
      stopAudio();
      const a = new Audio(c.audio);
      currentAudio = a;
      a.onended = next;
      a.onerror = next;
      const p = a.play();
      if (p && p.catch) p.catch(next);
      clearTimeout(chipTimer);
      chipTimer = setTimeout(next, 1800);
    } else {
      setTimeout(next, 280);
    }
  };
  addOne(0);
}

function bumpLine(text) {
  lineEl.hidden = false;
  lineEl.textContent = text || "";
  lineEl.style.animation = "none";
  void lineEl.offsetWidth;
  lineEl.style.animation = "";
}

function boardSpot(id) {
  const node = tree.nodes[id];
  const anchor = (node && node.anchor) || id;
  return (tree.board || []).find((p) => p.id === anchor) || null;
}

function setPawn(spot, instant) {
  if (!spot) return;
  pawnEl.hidden = false;
  if (instant) pawnEl.style.transition = "none";
  pawnEl.style.left = spot.x + "%";
  pawnEl.style.top = spot.y + "%";
  if (instant) {
    void pawnEl.offsetWidth;
    pawnEl.style.transition = "";
  }
}

function markHere(id) {
  const anchor = (tree.nodes[id] && tree.nodes[id].anchor) || id;
  for (const btn of placesEl.querySelectorAll(".place")) {
    btn.classList.toggle("here", btn.dataset.id === anchor);
  }
}

function setMode(mode) {
  stageEl.classList.remove("on-map", "in-place");
  if (mode === "map") stageEl.classList.add("on-map");
  if (mode === "place") stageEl.classList.add("in-place");
  boardEl.hidden = mode === "door";
  mapBtn.hidden = mode !== "place";
  if (mode === "door") {
    choicesEl.hidden = true;
    pawnEl.hidden = true;
  }
}

function paintBoard() {
  placesEl.innerHTML = "";
  for (const p of tree.board || []) {
    if (p.paint === false) continue;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "place";
    b.dataset.id = p.id;
    b.dataset.tone = p.tone || "tangerine";
    b.style.left = p.x + "%";
    b.style.top = p.y + "%";
    b.append(p.label);
    if (p.tag) {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = p.tag;
      b.appendChild(tag);
    }
    b.addEventListener("click", () => go(p.id));
    placesEl.appendChild(b);
  }
}

function walkTo(id, done) {
  const spot = boardSpot(id);
  if (!spot) {
    done();
    return;
  }
  walking = true;
  bumpLine("WHOOSH");
  pawnEl.classList.add("hop");
  boardEl.classList.add("whooshing");
  whooshEl.hidden = false;
  whooshEl.style.animation = "none";
  void whooshEl.offsetWidth;
  whooshEl.style.animation = "";
  setPawn(spot, false);
  setTimeout(() => {
    pawnEl.classList.remove("hop");
    boardEl.classList.remove("whooshing");
    whooshEl.hidden = true;
    walking = false;
    done();
  }, 580);
}

function showMap(opts) {
  const first = !!(opts && opts.first);
  popGen += 1;
  stopAudio();
  try { window.speechSynthesis.cancel(); } catch (_) {}
  currentId = "map";
  setMode("map");
  choicesEl.hidden = true;
  choicesEl.innerHTML = "";
  bumpLine(tree.nodes.map.line);
  const home = (tree.board || []).find((p) => p.id === "downtown") || tree.board[0];
  setPawn(home, !(opts && opts.keepPawn));
  markHere("downtown");
  pawnEl.hidden = false;
  if (first && !pinsPopped) staggerPins();
  startListen();
}

function staggerPins() {
  pinsPopped = true;
  const gen = popGen;
  const land = tree.nodes.land;
  const pins = (land.choices || []).filter((c) => c.audio);
  let i = 0;
  const step = () => {
    if (gen !== popGen || currentId !== "map") return;
    if (i >= pins.length) return;
    const c = pins[i++];
    const el = placesEl.querySelector('.place[data-id="' + c.next + '"]');
    if (el) {
      el.classList.remove("bam");
      void el.offsetWidth;
      el.classList.add("bam");
    }
    stopAudio();
    const a = new Audio(c.audio);
    currentAudio = a;
    const next = () => {
      if (gen !== popGen) return;
      step();
    };
    a.onended = next;
    a.onerror = next;
    const p = a.play();
    if (p && p.catch) p.catch(next);
    clearTimeout(chipTimer);
    chipTimer = setTimeout(next, 1800);
  };
  step();
}

function arrive(id) {
  const node = tree.nodes[id];
  currentId = id;
  setMode("place");
  bumpLine(node.line);
  markHere(id);
  const spot = boardSpot(id);
  if (spot) setPawn(spot, true);
  speak(node, () => {
    renderChoices(node);
    startListen();
  });
}

function go(id) {
  if (walking) return;
  popGen += 1;
  stopListen();
  const node = tree.nodes[id];
  if (!node) return;

  if (id === "map" || node.hub) {
    if (currentId && currentId !== "map" && currentId !== "land") {
      walkTo("downtown", () => showMap({ first: false, keepPawn: true }));
    } else {
      showMap({ first: false });
    }
    return;
  }

  if (id === tree.start) {
    currentId = id;
    setMode("door");
    bumpLine(node.line);
    speak(node, () => showMap({ first: true }));
    return;
  }

  const from = currentId;
  const shouldWalk = from && from !== id && from !== "land";
  if (shouldWalk) {
    walkTo(id, () => arrive(id));
  } else {
    arrive(id);
  }
}

function start() {
  wakeEl.remove();
  talkEl.hidden = false;
  go(tree.start);
}

async function boot() {
  tree = await fetch("tree.json").then((r) => r.json());
  paintBoard();
  const land = tree.nodes[tree.start];
  if (land && land.line) bumpLine(land.line);
  wakeEl.classList.add("show");
  wakeEl.addEventListener("click", start, { once: true });
  talkEl.addEventListener("click", () => {
    if (talkEl.classList.contains("hot")) stopListen();
    else startListen();
  });
  mapBtn.addEventListener("click", () => go("map"));
  const light = document.getElementById("lighthouse");
  if (light) light.addEventListener("click", () => go("light"));
  const ktCounty = document.getElementById("kt-county");
  if (ktCounty) ktCounty.addEventListener("click", () => go("countykt"));
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

boot();
