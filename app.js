/* ══════════════════════════════════════════════
   RollTogether — Lógica principal
   ══════════════════════════════════════════════ */

import { initializeApp } from "firebase/app";
import {
  getDatabase, ref, push, onValue, onChildAdded,
  set, remove, onDisconnect, serverTimestamp, get,
  query, limitToLast
} from "firebase/database";

// ─── Firebase ────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyC2P8eH2eSTLmhf60X-erQ6zu_dfgQmgtM",
  authDomain:        "rolagem-de-dados-pirata.firebaseapp.com",
  databaseURL:       "https://rolagem-de-dados-pirata-default-rtdb.firebaseio.com",
  projectId:         "rolagem-de-dados-pirata",
  storageBucket:     "rolagem-de-dados-pirata.firebasestorage.app",
  messagingSenderId: "819422167197",
  appId:             "1:819422167197:web:65c0851275027cb15fd474"
};
const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ─── Estado global ────────────────────────────────────────────────────────────
let player = "", room = "";
let currentPlayerIcon = "🎲";
const uid = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
let feedUnsub = null, onlineUnsub = null, rollCommandsUnsub = null;
let allRolls = [], activeFilter = "all", modifier = 0;
let lastRollId = null;

// ─── Definição dos Dados ──────────────────────────────────────────────────────
const DICE = [
  { id:"d4",   sides:4,   label:"D4"   },
  { id:"d6",   sides:6,   label:"D6"   },
  { id:"d8",   sides:8,   label:"D8"   },
  { id:"d10",  sides:10,  label:"D10"  },
  { id:"d12",  sides:12,  label:"D12"  },
  { id:"d20",  sides:20,  label:"D20"  },
  { id:"d100", sides:100, label:"D100" }
];
let counts = Object.fromEntries(DICE.map(d => [d.id, 0]));

const RPG_ICONS = [
  "🧙","🧝","🧌","🧚","🧛","🧞","🐉","🗡️","🛡️","🏹","🔮","⚔️",
  "🪄","🐺","🦇","👹","👺","💀","🕯️","📜","🏺","⛓️","🔥","❄️",
  "🌿","🍻","🎭","🏰","⚜️","🐲"
];

// ─── Dice Box 3D ──────────────────────────────────────────────────────────────
let Box = null;
let boxReady = false;
let _hasRolled = false;

async function destroyDiceBox() {
  if (!Box) return;
  try { Box.clear?.(); Box.destroy?.(); } catch (e) { console.warn("Erro destruindo DiceBox:", e); }
  Box = null; boxReady = false; _hasRolled = false;
  const container = document.getElementById("dice-box-container");
  if (container) {
    container.querySelectorAll("canvas").forEach(c => c.remove());
    container.classList.remove("rolling");
  }
}



// ─── Temas de dados ────────────────────────────────────────────────────────────
const DICE_THEMES = [
  { id:"black",       name:"Obsidiana",       colorset:"black",       surface:"stainless", preview:"#111" },
  { id:"white",       name:"Marfim",          colorset:"white",       surface:"default",   preview:"#f0f0e8" },
  { id:"fire",        name:"Fogo",            colorset:"fire",        surface:"default",   preview:"linear-gradient(135deg,#e03030,#f8a020)" },
  { id:"ice",         name:"Gelo",            colorset:"ice",         surface:"default",   preview:"linear-gradient(135deg,#a8d5e2,#5090c0)" },
  { id:"necrotic",    name:"Necrótico",       colorset:"necrotic",    surface:"stainless", preview:"linear-gradient(135deg,#1a0a2a,#6a3080)" },
  { id:"bloodmoon",   name:"Lua de Sangue",   colorset:"bloodmoon",   surface:"default",   preview:"linear-gradient(135deg,#7a1212,#c03030)" },
  { id:"starynight",  name:"Noite Estrelada", colorset:"starynight",  surface:"default",   preview:"linear-gradient(135deg,#0a0a2a,#2030a0)" },
  { id:"bronze",      name:"Bronze",          colorset:"bronze",      surface:"stainless", preview:"linear-gradient(135deg,#8b5010,#c8941a)" },
  { id:"dragons",     name:"Dragões",         colorset:"dragons",     surface:"default",   preview:"linear-gradient(135deg,#1a3a10,#40a020)" },
  { id:"astralsea",   name:"Mar Astral",      colorset:"astralsea",   surface:"default",   preview:"linear-gradient(135deg,#0a1a3a,#4080c0)" },
  { id:"glitterparty",name:"Glitter",         colorset:"glitterparty",surface:"default",   preview:"linear-gradient(135deg,#c020c0,#ff80ff)" },
  { id:"water",       name:"Água",            colorset:"water",       surface:"default",   preview:"linear-gradient(135deg,#0a3060,#20a0d0)" },
  { id:"earth",       name:"Terra",           colorset:"earth",       surface:"default",   preview:"linear-gradient(135deg,#3a2010,#806030)" },
  { id:"force",       name:"Força",           colorset:"force",       surface:"default",   preview:"linear-gradient(135deg,#101030,#3030a0)" },
  { id:"psychic",     name:"Psíquico",        colorset:"psychic",     surface:"default",   preview:"linear-gradient(135deg,#400060,#c040ff)" },
  { id:"tigerking",   name:"Tigre",           colorset:"tigerking",   surface:"default",   preview:"linear-gradient(135deg,#c06010,#f0a830)" },
];
let currentThemeId = "black";

