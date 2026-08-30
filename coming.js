(function () {
  const lineEl = document.getElementById("line");
  const stillEl = document.getElementById("still");
  const wakeEl = document.getElementById("wake");
  const stageEl = document.getElementById("stage");

  // Copy loop. still: drop Michael's photo at that path. Missing files stay off — splash holds.
  const LINES = [
    { text: "SHEVEGAS", tone: "tone-id", slam: true, still: null },
    { text: "THIS IS SHEBOYGAN COUNTY", tone: "tone-gold", long: true, still: "stills/county.jpg" },
    { text: "THE GAME IS COMING", tone: "tone-pink", still: null },
    { text: "FOOD  ·  MOVE  ·  WATER  ·  NOTHING", tone: "tone-tangerine", long: true, still: "stills/food.jpg" },
    { text: "KWIK TRIP TO STEFANO'S", tone: "tone-coral", long: true, still: "stills/kwik-trip.jpg" },
    { text: "WALK IT", tone: "tone-lime", still: "stills/walk.jpg" },
    { text: "BE YOUR OWN SUPERHERO", tone: "tone-hero", long: true, still: null },
  ];

  const IDS = [
    "clips/door-bite.m4a",
    "clips/sale-food.m4a",
    "clips/sale-move.m4a",
    "clips/sale-water.m4a",
    "clips/sale-nothing.m4a",
  ];

  const ZIP_IN = 580;
  const ZIP_OUT = 400;

  let lineIndex = 0;
  let idIndex = 0;
  let audioOn = false;
  let idReady = true;
  let currentAudio = null;
  let looping = false;
  const missingStill = Object.create(null);

  const bank = IDS.map(function (src) {
    const a = new Audio(src);
    a.preload = "auto";
    a.playsInline = true;
    return a;
  });

  function wait(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function holdMs() {
    return 4000 + Math.floor(Math.random() * 3001);
  }

  function silenceMs() {
    return 5500 + Math.floor(Math.random() * 4001);
  }

  function stopAudio() {
    if (!currentAudio) return;
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch (_) {}
    currentAudio = null;
  }

  function playId() {
    if (!audioOn || !idReady) return;
    const a = bank[idIndex % bank.length];
    idIndex += 1;
    idReady = false;
    stopAudio();
    try { a.currentTime = 0; } catch (_) {}
    currentAudio = a;
    const p = a.play();
    if (p && p.catch) {
      p.catch(function () {
        audioOn = false;
        currentAudio = null;
        idReady = true;
        wakeEl.hidden = false;
      });
    }
    a.onended = function () {
      if (currentAudio === a) currentAudio = null;
      setTimeout(function () { idReady = true; }, silenceMs());
    };
  }

  function hideStill() {
    stillEl.classList.remove("in", "out");
    stillEl.hidden = true;
    stillEl.removeAttribute("src");
    stageEl.classList.remove("has-still");
  }

  function armStill(src) {
    if (!src || missingStill[src]) {
      hideStill();
      return;
    }
    stillEl.classList.remove("in", "out");
    stillEl.onload = function () {
      stillEl.hidden = false;
      stageEl.classList.add("has-still");
      void stillEl.offsetWidth;
      stillEl.classList.add("in");
    };
    stillEl.onerror = function () {
      missingStill[src] = true;
      hideStill();
    };
    if (stillEl.getAttribute("src") === src) {
      stillEl.hidden = false;
      stageEl.classList.add("has-still");
      void stillEl.offsetWidth;
      stillEl.classList.add("in");
      return;
    }
    stillEl.src = src;
  }

  function paint(item) {
    const classes = ["line", item.tone];
    if (item.long) classes.push("long");
    if (item.slam) classes.push("slam");
    lineEl.className = classes.join(" ");
    lineEl.textContent = item.text;
    void lineEl.offsetWidth;
    lineEl.classList.add("in");
    armStill(item.still);
  }

  function zipOut() {
    lineEl.classList.remove("in");
    lineEl.classList.add("out");
    if (!stillEl.hidden) {
      stillEl.classList.remove("in");
      stillEl.classList.add("out");
    }
  }

  async function loop() {
    if (looping) return;
    looping = true;
    while (true) {
      const item = LINES[lineIndex % LINES.length];
      lineIndex += 1;
      paint(item);
      playId();
      const total = holdMs();
      await wait(Math.max(ZIP_IN + 200, total - ZIP_OUT));
      zipOut();
      await wait(ZIP_OUT);
      lineEl.classList.remove("out");
      stillEl.classList.remove("out");
    }
  }

  wakeEl.addEventListener("click", function () {
    audioOn = true;
    wakeEl.hidden = true;
    playId();
  });

  loop();
})();
