"use strict";
const iconPaths = {
heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
'book-open':'<path d="M12 5v16M12 5C8 2 4 3 2 4v16c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1Z"/>',
plus:'<path d="M12 5v14M5 12h14"/>', search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
star:'<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>',
users:'<circle cx="9" cy="8" r="3"/><path d="M2 21v-3a7 7 0 0 1 14 0v3M16 4a4 4 0 0 1 0 8m2 3a5 5 0 0 1 4 5"/>',
'trash-2':'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
settings:'<circle cx="12" cy="12" r="3"/><path d="m9 3-1 3-3 1-2 3 2 2-1 4 3 2 3-1 2 4 3-1 1-3 4-1 1-4-3-2 1-4-4-1-3-2Z"/>',
'log-out':'<path d="M9 3H3v18h6m7-14 5 5-5 5M8 12h13"/>',
lock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/>',
'arrow-right':'<path d="M4 12h16m-6-6 6 6-6 6"/>',
paperclip:'<path d="m21 11-9 9a6 6 0 0 1-8-8L14 2a4 4 0 0 1 6 6L10 18a2 2 0 0 1-3-3l9-9"/>',
download:'<path d="M12 3v12m-5-5 5 5 5-5M3 15v6h18v-6"/>',
x:'<path d="m6 6 12 12M6 18 18 6"/>', check:'<path d="m4 12 5 5L20 6"/>',
'folder-heart':'<path d="M2 6h8l2 3h10v12H2Z"/><path d="m12 18-4-4a2 2 0 0 1 4-2 2 2 0 0 1 4 2Z"/>'
};
const icon = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[n] || iconPaths.heart}</svg>`;
const TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "audio/mpeg",
  "audio/wav",
  "video/mp4",
];
function validateFile(file) {
  if (!TYPES.includes(file.type))
    throw Error("Choose a JPG, PNG, WebP, PDF, MP3, WAV, or MP4 file.");
  if (file.size > 10 * 1024 * 1024)
    throw Error("Files must be 10 MB or smaller.");
  if (!file.size) throw Error("The file is empty.");
}
function cleanMemory(input) {
  const title = input.title.trim(),
    body = input.body.trim();
  if (!title || title.length > 120)
    throw Error("Add a title between 1 and 120 characters.");
  if (body.length > 20000)
    throw Error("Keep your memory under 20,000 characters.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.memory_date))
    throw Error("Choose a date.");
  if (!Object.keys(moodIcons).includes(input.mood)) throw Error("Choose a valid mood.");
  const parsed = new Date(input.memory_date + "T12:00:00Z");
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== input.memory_date) throw Error("Choose a valid date.");
  const tags = [
    ...new Set(
      input.tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  if (tags.length > 10 || tags.some((t) => t.length > 30))
    throw Error("Use up to 10 tags, each under 31 characters.");
  return {
    title,
    body,
    memory_date: input.memory_date,
    mood: input.mood,
    tags,
  };
}
function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function filterMemories(
  items,
  {
    query = "",
    mood = "",
    favorite = false,
    trash = false,
    shared = false,
    userId = "",
  },
) {
  return items.filter(
    (m) =>
      Boolean(m.deleted_at) === trash &&
      (!favorite || m.favorite) &&
      (!mood || m.mood === mood) &&
      (!shared || m.user_id !== userId) &&
      (!query ||
        [m.title, m.body, ...m.tags]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase())),
  );
}
function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const a = crypto.getRandomValues(new Uint8Array(16));
  a[6] = (a[6] & 15) | 64;
  a[8] = (a[8] & 63) | 128;
  const h = Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const e = escapeHtml;
const config = window.LITTLE_MOMENTS_CONFIG || {};
let configError = '', db = null, configured = false;
function requireWebOrigin() {
  if (!['https:', 'http:'].includes(location.protocol))
    throw Error('Open the published HTTPS website for sign-in. Google, GitHub, and email callbacks cannot return to a file on your computer.');
}
function validatePublicConfig(settings) {
  const url = String(settings.supabaseUrl || '').trim();
  const key = String(settings.supabasePublishableKey || '').trim();
  if (!url || !key || url.includes('YOUR_PROJECT') || key.includes('PASTE_')) return false;
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url))
    throw Error('In config.js, use the Project URL from Supabase: https://YOUR_PROJECT.supabase.co');
  if (!key.startsWith('sb_publishable_'))
    throw Error('Use only the sb_publishable_ key in config.js. Secret keys and legacy service_role keys must never be uploaded to GitHub.');
  if (settings.siteUrl) {
    const site = new URL(settings.siteUrl);
    if (!['https:', 'http:'].includes(site.protocol) || site.search || site.hash)
      throw Error('Use your full published website URL in siteUrl, with no query string or # fragment.');
  }
  return true;
}
try {
  configured = validatePublicConfig(config);
  if (configured) {
    if (!window.supabase?.createClient) throw Error('The Supabase client did not load. Upload the vendor folder along with the other website files.');
    db = window.supabase.createClient(config.supabaseUrl.trim(), config.supabasePublishableKey.trim(), {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
} catch (err) { configured = false; configError = err.message; }
const callback = () => config.siteUrl || location.origin + location.pathname;
async function beginOAuth(provider) {
  if (!['google', 'github'].includes(provider)) throw Error('Unknown sign-in provider.');
  requireWebOrigin();
  const options = { redirectTo: callback() };
  if (provider === 'google') options.queryParams = { prompt: 'select_account' };
  // Supabase chooses its standard minimal login scopes. No repository or Drive access is requested here.
  unwrap(await db.auth.signInWithOAuth({ provider, options }));
}

function unwrap({ data, error }) {
  if (error) {
    if(error.code==='23505')throw Error('That username or item is already in use. Choose another.');
    if(error.code==='23514')throw Error('Check your entry: usernames must be 3–24 lowercase letters/numbers/underscores, start with a letter, and cannot use reserved names.');
    if(error.code==='42501')throw Error('This account does not have permission for that action.');
    throw error;
  }
  return data;
}
async function listMemories() {
  const all = [];
  for (let offset = 0; ; offset += 500) {
    const page = unwrap(
      await db
        .from("memories")
        .select("*")
        .order("memory_date", { ascending: false })
        .order("id")
        .range(offset, offset + 499),
    );
    all.push(...page);
    if (page.length < 500) return all;
  }
}
async function saveMemory(memory) {
  return unwrap(await db.from("memories").insert(memory).select().single());
}
async function patchMemory(id, patch) {
  return unwrap(
    await db.from("memories").update(patch).eq("id", id).select().single(),
  );
}
async function listFiles(id) {
  return unwrap(
    await db.storage
      .from("memory-files")
      .list(`${(await getMemory(id)).user_id}/${id}`, { limit: 100 }),
  );
}
async function getMemory(id) {
  return unwrap(await db.from("memories").select("*").eq("id", id).single());
}
async function uploadFile(memory, file) {
  validateFile(file);
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
  return unwrap(
    await db.storage
      .from("memory-files")
      .upload(`${memory.user_id}/${memory.id}/${uuid()}--${safe}`, file, {
        upsert: false,
        contentType: file.type,
      }),
  );
}
async function openFile(path) {
  const blob = unwrap(await db.storage.from("memory-files").download(path));
  return URL.createObjectURL(blob);
}
async function removeFile(path) {
  unwrap(await db.storage.from("memory-files").remove([path]));
}
async function purgeMemory(memory) {
  let files;
  do {
    files = unwrap(
      await db.storage
        .from("memory-files")
        .list(`${memory.user_id}/${memory.id}`, { limit: 100 }),
    );
    if (files.length)
      unwrap(
        await db.storage
          .from("memory-files")
          .remove(files.map((f) => `${memory.user_id}/${memory.id}/${f.name}`)),
      );
  } while (files.length === 100);
  unwrap(await db.from("memories").delete().eq("id", memory.id));
}

const moodIcons = {
  grateful: "✿",
  happy: "☀",
  calm: "☁",
  nostalgic: "✧",
  sad: "☂",
  excited: "✦",
};
const moods = Object.keys(moodIcons);
const localDate = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const today = () => localDate(new Date());
let user = null,
  profile = null,
  admin = false,
  memories = [],
  announcements = [],
  demo = false,
  view = "journal",
  query = "",
  mood = "",
  busy = false,
  authMode = "signin",
  message = "",
  loading = true;
let demoFiles = new Map(),
  blobUrls = [];
const app = document.querySelector("#app");
const sample = [
  [
    "An afternoon worth remembering",
    "We took the long way home. No plans, no hurry. Just warm light, good conversation, and a reminder that the smallest moments often stay with us the longest.",
    "grateful",
    "family, everyday",
  ],
  [
    "A little courage, a new beginning",
    "Tried something new today. It wasn’t perfect, but I’m proud of showing up. Here’s to more first steps.",
    "excited",
    "milestones",
  ],
  [
    "The kind of day I needed",
    "An open window, my favorite playlist, and time to breathe. Sometimes a quiet afternoon is everything.",
    "calm",
    "little joys",
  ],
];
function seeds() {
  return sample.map((s, i) => ({
    id: uuid(),
    user_id: "demo",
    title: s[0],
    body: s[1],
    mood: s[2],
    tags: s[3].split(", "),
    memory_date: localDate(new Date(Date.now() - i * 86400000 * 4)),
    favorite: i === 0,
    deleted_at: null,
  }));
}
function notify(text) {
  message = text;
  const target = document.querySelector("#notice");
  if (target) {
    target.textContent = text;
    target.hidden = false;
  }
}
async function run(fn) {
  if (busy) return;
  busy = true;
  document
    .querySelectorAll("button[type=submit]")
    .forEach((b) => (b.disabled = true));
  try {
    await fn();
  } catch (err) {
    if (document.querySelector("dialog"))
      dialogError(document.querySelector("dialog"), err);
    else notify(err.message || "Something went wrong. Please try again.");
  } finally {
    busy = false;
    document
      .querySelectorAll("button[type=submit]")
      .forEach((b) => (b.disabled = false));
  }
}
function bind() {
  
  document
    .querySelectorAll("[data-action]")
    .forEach(
      (el) =>
        (el.onclick = () =>
          run(() => action(el.dataset.action, el.dataset.id))),
    );
}
function flash() {
  return `<p id="notice" class="notice" role="status" ${message ? "" : "hidden"}>${e(message)}</p>`;
}
function remember() {
  if (demo)
    sessionStorage.setItem("little-moments-demo", JSON.stringify(memories));
}
function logo() {
  return `<a class="brand" href="#home"><span class="brandmark">${icon("heart")}</span><span>Little Moments<small>A HOME FOR YOUR MEMORIES</small></span></a>`;
}
function footer() {
  return `<footer>Made for the moments that matter.<span><a href="privacy.html">Privacy</a> · <a href="#portfolio">AI Lab Portfolio</a></span></footer>`;
}
function render() {
  if (loading) {
    app.innerHTML = '<main class="loading">Loading your little moments…</main>';
    return;
  }
  if (!user || ["#portfolio", "#home"].includes(location.hash)) {
    renderPublic();
    return;
  }
  renderJournal();
}
function renderPublic() {
  const portfolio = location.hash === "#portfolio";
  app.innerHTML = `<header>${logo()}<nav><a href="#portfolio">Project hub</a><button data-action="auth" class="primary small">Sign in ${icon("arrow-right")}</button></nav></header><main class="public">${flash()}${portfolio ? `<section class="hero"><span class="eyebrow">STUDENT SHOWCASE</span><h1>Welcome to my<br><em>AI Project Hub ✨</em></h1><p>Explore the web apps and games created during my Building with AI course.</p></section><section class="project-grid"><article class="panel"><div class="project-art">⚔</div><h2>Medieval Run</h2><p>An endless-runner quest across the kingdom.</p><a class="primary" href="https://catuce428-alt.github.io/ella-sus-source-code/medieval-run/medieval-run.html" target="_blank" rel="noopener">Play game ↗</a></article><article class="panel"><div class="project-art">✦</div><h2>Local Fitness Tracker</h2><p>Log workouts and build your exercise routine.</p><a class="primary" href="https://catuce428-alt.github.io/ella-sus-source-code/local-fitness-finder/index.html" target="_blank" rel="noopener">Open tracker ↗</a></article><article class="panel"><div class="project-art">♡</div><h2>Little Moments</h2><p>Your private journal, with selective sharing.</p><button class="primary" data-action="auth">Start your journal →</button></article></section>` : `<section class="landing"><div><span class="eyebrow">YOUR LIFE, LOVINGLY COLLECTED</span><h1>Big feelings.<br>Little <em>moments.</em></h1><p>A quiet place for your everyday joys, the days that changed you, and everything you want to keep.</p><div class="row"><button class="primary" data-action="signup">Start your journal ${icon("arrow-right")}</button><button class="secondary" data-action="demo">Explore a demo</button></div><div class="trust">${icon("lock")} Private by default <span>·</span> Yours to share</div></div><div class="keepsake"><span class="tape"></span><div class="keepsake-art">✿<span>the little things</span></div><p>A moment for the memory book.</p><small>A LITTLE JOY, SAVED FOREVER ♡</small></div></section><section class="features"><article>${icon("book-open")}<h3>Make it a memory</h3><p>Words, photos, and little details. Capture it your way.</p></article><article>${icon("folder-heart")}<h3>Keep it close</h3><p>Find your favorites with tags, moods, and search.</p></article><article>${icon("users")}<h3>Share with intention</h3><p>Invite someone into a moment. Keep the rest just for you.</p></article></section>`}${footer()}</main>`;
  bind();
  if (location.hash === "#auth") authDialog();
}
function renderJournal() {
  const owned = memories.filter((m) => m.user_id === user.id && !m.deleted_at);
  app.innerHTML = `<div class="shell"><aside>${logo()}<span class="nav-caption">YOUR SPACE</span><nav>${[["journal", "book-open", "All memories"], ["favorites", "star", "Favorites"], ["shared", "users", "Shared with me"], ["trash", "trash-2", "Trash"], ["settings", "settings", "Settings"], ...(admin ? [["admin", "shield", "Admin panel"]] : [])].map(([v, i, t]) => `<button data-action="view" data-id="${v}" class="${v === view ? "active" : ""}">${icon(i)}${t}${v === "journal" ? `<span class="count">${owned.length}</span>` : ""}</button>`).join("")}</nav><div class="sidebar-bottom"><div class="private-note">${icon("lock")}<strong>Your story stays yours.</strong><p>Only you and people you choose can read your memories.</p></div><button data-action="signout">${icon("log-out")}${demo ? "Exit demo" : "Sign out"}</button></div></aside><div class="workspace"><header class="topbar"><span>${demo ? "INTERACTIVE DEMO · CHANGES LAST FOR THIS TAB" : "YOUR PERSONAL MEMORY JOURNAL"}</span><div class="row"><button class="text-button" data-action="refresh">Refresh</button><button class="avatar" data-action="view" data-id="settings" aria-label="Account settings">${e((profile?.display_name || "M")[0].toUpperCase())}</button></div></header><main class="journal-main">${flash()}${announcements.map((a) => `<div class="announcement">${icon("sparkles")}${e(a.body)}</div>`).join("")}<div id="content"></div></main>${footer()}</div></div>`;
  bind();
  if (view === "settings") renderSettings();
  else if (view === "admin") renderAdmin().catch((err) => notify(err.message));
  else renderCards();
}
function renderCards() {
  const titles = {
    journal: [
      "Your everyday, remembered.",
      "A collection of the things that make life yours.",
    ],
    favorites: [
      "The ones you hold close.",
      "Your favorite memories, all in one place.",
    ],
    shared: [
      "A little window into their world.",
      "Memories someone has chosen to share with you.",
    ],
    trash: [
      "A little room to change your mind.",
      "Restore a memory or delete it permanently. Trash is kept until you empty it.",
    ],
  };
  const [title, sub] = titles[view] || titles.journal;
  const base =
    view === "shared"
      ? memories
      : memories.filter((m) => m.user_id === user.id);
  const rows = filterMemories(base, {
    query,
    mood,
    favorite: view === "favorites",
    trash: view === "trash",
    shared: view === "shared",
    userId: user.id,
  }).sort((a,b) => b.memory_date.localeCompare(a.memory_date) || a.title.localeCompare(b.title));
  document.querySelector("#content").innerHTML =
    `<section class="page-heading"><div><span class="eyebrow">${view === "journal" ? `HELLO, ${e(profile?.display_name || "MEMORY KEEPER")} ♡` : e(view.toUpperCase())}</span><h1>${title}</h1><p>${sub}</p></div><button class="primary" data-action="new">${icon("plus")} New memory</button></section>${view === "journal" ? `<div class="prompt"><div class="prompt-icon">✧</div><div><span class="eyebrow">A LITTLE INSPIRATION</span><h3>What made you smile today?</h3><p>It doesn’t have to be extraordinary to be worth remembering.</p></div><button class="text-button" data-action="prompt">Write about it ${icon("arrow-right")}</button></div>` : ""}<div class="toolbar"><label class="search">${icon("search")}<input id="search" placeholder="Search memories, words, or tags…" value="${e(query)}" aria-label="Search memories"></label><select id="mood-filter" aria-label="Filter by mood"><option value="">Every mood</option>${moods.map((m) => `<option value="${m}" ${m === mood ? "selected" : ""}>${moodIcons[m]} ${m}</option>`).join("")}</select><span>${rows.length} ${rows.length === 1 ? "memory" : "memories"}</span></div><section class="memory-grid">${
      rows.length
        ? rows
            .map(
              (m) =>
                `<article class="memory-card"><button class="card-open" data-action="open" data-id="${m.id}" aria-label="Open ${e(m.title)}"><div class="memory-art ${m.mood}"><span>${moodIcons[m.mood]}</span><small>${e(m.mood)}</small></div><div class="card-body"><time>${formatDate(m.memory_date)}</time><h2>${e(m.title)}</h2><p>${e(m.body || "A little moment, kept safe.")}</p><div class="tags">${m.tags
                  .slice(0, 3)
                  .map((t) => `<span>#${e(t)}</span>`)
                  .join(
                    "",
                  )}</div></div></button><div class="card-footer"><span>${icon(m.user_id === user.id ? "lock" : "users")}${m.user_id === user.id ? "Your memory" : "Shared with you"}</span>${m.user_id === user.id ? `<button class="favorite ${m.favorite ? "selected" : ""}" data-action="favorite" data-id="${m.id}" aria-label="${m.favorite ? "Unfavorite" : "Favorite"} ${e(m.title)}" aria-pressed="${m.favorite}">${icon("heart")}</button>` : ""}</div></article>`,
            )
            .join("")
        : `<div class="empty">${icon("book-open")}<h2>${query || mood ? "No matching moments yet." : "Your story starts here."}</h2><p>${query || mood ? "Try another word or mood." : "Save a small detail today. Your future self will thank you."}</p><button class="secondary" data-action="new">Create a memory</button></div>`
    }</section>`;
  bind();
  document.querySelector("#search").addEventListener("input", (ev) => {
    const pos = ev.target.selectionStart;
    query = ev.target.value;
    renderCards();
    const field = document.querySelector("#search");
    field.focus();
    field.setSelectionRange(pos, pos);
  });
  document.querySelector("#mood-filter").addEventListener("change", (ev) => {
    mood = ev.target.value;
    renderCards();
  });
}
function formatDate(d) {
  return new Date(d + "T12:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function dialog(html) {
  closeDialog();
  const d = document.createElement("dialog");
  d.innerHTML = `<button class="close" aria-label="Close dialog">${icon("x")}</button>${html}`;
  document.body.append(d);
  d.querySelector(".close").onclick = () => closeDialog();
  d.addEventListener("click", (ev) => {
    if (ev.target === d) closeDialog();
  });
  d.addEventListener("close", () => { d.remove(); blobUrls.forEach(URL.revokeObjectURL); blobUrls = []; });
  d.setAttribute("aria-label", d.querySelector("h2")?.textContent || "Memory details");
  d.showModal();
  
  return d;
}
function closeDialog() {
  document.querySelectorAll("dialog").forEach((d) => {
    d.close();
    d.remove();
  });
  blobUrls.forEach(URL.revokeObjectURL);
  blobUrls = [];
}
function dialogError(d, error) {
  let p = d.querySelector(".dialog-status");
  if (!p) { p = document.createElement("p"); p.className = "dialog-status"; p.setAttribute("role", "status"); d.append(p); }
  if (p) {
    p.textContent = error.message || error;
    p.hidden = false;
  }
}
function formHandler(d, fn) {
  d.querySelector("form").onsubmit = async (ev) => {
    ev.preventDefault();
    if (busy) return;
    busy = true;
    const b = d.querySelector("[type=submit]");
    b.disabled = true;
    try {
      await fn(new FormData(ev.target));
    } catch (err) {
      dialogError(d, err);
    } finally {
      busy = false;
      if (b.isConnected) b.disabled = false;
    }
  };
}
function authDialog() {
  if (!configured) {
    dialog(
      `<span class="eyebrow">LET’S GET CONNECTED</span><h2>Your journal is ready for Supabase.</h2><p>Open SETUP.html from the download and follow the numbered steps. Add your project URL and publishable key to config.js, then publish the files. Never put a secret key in config.js.</p><button class="primary" id="try-demo">Explore the demo</button>`,
    ).querySelector("#try-demo").onclick = () => {
      closeDialog();
      startDemo();
    };
    return;
  }
  const reset = authMode === "reset",
    signup = authMode === "signup",
    recover = authMode === "recover";
  const d = dialog(
    `<span class="eyebrow">LITTLE MOMENTS ♡</span><h2>${recover ? "Choose a new password" : reset ? "A fresh start" : signup ? "Make room for your memories" : "Welcome back"}</h2><p>${reset ? "We’ll send a password reset link to your email." : signup ? "Start collecting the moments that matter." : "Your memories are right where you left them."}</p><form>${signup ? '<label>Your name<input name="name" required maxlength="80" autocomplete="name"></label>' : ""}${!recover ? '<label>Email<input name="email" type="email" required autocomplete="email"></label>' : ""}${!reset ? `<label>Password<input name="password" type="password" required minlength="8" pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}" autocomplete="${signup || recover ? "new-password" : "current-password"}"></label>` : ""}<p class="dialog-status" role="status" hidden></p><button type="submit" class="primary">${recover ? "Update password" : reset ? "Send reset link" : signup ? "Create account" : "Sign in"}</button></form>${!recover ? `<div class="auth-links"><button id="switch-auth">${signup || reset ? "Back to sign in" : "Create an account"}</button>${!signup && !reset ? '<button id="reset-auth">Forgot password?</button>' : ""}</div>` : ""}${!recover && !reset ? '<div class="social-logins"><span class="hint">Or sign in with</span>' + (config.enableGoogle ? '<button class="secondary full" data-provider="google">Continue with Google</button>' : '') + (config.enableGitHub ? '<button class="secondary full" data-provider="github">Continue with GitHub</button>' : '') + '</div>' : ''}`,
  );
  formHandler(d, async (f) => {
    requireWebOrigin();
    if (reset) {
      unwrap(
        await db.auth.resetPasswordForEmail(f.get("email"), {
          redirectTo: callback(),
        }),
      );
      dialogError(d, "If an account exists, a reset link will arrive shortly.");
      return;
    }
    if (recover) {
      unwrap(await db.auth.updateUser({ password: f.get("password") }));
      authMode = "signin";
      recoveringPassword = false;
      closeDialog();
      notify("Password updated.");
      render();
      return;
    }
    if (signup) {
      unwrap(
        await db.auth.signUp({
          email: f.get("email"),
          password: f.get("password"),
          options: {
            data: { display_name: f.get("name") },
            emailRedirectTo: callback(),
          },
        }),
      );
      dialogError(d, "Check your email to confirm your account, then sign in.");
    } else {
      unwrap(
        await db.auth.signInWithPassword({
          email: f.get("email"),
          password: f.get("password"),
        }),
      );
      closeDialog();
    }
  });
  d.querySelector("#switch-auth")?.addEventListener("click", () => {
    authMode = signup || reset ? "signin" : "signup";
    authDialog();
  });
  d.querySelector("#reset-auth")?.addEventListener("click", () => {
    authMode = "reset";
    authDialog();
  });
  d.querySelectorAll("[data-provider]").forEach(button => {
    button.onclick = () => run(async () => {
      requireWebOrigin();
      await beginOAuth(button.dataset.provider);
    });
  });
}