async function applyTheme(themeId) {
  const theme = DICE_THEMES.find(t => t.id === themeId);
  if (!theme) return;
  currentThemeId = themeId;
  document.querySelectorAll('.theme-opt').forEach(el => {
    el.classList.toggle('active', el.dataset.themeId === themeId);
  });
  if (Box && boxReady) {
    try { await Box.updateConfig({ theme_colorset: theme.colorset, theme_surface: theme.surface }); }
    catch(e) { console.warn('Falha ao atualizar tema:', e); }
  }
}

function buildThemeGrid() {
  const grid = document.getElementById('theme-grid');
  if (!grid) return;
  grid.innerHTML = DICE_THEMES.map(t => `
    <div class="theme-opt ${t.id === currentThemeId ? 'active' : ''}" data-theme-id="${t.id}" role="button" tabindex="0" aria-label="Tema ${t.name}">
      <div class="theme-opt-preview" style="background:${t.preview}"></div>
      <div class="theme-opt-name">${t.name}</div>
    </div>
  `).join('');
  grid.querySelectorAll('.theme-opt').forEach(el => {
    el.addEventListener('click', () => applyTheme(el.dataset.themeId));
    el.addEventListener('keypress', e => { if (e.key === 'Enter' || e.key === ' ') applyTheme(el.dataset.themeId); });
  });
}

