const lineEl = document.getElementById("line");
const choicesEl = document.getElementById("choices");
const wakeEl = document.getElementById("wake");
const talkEl = document.getElementById("talk");
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

let tree = null;
let chipTimer = 0;
let speakGen = 0;
let popGen = 0;
let currentAudio = null;
let rec = null;

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
  const hits = [
    [/food|eat|hungry|brat|perch|bite|pizza|grocery|stefano|indian|spice/, "food"],
    [/move|walk|foot|run/, "move"],
    [/water|lake|swim|surf|splash|harbor/, "water"],
    [/nothing|nowhere|hid|alone|quiet|hush/, "nothing"],
  ];
  for (const [re, id] of hits) {
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
    b.addEventListener("click", () => {
      if (c.href) window.open(c.href, "_blank", "noopener,noreferrer");
      if (c.next) go(c.next);
    });
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

function go(id) {
  popGen += 1;
  stopListen();
  const node = tree.nodes[id];
  if (!node) return;
  bumpLine(node.line);
  choicesEl.hidden = true;
  choicesEl.innerHTML = "";
  speak(node, () => {
    renderChoices(node);
    if (id === tree.start) startListen();
  });
}

function start() {
  wakeEl.remove();
  talkEl.hidden = false;
  go(tree.start);
}

async function boot() {
  tree = await fetch("tree.json").then((r) => r.json());
  const land = tree.nodes[tree.start];
  if (land && land.line) bumpLine(land.line);
  wakeEl.classList.add("show");
  wakeEl.addEventListener("click", start, { once: true });
  talkEl.addEventListener("click", () => {
    if (talkEl.classList.contains("hot")) stopListen();
    else startListen();
  });
}

boot();