function editor(memory = null, prompt = false) {
  const m = memory || {
    title: "",
    body: prompt ? "What made me smile today: " : "",
    memory_date: today(),
    mood: "grateful",
    tags: [],
  };
  const d = dialog(
    `<span class="eyebrow">${memory ? "REVISIT A MOMENT" : "SAVE SOMETHING GOOD"}</span><h2>${memory ? "Edit your memory" : "A little moment, just for you."}</h2><form><label>Give it a title<input name="title" value="${e(m.title)}" maxlength="120" required placeholder="An afternoon worth remembering"></label><div class="form-row"><label>Date<input type="date" name="memory_date" value="${m.memory_date}" required></label><label>How did it feel?<select name="mood">${moods.map((x) => `<option ${x === m.mood ? "selected" : ""} value="${x}">${moodIcons[x]} ${x}</option>`).join("")}</select></label></div><label>Your story<textarea name="body" rows="6" maxlength="20000" placeholder="The details you don’t want to forget…">${e(m.body)}</textarea></label><label>Tags <small>Separate with commas</small><input name="tags" value="${e(m.tags.join(", "))}" placeholder="family, travel, little joys"></label><p class="hint">${icon("lock")} Private until you choose to share. Add attachments after saving.</p><p class="dialog-status" role="status" hidden></p><button class="primary" type="submit">${icon("check")} Save memory</button></form>`,
  );
  formHandler(d, async (f) => {
    const fields = cleanMemory(Object.fromEntries(f));
    const saved = {
      ...m,
      ...fields,
      id: memory?.id || uuid(),
      user_id: user.id,
      favorite: memory?.favorite || false,
      deleted_at: memory?.deleted_at || null,
    };
    if (demo) {
      memories = memory
        ? memories.map((x) => (x.id === saved.id ? saved : x))
        : [saved, ...memories];
      remember();
    } else {
      if (memory) await patchMemory(memory.id, fields);
      else await saveMemory(saved);
      memories = await listMemories();
    }
    closeDialog();
    render();
    await detail(saved.id);
  });
}
async function detail(id) {
  const m = memories.find((x) => x.id === id);
  if (!m) return;
  const own = m.user_id === user.id;
  const d = dialog(
    `<div class="detail-mood ${m.mood}">${moodIcons[m.mood]}</div><span class="eyebrow">${formatDate(m.memory_date)} · ${e(m.mood)}</span><h2>${e(m.title)}</h2><p class="story">${e(m.body)}</p><div class="tags">${m.tags.map((t) => `<span>#${e(t)}</span>`).join("")}</div><h3>Little keepsakes</h3><p class="hint">Photos, audio, video, or PDFs. Up to 10 MB each. First 100 files shown.</p><div id="files">Loading attachments…</div>${own && !m.deleted_at ? '<label class="upload">＋ Add a keepsake<input id="upload" type="file" accept="image/jpeg,image/png,image/webp,application/pdf,audio/mpeg,audio/wav,video/mp4"></label>' : ""}<p class="dialog-status" role="status" hidden></p><div class="detail-actions">${own ? (m.deleted_at ? '<button id="restore" class="secondary">Restore memory</button><button id="purge" class="danger">Delete permanently</button>' : '<button id="edit" class="secondary">Edit memory</button><button id="share" class="secondary">Share</button><button id="trash" class="text-button">Move to Trash</button>') : '<button id="leave" class="secondary">Remove from shared with me</button>'}</div>`,
  );
  const refresh = async () => {
    const files = demo
      ? (demoFiles.get(id) || []).map((f) => ({ name: f.name }))
      : await listFiles(id);
    if (!d.isConnected) return;
    d.querySelector("#files").innerHTML = files.length
      ? files
          .map(
            (f, i) =>
              `<div class="file-row"><button data-file="${i}">${icon("paperclip")}${e(f.name.split("--").slice(1).join("--") || f.name)}</button>${own ? `<button data-remove="${i}" aria-label="Delete attachment ${e(f.name)}">${icon("trash-2")}</button>` : ""}</div>`,
          )
          .join("")
      : '<p class="empty-files">No attachments yet. A story is enough, too.</p>';
    
    d.querySelectorAll("[data-file]").forEach(
      (b) =>
        (b.onclick = async () => {
          try {
            const name = files[+b.dataset.file].name;
            const url = demo
              ? URL.createObjectURL(
                  demoFiles.get(id).find((f) => f.name === name).file,
                )
              : await openFile(`${m.user_id}/${id}/${name}`);
            blobUrls.push(url);
            let preview = d.querySelector("#attachment-preview");
            if (!preview) {
              preview = document.createElement("div");
              preview.id = "attachment-preview";
              d.querySelector("#files").after(preview);
            }
            preview.replaceChildren();
            const extension = name.split(".").pop().toLowerCase();
            if (
              ["jpg", "jpeg", "png", "webp", "mp3", "wav", "mp4"].includes(
                extension,
              )
            ) {
              const media = document.createElement(
                ["mp3", "wav"].includes(extension)
                  ? "audio"
                  : extension === "mp4"
                    ? "video"
                    : "img",
              );
              media.src = url;
              media.style.cssText =
                "max-width:100%;max-height:320px;border-radius:10px;margin:12px 0";
              if (media.tagName === "IMG") media.alt = name;
              else media.controls = true;
              preview.append(media);
            }
            const a = document.createElement("a");
            a.href = url;
            a.download = name.split("--").slice(1).join("--") || name;
            a.className = "secondary";
            a.textContent = "Download " + a.download;
            preview.append(a);
          } catch (err) {
            dialogError(d, err);
          }
        }),
    );
    d.querySelectorAll("[data-remove]").forEach(
      (b) =>
        (b.onclick = async () => {
          if (!confirm("Permanently delete this attachment?")) return;
          b.disabled = true;
          try {
            const name = files[+b.dataset.remove].name;
            if (demo)
              demoFiles.set(
                id,
                demoFiles.get(id).filter((f) => f.name !== name),
              );
            else await removeFile(`${m.user_id}/${id}/${name}`);
            await refresh();
          } catch (err) {
            dialogError(d, err);
          } finally {
            b.disabled = false;
          }
        }),
    );
  };
  try {
    await refresh();
  } catch (err) {
    dialogError(d, err);
    d.querySelector("#files").textContent =
      "Attachments could not load. Close and reopen to retry.";
  }
  d.querySelector("#upload")?.addEventListener("change", async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    ev.target.disabled = true;
    try {
      validateFile(file);
      if (demo)
        demoFiles.set(id, [
          ...(demoFiles.get(id) || []),
          { name: uuid() + "--" + file.name, file },
        ]);
      else await uploadFile(m, file);
      await refresh();
    } catch (err) {
      dialogError(d, err);
    } finally {
      ev.target.disabled = false;
      ev.target.value = "";
    }
  });
  d.querySelector("#edit")?.addEventListener("click", () => editor(m));
  d.querySelector("#share")?.addEventListener("click", () =>
    run(() => sharing(m)),
  );
  d.querySelector("#trash")?.addEventListener("click", () =>
    run(async () => {
      await patch(id, { deleted_at: new Date().toISOString() });
      closeDialog();
      render();
    }),
  );
  d.querySelector("#restore")?.addEventListener("click", () =>
    run(async () => {
      await patch(id, { deleted_at: null });
      closeDialog();
      render();
    }),
  );
  d.querySelector("#purge")?.addEventListener("click", () =>
    run(async () => {
      if (
        !confirm(
          "Permanently delete this memory and all attachments? This cannot be undone.",
        )
      )
        return;
      if (!demo) await purgeMemory(m);
      memories = memories.filter((x) => x.id !== id);
      demoFiles.delete(id);
      remember();
      closeDialog();
      render();
    }),
  );
  d.querySelector("#leave")?.addEventListener("click", () =>
    run(async () => {
      unwrap(
        await db
          .from("memory_shares")
          .delete()
          .eq("memory_id", id)
          .eq("recipient_id", user.id),
      );
      memories = await listMemories();
      closeDialog();
      render();
    }),
  );
}
async function patch(id, fields) {
  if (!demo) await patchMemory(id, fields);
  memories = memories.map((m) => (m.id === id ? { ...m, ...fields } : m));
  remember();
}
async function sharing(m) {
  if (demo) {
    notify("Sharing requires a connected Supabase project and real accounts.");
    return;
  }
  const shares = unwrap(
    await db.from("memory_shares").select("*").eq("memory_id", m.id),
  );
  const d = dialog(
    `<span class="eyebrow">SHARE WITH INTENTION</span><h2>Let someone into this moment.</h2><p>Ask them for their sharing code from Settings. They need a verified account. They can read this memory and download its attachments, but cannot edit it.</p><form><label>Their sharing code<input name="recipient" required placeholder="Their account UUID" pattern="[0-9a-fA-F-]{36}"></label><p class="dialog-status" role="status" hidden></p><button type="submit" class="primary">Share memory</button></form><h3>People with access</h3>${shares.length ? shares.map((s) => `<div class="file-row"><code>${e(s.recipient_id)}</code><button data-revoke="${s.recipient_id}">Revoke</button></div>`).join("") : "<p>Only you, for now.</p>"}<p class="hint">Revoking prevents future access. It cannot remove files someone has already downloaded. Restoring a trashed memory restores its existing shares.</p>`,
  );
  formHandler(d, async (f) => {
    const recipient = f.get("recipient").trim();
    if (recipient === user.id)
      throw Error("This memory already belongs to you.");
    unwrap(
      await db
        .from("memory_shares")
        .insert({ memory_id: m.id, recipient_id: recipient }),
    );
    await sharing(m);
  });
  d.querySelectorAll("[data-revoke]").forEach(
    (b) =>
      (b.onclick = async () => {
        try {
          unwrap(
            await db
              .from("memory_shares")
              .delete()
              .eq("memory_id", m.id)
              .eq("recipient_id", b.dataset.revoke),
          );
          await sharing(m);
        } catch (err) {
          dialogError(d, err);
        }
      }),
  );
}
function renderSettings() {
  document.querySelector("#content").innerHTML =
    `<section class="page-heading"><div><span class="eyebrow">MAKE YOURSELF AT HOME</span><h1>Your space, your settings.</h1><p>Manage your profile and take your memories with you.</p></div></section><div class="settings-grid"><section class="panel"><h2>About you</h2><form id="profile-form"><label>Your name<input name="name" value="${e(profile?.display_name)}" maxlength="80" required></label><label>Email<input value="${e(user.email || "Demo account")}" disabled></label><button class="primary" type="submit">Save profile</button></form></section><section class="panel"><h2>Your sharing code</h2><p>Give this code to someone who wants to share a memory with you. It is an identifier, not a password.</p><code class="sharing-code">${e(user.id)}</code><button class="secondary" data-action="copy">Copy code</button></section><section class="panel"><h2>Your memories belong to you.</h2><p>Export all your written memories, tags, dates, and Trash as a JSON file. Download attachments individually from each memory.</p><button class="secondary" data-action="export">${icon("download")} Export journal</button></section><section class="panel"><h2>Account & privacy</h2><p>Memories are access-controlled, not end-to-end encrypted. Your service operator can access database records through Supabase.</p><button class="secondary" data-action="password">Reset password</button><button class="danger" data-action="delete-account">Delete account</button></section></div>`;
  bind();
  document.querySelector("#profile-form").onsubmit = (ev) => {
    ev.preventDefault();
    run(async () => {
      const name = new FormData(ev.target).get("name").trim();
      if (!name) throw Error("Enter your name.");
      if (!demo)
        unwrap(
          await db
            .from("profiles")
            .update({ display_name: name })
            .eq("id", user.id),
        );
      profile.display_name = name;
      notify("Profile saved.");
      render();
    });
  };
}
async function renderAdmin() {
  if (!admin) throw Error("Administrator access required.");
  const profiles = unwrap(
    await db
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false }),
  );
  const audit = unwrap(
    await db
      .from("admin_audit")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
  );
  document.querySelector("#content").innerHTML =
    `<section class="page-heading"><div><span class="eyebrow">ADMINISTRATION</span><h1>Look after the community.</h1><p>Manage accounts and announcements. Private journals remain private.</p></div></section><div class="panel"><h2>Accounts (${profiles.length})</h2><div class="table-wrap"><table><thead><tr><th>Name / ID</th><th>Joined</th><th>Status</th><th>Action</th></tr></thead><tbody>${profiles.map((p) => `<tr><td>${e(p.display_name)}<small>${p.id}</small></td><td>${formatDate(p.created_at.slice(0, 10))}</td><td>${p.suspended ? "Suspended" : "Active"}</td><td>${p.id !== user.id ? `<button data-suspend="${p.id}" data-disabled="${!p.suspended}">${p.suspended ? "Restore access" : "Suspend"}</button>` : "You"}</td></tr>`).join("")}</tbody></table></div></div><section class="panel"><h2>Community notice</h2><form id="announcement-form"><label>Announcement<textarea name="body" required maxlength="500" rows="3"></textarea></label><button class="primary" type="submit">Publish notice</button></form>${announcements.map((a) => `<div class="file-row"><span>${e(a.body)}</span><button data-announcement="${a.id}">Remove</button></div>`).join("")}</section><section class="panel"><h2>Recent account actions</h2>${audit.length ? audit.map((a) => `<p>${e(a.action)} · <code>${a.target_id}</code> · ${new Date(a.created_at).toLocaleString()}</p>`).join("") : "<p>No account actions yet.</p>"}</section>`;
  document.querySelectorAll("[data-suspend]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          if (
            !confirm(
              `${b.dataset.disabled === "true" ? "Suspend" : "Restore"} this account’s access?`,
            )
          )
            return;
          unwrap(
            await db.rpc("admin_set_suspended", {
              target: b.dataset.suspend,
              disabled: b.dataset.disabled === "true",
            }),
          );
          await renderAdmin();
        })),
  );
  document.querySelector("#announcement-form").onsubmit = (ev) => {
    ev.preventDefault();
    const body = new FormData(ev.target).get("body").trim();
    run(async () => {
      unwrap(await db.from("announcements").insert({ body }));
      announcements = unwrap(
        await db
          .from("announcements")
          .select("*")
          .order("created_at", { ascending: false }),
      );
      await renderAdmin();
    });
  };
  document.querySelectorAll("[data-announcement]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          unwrap(
            await db
              .from("announcements")
              .delete()
              .eq("id", b.dataset.announcement),
          );
          announcements = announcements.filter(
            (a) => a.id !== b.dataset.announcement,
          );
          await renderAdmin();
        })),
  );
}
function startDemo() {
  demo = true;
  user = { id: "demo", email: "demo@littlemoments.example" };
  profile = { display_name: "Ella" };
  try {
    memories =
      JSON.parse(sessionStorage.getItem("little-moments-demo")) || seeds();
  } catch {
    memories = seeds();
  }
  view = "journal";
  message =
    "Demo only: no account is created. Text stays in this tab; attachments are temporary.";
  location.hash = "journal";
  render();
}
async function action(name, id) {
  message = "";
  if ((name === "auth" || name === "signup") && user) {
    location.hash = "journal";
    render();
    return;
  }
  if (name === "auth" || name === "signup") {
    authMode = name === "signup" ? "signup" : "signin";
    authDialog();
  } else if (name === "demo") startDemo();
  else if (name === "view") {
    view = id;
    query = "";
    mood = "";
    render();
  } else if (name === "new" || name === "prompt")
    editor(null, name === "prompt");
  else if (name === "open") await detail(id);
  else if (name === "favorite") {
    await patch(id, { favorite: !memories.find((m) => m.id === id).favorite });
    renderCards();
  } else if (name === "signout") {
    if (!demo) unwrap(await db.auth.signOut());
    demo = false;
    user = null;
    admin = false;
    profile = null;
    memories = [];
    announcements = [];
    view = "journal";
    location.hash = "home";
    render();
  } else if (name === "refresh") {
    if (!demo) { memories = await listMemories(); announcements = unwrap(await db.from("announcements").select("*").order("created_at", { ascending: false })); }
    notify("Journal refreshed."); render();
  } else if (name === "copy") {
    await navigator.clipboard.writeText(user.id);
    notify("Sharing code copied.");
  } else if (name === "export") {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            version: 1,
            exported_at: new Date().toISOString(),
            memories: memories.filter((m) => m.user_id === user.id),
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "little-moments-journal.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } else if (name === "password") {
    if (demo)
      throw Error("Password settings are available after connecting Supabase.");
    unwrap(
      await db.auth.resetPasswordForEmail(user.email, {
        redirectTo: callback(),
      }),
    );
    notify("Password reset email sent.");
  } else if (name === "delete-account") {
    if (demo) throw Error("This demo has no real account to delete.");
    if (
      !confirm(
        "Permanently delete your account and all written memories? Download your data first. Attachments must be deleted beforehand.",
      )
    )
      return;
    unwrap(await db.rpc("delete_my_account"));
    await db.auth.signOut();
    user = null;
    render();
  } else if (name === "privacy") {
    dialog(
      '<span class="eyebrow">YOUR PRIVACY</span><h2>Your story stays yours.</h2><p>Written memories and uploaded files are stored in the operator’s Supabase project. Other users can read a memory only when its owner shares it with their account. Administrators can manage access without journal-reading permission in the app.</p><p>This is not end-to-end encryption. The project owner can access its database and storage. No AI service receives journal content. Export your writing in Settings, and delete memories or your account when you choose.</p><p>Shared recipients can keep downloaded copies. The demo stores writing in this tab only. Sign-in uses browser storage to keep your session.</p>',
    );
  }
}
async function loadAccount(session) {
  user = session?.user || null;
  admin = false; demo = false; profile = null; memories = []; announcements = [];
  closeDialog();
  if (user) {
    profile = unwrap(
      await db.from("profiles").select("*").eq("id", user.id).single(),
    );
    if (profile.suspended) {
      user = null;
      await db.auth.signOut();
      message = "This account is suspended. Contact the app operator.";
    } else {
      admin = unwrap(await db.rpc("is_admin"));
      memories = await listMemories();
      announcements = unwrap(
        await db
          .from("announcements")
          .select("*")
          .order("created_at", { ascending: false }),
      );
    }
    if (user && !["#portfolio", "#home"].includes(location.hash)) history.replaceState(null, "", location.pathname + "#journal");
  }
  loading = false;
  render();
}
window.addEventListener("hashchange", () => render());
let recoveringPassword = false;
async function init() {
  const callbackError = new URLSearchParams(location.search).get('error_description') || new URLSearchParams(location.hash.slice(1)).get('error_description');
  if (callbackError) { message = callbackError; history.replaceState(null, '', location.pathname); }
  if (configError || !configured) {
    loading = false; message = configError || message; render(); return;
  }
  let lifecycle = Promise.resolve();
  db.auth.onAuthStateChange((event, session) => {
    if (!['INITIAL_SESSION', 'SIGNED_IN', 'SIGNED_OUT', 'PASSWORD_RECOVERY'].includes(event)) return;
    if (event === 'PASSWORD_RECOVERY') recoveringPassword = true;
    if (event === 'SIGNED_OUT') recoveringPassword = false;
    if (event === 'SIGNED_IN' && user?.id === session?.user?.id && !demo && !recoveringPassword) return;
    // Run outside the Auth callback lock and serialize account refreshes.
    setTimeout(() => {
      lifecycle = lifecycle.then(async () => {
        if (event === 'SIGNED_IN' && !recoveringPassword) history.replaceState(null, '', location.pathname + '#journal');
        await loadAccount(session);
        if (recoveringPassword && session) { authMode = 'recover'; authDialog(); }
      }).catch(err => {
        loading = false; user = null; profile = null; memories = []; admin = false;
        message = err.message || 'Could not load your account.';
        render();
      });
    }, 0);
  });
  try {
    // The SDK exchanges a PKCE ?code= callback and emits the appropriate auth event.
    const { error } = await db.auth.initialize();
    if (error) {
    if(error.code==='23505')throw Error('That username or item is already in use. Choose another.');
    if(error.code==='23514')throw Error('Check your entry: usernames must be 3–24 lowercase letters/numbers/underscores, start with a letter, and cannot use reserved names.');
    if(error.code==='42501')throw Error('This account does not have permission for that action.');
    throw error;
  }
  } catch (err) {
    loading = false; message = err.message; user = null; render();
  }
}
// Course Build 2/3 additions. All permission checks also exist in SQL.
let staff=false;
let memoryPage=0,lastFilter='';
const oldCards=renderCards;
renderCards=function(){oldCards();const key=[query,mood,view].join('|');if(key!==lastFilter){memoryPage=0;lastFilter=key;}
 const cards=[...document.querySelectorAll('.memory-card')];const pages=Math.max(1,Math.ceil(cards.length/24));memoryPage=Math.min(memoryPage,pages-1);
 cards.forEach((card,i)=>card.hidden=i<memoryPage*24||i>=(memoryPage+1)*24);
 if(pages>1){const controls=document.createElement('div');controls.className='row';controls.innerHTML=`<button class="secondary" id="prev-page" ${memoryPage===0?'disabled':''}>Previous</button><p>Page ${memoryPage+1} of ${pages}</p><button class="secondary" id="next-page" ${memoryPage===pages-1?'disabled':''}>Next</button>`;document.querySelector('.memory-grid').after(controls);controls.querySelector('#prev-page').onclick=()=>{memoryPage--;renderCards();};controls.querySelector('#next-page').onclick=()=>{memoryPage++;renderCards();};}
};
const oldLoadAccount=loadAccount;
loadAccount=async function(session){
 await oldLoadAccount(session);
 if(user&&!demo){staff=unwrap(await db.rpc('is_staff'));applyTheme(profile.dark_mode);if(!profile.username) usernamePage();else render();}
};
function applyTheme(dark){document.documentElement.dataset.theme=dark?'dark':'light';}
function usernamePage(){
 const d=dialog('<h2>Choose your username</h2><p>Choose 3–24 lowercase letters, numbers, or underscores, starting with a letter. This name appears with your shared memories.</p><form><label>Username<input name="username" required pattern="[a-z][a-z0-9_]{2,23}" minlength="3" maxlength="24" autocomplete="username"></label><p class="dialog-status" role="status" hidden></p><button class="primary" type="submit">Save username</button></form>');
 d.querySelector('.close').hidden=true;d.addEventListener('cancel',ev=>ev.preventDefault());
 d.addEventListener('click',ev=>{if(ev.target===d)ev.stopImmediatePropagation();},true);
 formHandler(d,async f=>{unwrap(await db.rpc('choose_username',{chosen:f.get('username')}));await loadAccount(unwrap(await db.auth.getSession()).session);});
}
const oldRenderJournal=renderJournal;
renderJournal=function(){oldRenderJournal();
 if(!demo){
  const nav=document.querySelector('aside nav');
  if(staff)nav.insertAdjacentHTML('beforeend','<button data-action="moderation">Moderation</button>');
  nav.insertAdjacentHTML('beforeend','<button data-action="theme">Toggle dark mode</button>');bind();
 }
};
const oldSettings=renderSettings;
renderSettings=function(){oldSettings();if(demo)return;
 const f=document.querySelector('#profile-form');f.innerHTML=`<label>Username<input value="${e(profile.username||'Choose a username')}" disabled></label><p>Your username identifies your shared writing.</p>`;f.onsubmit=ev=>ev.preventDefault();
 document.querySelector('.settings-grid').insertAdjacentHTML('beforeend','<section class="panel"><h2>Password and data</h2><button class="secondary" data-action="change-password">Change password</button><button class="danger" data-action="delete-data">Delete my data</button><p>Delete my data removes your attachments, memories, shares, reports, profile, and account. Download your writing and attachments first.</p></section>');bind();
};
const oldDetail=detail;
detail=async function(id){await oldDetail(id);if(demo)return;
 const d=document.querySelector('dialog');if(!d)return;
 const name=unwrap(await db.rpc('author_name',{mid:id}));d.querySelector('h2').insertAdjacentHTML('afterend',`<p>By @${e(name||'username pending')}</p>`);
 d.querySelector('.detail-actions').insertAdjacentHTML('beforeend',`<button class="secondary" data-action="report" data-id="${id}">Report</button>`);bind();
};
async function changePasswordPage(){
 const d=dialog('<h2>Change password</h2><p>Use at least 8 characters, including lowercase, uppercase, and a number. Supabase enforces these rules too. Email accounts can also use Forgot password from the sign-in screen.</p><form><label>New password<input type="password" name="password" minlength="8" pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}" required autocomplete="new-password"></label><label>Repeat new password<input type="password" name="repeat" required autocomplete="new-password"></label><p class="dialog-status" role="status" hidden></p><button class="primary" type="submit">Change password</button></form>');
 formHandler(d,async f=>{if(f.get('password')!==f.get('repeat'))throw Error('The passwords do not match.');unwrap(await db.auth.updateUser({password:f.get('password')}));closeDialog();notify('Password changed.');});
}
async function deleteOwnData(){
 if(admin)throw Error('Remove your admin role through the Supabase dashboard before deleting this account.');
 if(!confirm('Permanently delete your account, all writing, and all files? Download your data first.'))return;
 const latest=await listMemories();
 for(const m of latest.filter(m=>m.user_id===user.id)){
  await patchMemory(m.id,{deleted_at:new Date().toISOString()});await purgeMemory(m);
 }
 unwrap(await db.rpc('delete_my_account'));await db.auth.signOut();user=null;staff=false;closeDialog();render();
}
async function reportPage(id){
 const d=dialog('<h2>Report this memory</h2><p>Only moderators and admins can read your report. Keep your explanation under 500 characters.</p><form><label>Reason<textarea name="reason" required minlength="1" maxlength="500" rows="5"></textarea></label><p class="dialog-status" role="status" hidden></p><button class="primary" type="submit">Send report</button></form>');
 formHandler(d,async f=>{const reason=f.get('reason').trim();if(!reason)throw Error('Describe the problem.');unwrap(await db.rpc('report_memory',{mid:id,explanation:reason}));closeDialog();notify('Report sent to the moderation team.');});
}
async function moderationPage(){
 if(!staff)throw Error('Moderator access required.');
 const reports=unwrap(await db.from('reports').select('*').order('created_at',{ascending:false}).limit(300));
 const shared=memories.filter(m=>m.user_id!==user.id);
 document.querySelector('#content').innerHTML=`<section class="page-heading"><div><h1>Moderation</h1><p>Private, unshared memories are excluded. You can hide/remove shared memories and their files, but cannot edit their writing.</p></div></section><section class="panel"><h2>Reports (${reports.length})</h2>${reports.map(r=>`<p><button data-action="open" data-id="${r.memory_id}">Open reported memory</button> · ${e(r.reason)}</p>`).join('')||'<p>No reports to review.</p>'}</section><section class="panel"><h2>Shared memories</h2>${shared.map(m=>`<div class="file-row"><button data-action="open" data-id="${m.id}">${e(m.title)}</button><button data-moderate="hide" data-id="${m.id}">Hide</button><button data-moderate="restore" data-id="${m.id}">Unhide</button><button data-moderate="delete" data-id="${m.id}">Remove</button></div>`).join('')||'<p>No shared memories.</p>'}</section>`;bind();
 document.querySelectorAll('[data-moderate]').forEach(b=>b.onclick=()=>run(async()=>{
  if(!confirm(`Apply ${b.dataset.moderate} to this shared memory? Removal permanently deletes its files too.`))return;
  if(b.dataset.moderate==='delete'){
   const m=memories.find(m=>m.id===b.dataset.id);let files;
   do{files=await listFiles(m.id);if(files.length)unwrap(await db.storage.from('memory-files').remove(files.map(f=>`${m.user_id}/${m.id}/${f.name}`)));}while(files.length===100);
  }
  unwrap(await db.rpc('moderate_memory',{mid:b.dataset.id,operation:b.dataset.moderate}));memories=await listMemories();await moderationPage();
 }));
}
const oldAdmin=renderAdmin;
renderAdmin=async function(){await oldAdmin();
 const mods=unwrap(await db.from('moderators').select('*'));
 const log=unwrap(await db.from('moderation_log').select('*').order('created_at',{ascending:false}).limit(100));
 document.querySelector('#content').insertAdjacentHTML('beforeend',`<section class="panel"><h2>Moderator access</h2><form id="moderator-form"><label>User UID<input name="target" required></label><label>Action<select name="enabled"><option value="true">Add moderator</option><option value="false">Remove moderator</option></select></label><button class="primary" type="submit">Update access</button></form><p>Current moderators: ${mods.map(m=>e(m.user_id)).join(', ')||'none'}</p></section><section class="panel"><h2>Posting blocks</h2><form id="block-form"><label>User UID<input name="target" required></label><label>Action<select name="enabled"><option value="true">Block posting</option><option value="false">Unblock posting</option></select></label><button class="primary" type="submit">Update block</button></form></section><section class="panel"><h2>Moderation log</h2>${log.map(l=>`<p>${e(l.action)} · ${e(l.actor_id)} · ${e(l.created_at)}</p>`).join('')||'<p>No moderation actions.</p>'}</section>`);
 for(const [id,rpc]of[['moderator-form','set_moderator'],['block-form','set_blocked']])document.getElementById(id).onsubmit=ev=>{ev.preventDefault();run(async()=>{const f=new FormData(ev.target);unwrap(await db.rpc(rpc,{target:f.get('target').trim(),enabled:f.get('enabled')==='true'}));await renderAdmin();});};
};
const oldAction=action;
action=async function(name,id){
 if(name==='theme'){profile.dark_mode=!profile.dark_mode;unwrap(await db.from('profiles').update({dark_mode:profile.dark_mode}).eq('id',user.id));applyTheme(profile.dark_mode);}
 else if(name==='change-password')await changePasswordPage();
 else if(name==='delete-data')await deleteOwnData();
 else if(name==='report')await reportPage(id);
 else if(name==='moderation')await moderationPage();
 else if(name==='privacy'){dialog('<h2>Privacy policy</h2><p>Little Moments stores your username, account email, memories, moods, dates, tags, favorites, attachments, theme preference, sharing permissions, and reports in Supabase. Your email is used for authentication. Other users see only memories you share with them and your username.</p><p>Moderators and admins can review shared memories and reports, hide shared content, and remove shared files. Unshared journal entries are private from other app accounts. The Supabase project owner has database access. Storage is access-controlled, not end-to-end encrypted.</p><p>Remove a memory and its files through Trash. Settings → Delete my data deletes your account and its data. Download writing and individual files first. Reports about removed memories are deleted; moderation logs may retain action records with the deleted account identifier cleared. Downloaded copies cannot be recalled.</p><p>Contact the site owner through the portfolio for privacy requests. This policy applies to this app; Google and GitHub also process sign-in under their own policies.</p>');}
 else await oldAction(name,id);
};

init();