const toggleBtn     = document.getElementById('theme-toggle-btn');
const backdropModal = document.getElementById('theme-modal-backdrop');
const closeModalBtn = document.getElementById('theme-modal-close');
if (toggleBtn)    toggleBtn.addEventListener('click', e => { e.stopPropagation(); buildThemeGrid(); backdropModal.classList.add('open'); });
if (closeModalBtn) closeModalBtn.addEventListener('click', () => backdropModal.classList.remove('open'));
if (backdropModal) backdropModal.addEventListener('click', e => { if (e.target === backdropModal) backdropModal.classList.remove('open'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') backdropModal?.classList.remove('open'); });

// ─── Dice Box init ─────────────────────────────────────────────────────────────
async function initDiceBox() {
  try {
    const DiceBoxClass = window.DiceBoxThreejs ?? window["dice-box-threejs"] ?? window.DiceBox ?? null;
    if (!DiceBoxClass) throw new Error("DiceBox UMD não encontrado.");
    Box = new DiceBoxClass("#dice-box-container", {
      assetPath: "./assets/dice/", gravity_multiplier: 400, light_intensity: 1.0,
      baseScale: 100, strength: 1.2, shadows: false, sounds: false,
      theme_colorset: "black", theme_surface: "stainless", color_spotlight: 0xf0d090
    });
    await Box.initialize();
    const initTheme = DICE_THEMES.find(t => t.id === currentThemeId);
    if (initTheme) await Box.updateConfig({ theme_colorset: initTheme.colorset, theme_surface: initTheme.surface }).catch(e=>console.warn(e));
    boxReady = true;
    hideStatus();
  } catch (err) { console.warn("DiceBox falhou", err); boxReady = false; }
}

// Rola múltiplos grupos de dados no dice-box-threejs.
async function rollDice3D(segments) {
  if (!segments || segments.length === 0) return;
  if (segments.length === 1) return Box.roll(segments[0]);
  await Box.roll(segments[0]);
  for (let i = 1; i < segments.length; i++) await Box.add(segments[i]);
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
function setStatus(icon, txt) {
  const el = document.getElementById("dice-status");
  if (el) { el.innerHTML = `<span class="status-icon">${icon}</span><span class="status-txt">${txt}</span>`; el.classList.remove("gone"); }
}
function hideStatus() { const el = document.getElementById("dice-status"); if (el) el.classList.add("gone"); }

const $ = id => document.getElementById(id);

function showToast(msg, duration = 1800) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), duration);
}

function screen(id) {
  ["screen-name","screen-lobby","screen-room"].forEach(s => $(s).style.display = s === id ? "block" : "none");
  const hero = document.querySelector('.hero');
  if (hero) hero.style.display = id === 'screen-room' ? 'none' : 'block';
}

function esc(s) {
  return String(s||"").replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
}

function ago(ts) {
  if (!ts) return "";
  const s = Math.round((Date.now()-ts)/1000);
  if (s<60) return "agora";
  if (s<3600) return `${Math.floor(s/60)}min`;
  return `${Math.floor(s/3600)}h`;
}

function showResult(total, label) {
  const f = $("result-floater"), l = $("result-label");
  if (!f || !l) return;
  f.textContent = total; l.textContent = label;
  f.className = ""; l.className = "";
  void f.offsetWidth;
  f.classList.add("show"); l.classList.add("show");
  setTimeout(() => {
    f.classList.replace("show","hide");
    l.classList.replace("show","hide");
    setTimeout(() => { f.className = ""; l.className = ""; }, 600);
  }, 2200);
}

// ─── Dados: render e seleção ──────────────────────────────────────────────────
function renderDice() {
  const g = $("dice-grid"); if (!g) return;
  g.innerHTML = DICE.map(d => `
    <button class="die-runa ${counts[d.id]>0?"selected":""}" data-id="${d.id}"
      aria-label="${d.label}${counts[d.id]>0?' ('+counts[d.id]+' selecionado)':''}"
      aria-pressed="${counts[d.id]>0}">
      <span class="die-emoji"><img src="./img/${d.id}.png" alt="${d.label}" class="die-img" loading="lazy"></span>
      <span class="die-label">${d.label}</span>
      <span class="die-qty-runa" aria-hidden="true">${counts[d.id]}</span>
      <span class="die-minus" data-minus="${d.id}" role="button" aria-label="Remover um ${d.label}" tabindex="-1">−</span>
    </button>`).join("");

  g.querySelectorAll(".die-runa").forEach(el => el.addEventListener("click", e => {
    if (e.target.classList.contains("die-minus")) return;
    counts[el.dataset.id]++; renderDice(); updateFormula();
  }));
  g.querySelectorAll(".die-runa").forEach(el => el.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); counts[el.dataset.id]++; renderDice(); updateFormula(); }
  }));
  g.querySelectorAll(".die-minus").forEach(el => el.addEventListener("click", e => {
    e.stopPropagation();
    const id = el.dataset.minus;
    if (counts[id] > 0) { counts[id]--; renderDice(); updateFormula(); }
  }));
}

function updateFormula() {
  const parts = DICE.filter(d => counts[d.id] > 0).map(d => `${counts[d.id]}${d.id}`);
  let t = parts.join(" + ");
  if (modifier !== 0) t += modifier > 0 ? ` + ${modifier}` : ` − ${Math.abs(modifier)}`;
  $("formula-display").innerHTML = t || "<em>Selecione os dados</em>";
}

function clearAll() {
  DICE.forEach(d => counts[d.id] = 0);
  modifier = 0; updateModDisplay(); renderDice(); updateFormula();
  if (Box && boxReady && _hasRolled) { try { Box.clear?.(); } catch(e) {} }
}

function updateModDisplay() {
  const el = $("mod-display");
  el.textContent = modifier === 0 ? "+0" : (modifier > 0 ? `+${modifier}` : `${modifier}`);
  el.className = "mod-valor" + (modifier > 0 ? " positive" : modifier < 0 ? " negative" : "");
}

// ─── Lógica de sala ────────────────────────────────────────────────────────────
async function getAvailableIcon(roomCode, currentUid) {
  const onlineRef = ref(db, `rooms/${roomCode}/online`);
  const snapshot = await get(onlineRef);
  const usedIcons = new Set();
  if (snapshot.exists()) Object.entries(snapshot.val()).forEach(([id, info]) => {
    if (id !== currentUid && info.icon) usedIcons.add(info.icon);
  });
  const available = RPG_ICONS.filter(icon => !usedIcons.has(icon));
  return available.length ? available[Math.floor(Math.random() * available.length)] : "🎲";
}

function computeStats(rolls) {
  $("stat-total").textContent = rolls.length;
  $("stat-highest").textContent = rolls.length ? Math.max(...rolls.map(r => r.total ?? 0)) : 0;
  $("stat-crits").textContent = rolls.filter(r => r.isCrit).length;
}

function parseBreakdownChips(breakdown) {
  const chips = [];
  if (!breakdown) return chips;
  const parts = breakdown.split(",").map(s => s.trim());
  for (const p of parts) {
    const modMatch = p.match(/^mod=([+\-]\d+)$/);
    if (modMatch) { chips.push({ name: "Mod", val: modMatch[1], isMod: true }); continue; }
    const dieMatch = p.match(/^(d\d+(?:\([^)]+\))?)=(.+)$/i);
    if (dieMatch) { chips.push({ name: dieMatch[1].replace(/\(.*\)/,""), val: dieMatch[2] }); continue; }
    const d100Match = p.match(/^d100=\((.+)\)→(\d+)$/);
    if (d100Match) { chips.push({ name: "d100", val: d100Match[2] }); continue; }
  }
  return chips;
}

function renderFeed() {
  let items = [...allRolls];
  if (activeFilter === "mine")  items = items.filter(r => r.uid === uid);
  if (activeFilter === "crits") items = items.filter(r => r.isCrit);
  const feed = $("feed-list");
  if (!items.length) { feed.innerHTML = '<div class="feed-empty">📜 Nenhuma rolagem ainda. O destino espera!</div>'; return; }
  feed.innerHTML = items.slice().reverse().map(r => {
    const chips = parseBreakdownChips(r.breakdown);
    const chipsHtml = chips.length ? `
      <div class="feed-breakdown-visual">
        ${chips.map(c => `<div class="feed-chip ${c.isMod ? 'mod-chip' : ''}">
          <span class="feed-chip-name">${esc(c.name)}</span>
          <span class="feed-chip-val">${esc(c.val)}</span>
        </div>`).join('')}
      </div>` : `<div style="font-size:11px;opacity:0.45;margin-top:4px">${esc(r.breakdown)}</div>`;
    const ts = r.ts ? new Date(r.ts).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'}) : '';
    return `<div class="feed-item ${r.isCrit?'is-crit':''} ${r.uid===uid?'is-mine':''}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
        <span style="font-size:13px">${r.playerIcon||'🎭'} <strong>${esc(r.player)}</strong>
          ${r.isCrit?'<span class="badge-rpg">CRÍTICO</span>':''}
          ${r.isFumb?'<span class="badge-rpg">FUMBLE</span>':''}
          ${r.uid===uid?'<span class="badge-rpg">VOCÊ</span>':''}
        </span>
        <span class="feed-timestamp">${ts}</span>
      </div>
      ${chipsHtml}
      <div class="feed-total-line">
        <span class="feed-total-num">${r.total}</span>
        <span class="feed-formula-small">${esc(r.formula)}</span>
      </div>
    </div>`;
  }).join('');
}

function initFeed(roomCode) {
  if (feedUnsub) feedUnsub();
  const rollsRef = query(ref(db, "rooms/" + roomCode + "/rolls"), limitToLast(50));
  let seenKeys = new Set(); let ready = false;
  const unsubVal = onValue(rollsRef, snap => {
    seenKeys = new Set(); allRolls = [];
    if (snap.exists()) snap.forEach(c => { seenKeys.add(c.key); allRolls.push({ ...c.val(), _key: c.key }); });
    computeStats(allRolls); renderFeed(); ready = true;
  });
  const unsubChild = onChildAdded(rollsRef, snap => {
    if (!ready || seenKeys.has(snap.key)) return;
    seenKeys.add(snap.key);
    const newRoll = { ...snap.val(), _key: snap.key };
    allRolls.push(newRoll); computeStats(allRolls); renderFeed();
    if (lastRollId !== snap.key) {
      lastRollId = snap.key;
      setTimeout(() => showResult(newRoll.total, newRoll.isCrit ? "✦ CRÍTICO! ✦" : newRoll.isFumb ? "☠ FUMBLE ☠" : newRoll.formula), 100);
    }
  });
  feedUnsub = () => { unsubVal(); unsubChild(); };
}

function initOnline(roomCode) {
  if (onlineUnsub) onlineUnsub();
  onlineUnsub = onValue(ref(db, `rooms/${roomCode}/online`), snap => {
    const playersData = snap.val() || {};
    $("online-count").textContent = Object.keys(playersData).length;
    const container = document.getElementById("online-players-list");
    if (container) container.innerHTML = Object.entries(playersData).map(([id, data]) =>
      `<div class="player-icon-badge"><span>${data.icon||"🎲"}</span><span>${esc(data.name||"Anônimo")}</span></div>`
    ).join('');
  });
}

function initRollCommands(roomCode) {
  if (rollCommandsUnsub) rollCommandsUnsub();
  const commandsRef = ref(db, `rooms/${roomCode}/rollCommands`);
  rollCommandsUnsub = onChildAdded(commandsRef, async (snap) => {
    const cmd = snap.val();
    if (!cmd || cmd.uid === uid) return;
    if (boxReady && Box) {
      try {
        setStatus(cmd.playerIcon || "🎲", `${cmd.player} está rolando dados...`);
        $("dice-box-container").classList.add("rolling");
        const segs = Array.isArray(cmd.syncSegments) ? cmd.syncSegments : [cmd.syncSegments || cmd.syncNotation || "1d6"];
        await rollDice3D(segs);
        hideStatus();
        setTimeout(() => $("dice-box-container").classList.remove("rolling"), 800);
      } catch(e) {
        console.warn("Erro ao animar rolagem remota:", e);
        hideStatus(); $("dice-box-container").classList.remove("rolling");
      } finally {
        await remove(ref(db, `rooms/${roomCode}/rollCommands/${snap.key}`)).catch(()=>{});
      }
    }
  });
}

// ─── Entrar / criar sala ───────────────────────────────────────────────────────
async function enterRoom(code) {
  await cleanAllEmptyRooms();
  if (feedUnsub) feedUnsub();
  if (onlineUnsub) onlineUnsub();
  if (rollCommandsUnsub) rollCommandsUnsub();
  await destroyDiceBox();
  room = code;
  const chosenIcon = await getAvailableIcon(room, uid);
  currentPlayerIcon = chosenIcon;
  const onRef = ref(db, `rooms/${code}/online/${uid}`);
  await set(onRef, { name: player, ts: serverTimestamp(), icon: chosenIcon });
  onDisconnect(onRef).remove();
  $("display-name").textContent = player;
  $("display-room-code").textContent = code;
  clearAll(); allRolls = []; activeFilter = "all";
  screen("screen-room");
  initFeed(code); initOnline(code); initRollCommands(code);
  requestAnimationFrame(async () => { await initDiceBox(); });
}

async function createRoom() {
  const gen = () => {
    const L="ABCDEFGHJKLMNPQRSTUVWXYZ", D="23456789"; let c="";
    for(let i=0;i<3;i++) c+=L[Math.floor(Math.random()*L.length)];
    for(let i=0;i<3;i++) c+=D[Math.floor(Math.random()*D.length)];
    return c;
  };
  let code = gen(), snap = await get(ref(db, `rooms/${code}`));
  while (snap.exists()) { code = gen(); snap = await get(ref(db, `rooms/${code}`)); }
  await enterRoom(code);
}

async function joinRoom() {
  const code = $("input-room-code").value.trim().toUpperCase();
  if (code.length !== 6) return;
  await enterRoom(code);
}

async function leaveRoom() {
  const oldRoom = room;
  if (room) await remove(ref(db, `rooms/${room}/online/${uid}`));
  if (feedUnsub) feedUnsub();
  if (onlineUnsub) onlineUnsub();
  if (rollCommandsUnsub) rollCommandsUnsub();
  await destroyDiceBox();
  await cleanupRoom(oldRoom);
  room = "";
  screen("screen-lobby");
}

async function cleanupRoom(roomCode) {
  if (!roomCode) return;
  try {
    const onlineRef = ref(db, `rooms/${roomCode}/online`);
    const snap = await get(onlineRef);
    if (!snap.exists()) { console.log("Sala removida:", roomCode); await remove(ref(db, `rooms/${roomCode}`)); }
  } catch (err) { console.warn("Erro limpando sala:", err); }
}

async function cleanAllEmptyRooms() {
  try {
    const snap = await get(ref(db, "rooms"));
    if (!snap.exists()) return;
    const rooms = snap.val();
    for (const roomId in rooms) {
      const online = rooms[roomId].online || {};
      if (Object.keys(online).length === 0) {
        console.log("🗑️ Removendo sala vazia:", roomId);
        await remove(ref(db, `rooms/${roomId}`));
      }
    }
  } catch (err) { console.warn("Erro limpando salas:", err); }
}
window.cleanAllEmptyRooms = cleanAllEmptyRooms;

async function resetName() {
  const oldRoom = room;
  if (room) await remove(ref(db, `rooms/${room}/online/${uid}`));
  if (feedUnsub) feedUnsub();
  if (onlineUnsub) onlineUnsub();
  if (rollCommandsUnsub) rollCommandsUnsub();
  await destroyDiceBox();
  await cleanupRoom(oldRoom);
  room = "";
  $("input-name").value = "";
  $("input-room-code").value = "";
  screen("screen-name");
}

// ─── Rolagem ───────────────────────────────────────────────────────────────────
function rollD100Single() {
  const tens  = Math.floor(Math.random() * 10);
  const units = Math.floor(Math.random() * 10);
  const total = (tens === 0 && units === 0) ? 100 : tens * 10 + units;
  const tensVisual  = tens  === 0 ? 10 : tens;
  const unitsVisual = units === 0 ? 10 : units;
  return { total, tensVisual, unitsVisual, tens, units };
}

function generateResults(sel) {
  const results = [];
  for (const d of sel) {
    const n = counts[d.id];
    for (let i = 0; i < n; i++) {
      if (d.id === "d100") {
        const r = rollD100Single();
        results.push({
          dieId: "d100", sides: 100, val: r.total,
          tensVisual: r.tensVisual, unitsVisual: r.unitsVisual,
          breakdown: `d100=(${r.tens===0?'00':r.tens*10}+${r.units})→${r.total}`
        });
      } else {
        const val = Math.floor(Math.random() * d.sides) + 1;
        results.push({ dieId: d.id, sides: d.sides, val, breakdown: `${d.id}=${val}` });
      }
    }
  }
  return results;
}

function buildSyncNotation(results) {
  const expanded = [];
  for (const r of results) {
    if (r.dieId === "d100") {
      expanded.push({ sides: 10, val: r.tensVisual });
      expanded.push({ sides: 10, val: r.unitsVisual });
    } else {
      expanded.push({ sides: r.sides, val: r.val });
    }
  }
  const groups = new Map();
  for (const item of expanded) {
    if (!groups.has(item.sides)) groups.set(item.sides, []);
    groups.get(item.sides).push(item.val);
  }
  const segments = [];
  for (const [sides, vals] of groups.entries()) segments.push(`${vals.length}d${sides}@${vals.join(",")}`);
  return segments;
}

async function roll() {
  if (!room) return;
  const sel = DICE.filter(d => counts[d.id] > 0);
  if (!sel.length) {
    const el = $("formula-display");
    el.style.animation = "shake 0.4s ease";
    setTimeout(() => el.style.animation = "", 500);
    return;
  }
  const rollBtn = $("roll-btn");
  rollBtn.disabled = true;

  try {
    const results = generateResults(sel);
    const syncNotation = buildSyncNotation(results);
    const formulaStr = sel.map(d => `${counts[d.id]}${d.id}`).join("+") +
      (modifier !== 0 ? (modifier > 0 ? `+${modifier}` : `${modifier}`) : "");

    await push(ref(db, `rooms/${room}/rollCommands`), {
      uid, player, playerIcon: currentPlayerIcon,
      syncSegments: syncNotation, ts: serverTimestamp()
    });

    setStatus(currentPlayerIcon, "Rolando dados...");
    $("dice-box-container").classList.add("rolling");

    if (boxReady && Box) await rollDice3D(syncNotation);

    const totalDice = results.reduce((s, r) => s + r.val, 0);
    const total     = totalDice + modifier;
    const breakdown = results.map(r => r.breakdown).join(", ") +
      (modifier !== 0 ? `, mod=${modifier > 0 ? "+" : ""}${modifier}` : "");

    const isSingleNonD100 = results.length === 1 && results[0].dieId !== "d100";
    const isCrit = isSingleNonD100 && results[0].val === results[0].sides;
    const isFumb = isSingleNonD100 && results[0].val === 1;
    const isSingleD100  = results.length === 1 && results[0].dieId === "d100";
    const isCritD100    = isSingleD100 && results[0].val === 100;
    const isFumbD100    = isSingleD100 && results[0].val === 1;
    const finalIsCrit = isCrit || isCritD100;
    const finalIsFumb = isFumb || isFumbD100;

    const newRollRef = await push(ref(db, `rooms/${room}/rolls`), {
      player, playerIcon: currentPlayerIcon,
      formula: formulaStr, breakdown, total,
      isCrit: finalIsCrit, isFumb: finalIsFumb, uid,
      ts: serverTimestamp()
    });
    lastRollId = newRollRef.key;
    showResult(total, finalIsCrit ? "✦ CRÍTICO! ✦" : finalIsFumb ? "☠ FUMBLE ☠" : formulaStr);
    _hasRolled = true;

  } catch(err) {
    console.error("Erro na rolagem:", err);
  } finally {
    rollBtn.disabled = false;
    setTimeout(() => $("dice-box-container").classList.remove("rolling"), 800);
    hideStatus();
  }
}

// ─── Event listeners ───────────────────────────────────────────────────────────
$("roll-btn").onclick = roll;
$("clear-btn").onclick = clearAll;
$("mod-plus").onclick  = () => { modifier++; updateModDisplay(); updateFormula(); };
$("mod-minus").onclick = () => { modifier--; updateModDisplay(); updateFormula(); };
$("mod-reset").onclick = () => { modifier = 0; updateModDisplay(); updateFormula(); };

$("btn-name-next").onclick = () => {
  const n = $("input-name").value.trim();
  if (!n) return;
  player = n;
  $("lobby-greeting").innerHTML = `Olá, ${esc(n)}! A Taverna te aguarda.`;
  screen("screen-lobby");
};
$("input-name").addEventListener("keypress", e => { if (e.key === "Enter") $("btn-name-next").click(); });
$("btn-back-name").onclick    = e => { e.preventDefault(); resetName(); };
$("btn-create-room").onclick  = () => createRoom();
$("btn-join-show").onclick    = () => { $("join-form").style.display = "block"; };
$("btn-join-cancel").onclick  = () => { $("join-form").style.display = "none"; };
$("btn-join-room").onclick    = () => joinRoom();
$("input-room-code").addEventListener("keypress", e => { if (e.key === "Enter") $("btn-join-room").click(); });
$("btn-leave-room").onclick   = async e => { e.preventDefault(); await leaveRoom(); };
$("btn-change-name").onclick  = async e => { e.preventDefault(); await resetName(); };
$("copy-code-btn").onclick    = () => {
  if (!room) return;
  navigator.clipboard.writeText(room).then(() => {
    showToast("✅ Código copiado!");
    const h = $("copy-hint"); h.textContent = "✅";
    setTimeout(() => h.textContent = "📋", 1500);
  });
};
$("copy-code-btn").addEventListener("keypress", e => { if (e.key === "Enter" || e.key === " ") $("copy-code-btn").click(); });
$("btn-clear-history").onclick = async () => {
  if (room && confirm("Apagar todos os feitos desta sala?")) await remove(ref(db, `rooms/${room}/rolls`));
};
document.querySelectorAll("[data-filter]").forEach(btn => btn.addEventListener("click", () => {
  activeFilter = btn.dataset.filter; renderFeed();
}));

// ─── Boot ──────────────────────────────────────────────────────────────────────
renderDice(); updateFormula(); updateModDisplay();
screen("screen-name");
cleanAllEmptyRooms();
setInterval(() => cleanAllEmptyRooms(), 10 * 60 * 1000);
