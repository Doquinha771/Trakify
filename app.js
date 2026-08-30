const state = {
  albums: [],
  tracks: [],
  currentView: "home",
  previousView: "home",
  currentAlbumId: null,
  currentId: null,
  favorites: new Set(JSON.parse(localStorage.getItem("trakify:favorites") || "[]")),
  shuffle: false,
  repeat: false,
  isPlaying: false,
  query: "",
  lastPlayed: JSON.parse(localStorage.getItem("trakify:lastPlayed") || "null")
};

const $ = id => document.getElementById(id);

const els = {
  views: [...document.querySelectorAll(".view")],
  navItems: [...document.querySelectorAll("[data-view]")],
  brandHome: $("brandHome"),
  mobileBrandHome: $("mobileBrandHome"),
  mobileSearchBtn: $("mobileSearchBtn"),
  mobileNotifyBtn: $("mobileNotifyBtn"),
  desktopPageTitle: $("desktopPageTitle"),
  desktopSearchInput: $("desktopSearchInput"),

  featuredSection: $("featuredSection"),
  quickGrid: $("quickGrid"),
  albumGrid: $("albumGrid"),
  homeTrackList: $("homeTrackList"),
  albumNav: $("albumNav"),

  searchInput: $("searchInput"),
  clearSearchBtn: $("clearSearchBtn"),
  searchHeading: $("searchHeading"),
  searchCount: $("searchCount"),
  searchResults: $("searchResults"),
  searchEmpty: $("searchEmpty"),

  favoriteCount: $("favoriteCount"),
  favoriteList: $("favoriteList"),
  favoritesEmpty: $("favoritesEmpty"),

  albumsPageGrid: $("albumsPageGrid"),
  albumsPageCount: $("albumsPageCount"),
  allTrackList: $("allTrackList"),
  allTracksCount: $("allTracksCount"),
  seeAlbumsBtn: $("seeAlbumsBtn"),
  seeTracksBtn: $("seeTracksBtn"),

  albumBanner: $("albumBanner"),
  albumCover: $("albumCover"),
  albumTitle: $("albumTitle"),
  albumMeta: $("albumMeta"),
  albumTrackList: $("albumTrackList"),
  albumBackBtn: $("albumBackBtn"),
  albumBrandHome: $("albumBrandHome"),
  albumPlayBtn: $("albumPlayBtn"),
  albumShuffleBtn: $("albumShuffleBtn"),

  miniPlayer: $("miniPlayer"),
  miniPlayerOpen: $("miniPlayerOpen"),
  miniCover: $("miniCover"),
  miniTitle: $("miniTitle"),
  miniArtist: $("miniArtist"),
  miniPlayBtn: $("miniPlayBtn"),
  miniFavoriteBtn: $("miniFavoriteBtn"),
  miniVolumeBtn: $("miniVolumeBtn"),
  miniProgress: $("miniProgress"),

  nowCover: $("nowCover"),
  nowTitle: $("nowTitle"),
  nowArtist: $("nowArtist"),
  favoriteNowBtn: $("favoriteNowBtn"),
  shuffleBtn: $("shuffleBtn"),
  prevBtn: $("prevBtn"),
  playBtn: $("playBtn"),
  nextBtn: $("nextBtn"),
  repeatBtn: $("repeatBtn"),
  currentTime: $("currentTime"),
  duration: $("duration"),
  seek: $("seek"),
  volume: $("volume"),
  sheetVolume: $("sheetVolume"),
  sheetVolumeValue: $("sheetVolumeValue"),

  nowPlayingSheet: $("nowPlayingSheet"),
  sheetBackdrop: $("sheetBackdrop"),
  closeSheetBtn: $("closeSheetBtn"),
  sheetFavoriteBtn: $("sheetFavoriteBtn"),
  sheetAlbum: $("sheetAlbum"),
  sheetCover: $("sheetCover"),
  sheetTitle: $("sheetTitle"),
  sheetArtist: $("sheetArtist"),
  sheetSeek: $("sheetSeek"),
  sheetCurrentTime: $("sheetCurrentTime"),
  sheetDuration: $("sheetDuration"),
  sheetShuffleBtn: $("sheetShuffleBtn"),
  sheetPrevBtn: $("sheetPrevBtn"),
  sheetPlayBtn: $("sheetPlayBtn"),
  sheetNextBtn: $("sheetNextBtn"),
  sheetRepeatBtn: $("sheetRepeatBtn"),

  toast: $("toast"),
  toastIcon: $("toastIcon"),
  toastTitle: $("toastTitle"),
  toastMessage: $("toastMessage"),
  themeColorMeta: $("themeColorMeta")
};

const esc = (value = "") => String(value).replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
}[c]));

function imageMarkup(primary = "", fallback = "", alt = "") {
  const src = primary || fallback;
  if (!src) return `<span class="fallback-art-symbol" aria-label="${esc(alt || "Música")}">♫</span>`;
  return `<img src="${esc(src)}" alt="${esc(alt)}" draggable="false" decoding="async" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="fallback-art-symbol" hidden aria-hidden="true">♫</span>`;
}

function albumArtwork(albumOrId) {
  const album = typeof albumOrId === "string" ? albumById(albumOrId) : albumOrId;
  return album?.artwork || {};
}

function coverFor(track) {
  return albumArtwork(track?.albumId).cover || "";
}

function coverFallbackFor() {
  return "";
}

function albumFallbackImage(album) {
  return albumArtwork(album).cover || "";
}

function bannerFor(album) {
  return albumArtwork(album).banner || "";
}

function trackArtistLine(track) {
  if (!track) return "";
  return track.remixArtist ? `${track.artist} · Remix por ${track.remixArtist}` : track.artist;
}

function fmt(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  return `${m}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
}

function showToast(message, options = {}) {
  if (!els.toast) return;
  if (els.toastTitle) els.toastTitle.textContent = options.title || "Trakify";
  if (els.toastMessage) els.toastMessage.textContent = message;
  else els.toast.textContent = message;
  if (els.toastIcon) els.toastIcon.innerHTML = icon(options.icon || "music", !!options.solid);
  els.toast.hidden = false;
  els.toast.classList.remove("toast-out");
  requestAnimationFrame(() => els.toast.classList.add("toast-in"));
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    els.toast.classList.remove("toast-in");
    els.toast.classList.add("toast-out");
    setTimeout(() => { els.toast.hidden = true; els.toast.classList.remove("toast-out"); }, 220);
  }, options.duration || 3200);
}

function icon(name, solid = false) {
  return `<i class="fi fi-${solid ? "sr" : "rr"}-${name}"></i>`;
}

function albumById(id) {
  return state.albums.find(album => album.id === id) || null;
}

function trackById(id) {
  return state.tracks.find(track => track.id === id) || null;
}

function flattenLibrary(data) {
  const tracks = [];
  (data.albums || []).forEach(album => {
    (album.discs || []).forEach((disc, discIndex) => {
      (disc.tracks || []).forEach((track, trackIndex) => {
        tracks.push({
          ...track,
          duration: track.duration || "",
          id: `${album.id}-d${discIndex + 1}-t${trackIndex + 1}`,
          albumId: album.id,
          albumTitle: album.title,
          albumArtist: album.artist,
          artist: track.artist || album.artist,
          remixArtist: track.remixArtist || "",
          disc: discIndex + 1,
          discTitle: disc.title || `Disco ${discIndex + 1}`,
          trackNumber: trackIndex + 1
        });
      });
    });
  });
  return tracks;
}

async function loadLibrary() {
  try {
    let data = window.TRAKIFY_LIBRARY || null;

    // Fallback para quem preferir editar somente o JSON.
    if (!data) {
      const response = await fetch("data/library.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data = await response.json();
    }

    state.albums = data.albums || [];
    state.tracks = flattenLibrary(data);

    renderAll();
    setWelcome();
    setView("home", { pushHistory: false });

    if (!state.albums.length) {
      showToast("A biblioteca está vazia.");
    }
  } catch (error) {
    console.error(error);
    showToast("Não foi possível carregar a biblioteca do Trakify.");
  }
}

function setWelcome() {
  const h = new Date().getHours();
  const greeting = h < 12 ? "Bom dia." : h < 18 ? "Boa tarde." : "Boa noite.";
  $("welcomeTitle").textContent = greeting;
}

function renderAll() {
  renderFeatured();
  renderQuickCards();
  renderAlbums();
  renderHomeTracks();
  renderAlbumNav();
  renderSearchResults("");
  renderFavorites();
  renderAlbumsPage();
  renderAllTracks();
}

function renderFeatured() {
  const album = state.albums[0];
  if (!album) {
    els.featuredSection.innerHTML = "";
    return;
  }

  const count = state.tracks.filter(t => t.albumId === album.id).length;

  els.featuredSection.innerHTML = `
    <article class="featured-card reveal-item" data-open-album="${esc(album.id)}">
      <div class="featured-banner ${bannerFor(album) ? "" : "fallback-featured-art"}" ${bannerFor(album) ? `style="background-image:url('${esc(bannerFor(album))}')"` : ""}></div>
      <button class="featured-play" data-play-album="${esc(album.id)}" aria-label="Tocar ${esc(album.title)}">
        ${icon("play", true)}
      </button>
      <div class="featured-content">
        <div class="featured-cover">${imageMarkup(albumArtwork(album).cover, "", album.title)}</div>
        <div class="featured-copy">
          <p>EM DESTAQUE</p>
          <h2>${esc(album.title)}</h2>
          <span>${esc(album.artist)} · ${count} faixas</span>
        </div>
      </div>
    </article>`;
}

function renderQuickCards() {
  const album = state.albums[0];
  const cover = albumArtwork(album).cover || "";
  const discs = album?.discs || [];

  const cards = [
    {
      title: "Músicas curtidas",
      subtitle: `${state.favorites.size} salvas`,
      icon: "heart",
      action: "favorites"
    },
    ...discs.slice(0, 2).map((disc, i) => ({
      title: disc.title || `Disco ${i + 1}`,
      subtitle: album.title,
      image: cover,
      albumId: album.id,
      disc: i + 1
    }))
  ];

  if (state.lastPlayed) {
    const last = trackById(state.lastPlayed);
    if (last) cards.unshift({
      title: last.title,
      subtitle: "Continue ouvindo",
      image: coverFor(last),
      trackId: last.id
    });
  }

  els.quickGrid.innerHTML = cards.slice(0, 4).map((card, i) => `
    <button class="quick-card reveal-item" style="--delay:${i * 55}ms"
      ${card.action ? `data-quick-view="${card.action}"` : ""}
      ${card.trackId ? `data-quick-track="${esc(card.trackId)}"` : ""}
      ${card.albumId ? `data-quick-album="${esc(card.albumId)}" data-disc="${card.disc}"` : ""}>
      <span class="quick-art">
        ${card.image ? imageMarkup(card.image, albumFallbackImage(album), card.title) : icon(card.icon || "music", false)}
      </span>
      <span class="quick-copy">
        <strong>${esc(card.title)}</strong>
        <span>${esc(card.subtitle)}</span>
      </span>
    </button>
  `).join("");
}

function albumCard(album, i = 0) {
  return `
    <button class="album-card reveal-item" data-open-album="${esc(album.id)}" style="--delay:${i * 60}ms">
      <span class="album-art">${imageMarkup(albumArtwork(album).cover, "", album.title)}</span>
      <h3>${esc(album.title)}</h3>
      <p>${esc(album.artist)}</p>
    </button>`;
}

function renderAlbums() {
  els.albumGrid.innerHTML = state.albums.map(albumCard).join("");
}

function renderAlbumsPage() {
  els.albumsPageCount.textContent = `${state.albums.length} ${state.albums.length === 1 ? "álbum" : "álbuns"}`;
  els.albumsPageGrid.innerHTML = state.albums.map(albumCard).join("");
}

function renderHomeTracks() {
  const list = state.tracks.slice(0, 8);
  els.homeTrackList.innerHTML = list.map((track, i) => {
    const cover = coverFor(track);
    const fallback = coverFallbackFor(track);
    return `
      <button class="home-track reveal-item ${state.currentId === track.id ? "current" : ""} ${state.currentId === track.id && state.isPlaying ? "is-playing" : ""}" data-track-card="${esc(track.id)}" data-play-track="${esc(track.id)}" style="--delay:${i * 42}ms">
        <span class="home-track-art">${imageMarkup(cover, fallback, track.albumTitle)}</span>
        <span class="home-track-copy">
          <strong>${esc(track.title)}</strong>
          <span>${esc(trackArtistLine(track))}</span>
        </span>
        <span class="home-track-state" aria-hidden="true"><span></span><span></span><span></span></span>
      </button>`;
  }).join("");
}

function renderAlbumNav() {
  els.albumNav.innerHTML = state.albums.map(album => `
    <button class="album-nav-item" data-open-album="${esc(album.id)}">
      ${icon("music-alt")}<span>${esc(album.title)}</span>
    </button>
  `).join("");
}

function trackRow(track, index, options = {}) {
  const liked = state.favorites.has(track.id);
  const current = state.currentId === track.id;
  return `
    <div class="track-row reveal-item ${current ? "current" : ""} ${current && state.isPlaying ? "is-playing" : ""}" data-track-card="${esc(track.id)}" data-track-row="${esc(track.id)}" data-play-track="${esc(track.id)}" style="--delay:${Math.min(index, 12) * 28}ms">
      <div class="track-index" data-track-index="${esc(track.id)}" data-index-label="${options.useTrackNumber ? track.trackNumber : index + 1}">${current && state.isPlaying ? '<span class="audio-bars" aria-label="Tocando"><i></i><i></i><i></i><i></i></span>' : (options.useTrackNumber ? track.trackNumber : index + 1)}</div>
      <div class="track-copy">
        <span class="track-title">${esc(track.title)}</span>
        <span class="track-subtitle">${esc(trackArtistLine(track))}${options.showAlbum ? ` · ${esc(track.albumTitle)}` : ""}</span>
      </div>
      <span class="track-duration">${esc(track.duration || "—")}</span>
      <button class="track-like ${liked ? "liked" : ""}" data-like="${esc(track.id)}" aria-label="${liked ? "Remover das curtidas" : "Curtir"}">
        ${icon("heart", liked)}
      </button>
    </div>`;
}

function renderTrackList(container, tracks, options = {}) {
  let prevDisc = null;
  container.innerHTML = tracks.map((track, index) => {
    let header = "";
    if (options.discHeaders && track.disc !== prevDisc) {
      prevDisc = track.disc;
      header = `<div class="disc-label">${esc(track.discTitle)}</div>`;
    }
    return header + trackRow(track, index, options);
  }).join("");
  observeReveals();
}

function renderSearchResults(query = state.query) {
  state.query = query.trim().toLowerCase();
  els.clearSearchBtn.hidden = !state.query;

  const result = state.tracks.filter(track => {
    if (!state.query) return true;
    return [track.title, track.artist, track.remixArtist, track.albumTitle].some(value =>
      String(value).toLowerCase().includes(state.query)
    );
  });

  els.searchHeading.textContent = state.query ? "Resultados" : "Sua biblioteca";
  els.searchCount.textContent = `${result.length} ${result.length === 1 ? "música" : "músicas"}`;
  els.searchEmpty.hidden = result.length > 0;
  renderTrackList(els.searchResults, result, { showAlbum: true });
}

function renderFavorites() {
  const favorites = state.tracks.filter(track => state.favorites.has(track.id));
  els.favoriteCount.textContent = `${favorites.length} ${favorites.length === 1 ? "música" : "músicas"}`;
  els.favoritesEmpty.hidden = favorites.length > 0;
  renderTrackList(els.favoriteList, favorites, { showAlbum: true });
  renderQuickCards();
}

function renderAllTracks() {
  els.allTracksCount.textContent = `${state.tracks.length} músicas`;
  renderTrackList(els.allTrackList, state.tracks, { showAlbum: true });
}

function renderAlbum(id) {
  const album = albumById(id);
  if (!album) return;

  state.currentAlbumId = id;
  const tracks = state.tracks.filter(track => track.albumId === id);
  const banner = bannerFor(album);
  els.albumBanner.style.backgroundImage = banner ? `url("${banner}")` : "none";
  els.albumBanner.classList.toggle("fallback-album-art", !banner);
  els.albumCover.innerHTML = imageMarkup(albumArtwork(album).cover, "", album.title);
  els.albumTitle.textContent = album.title;
  els.albumMeta.textContent = `${album.artist} · ${tracks.length} faixas${album.subtitle ? ` · ${album.subtitle}` : ""}`;
  renderTrackList(els.albumTrackList, tracks, { discHeaders: true, useTrackNumber: true });

  setTheme(album.fallbackAccent || "#d96bb6");
  updateNavActive(null);
}

function setTheme(hex) {
  const rgb = hexToRgb(hex) || { r: 217, g: 107, b: 182 };
  document.documentElement.style.setProperty("--accent", hex);
  document.documentElement.style.setProperty("--accent-rgb", `${rgb.r},${rgb.g},${rgb.b}`);
  const dark = `rgb(${Math.round(rgb.r * .34)},${Math.round(rgb.g * .34)},${Math.round(rgb.b * .34)})`;
  document.documentElement.style.setProperty("--accent-dark", dark);
  els.themeColorMeta.setAttribute("content", dark);
}

function hexToRgb(hex) {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return match ? {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16)
  } : null;
}

function setView(view, options = {}) {
  if (state.currentView !== "album") state.previousView = state.currentView;
  state.currentView = view;
  document.body.classList.toggle("album-open", view === "album");

  els.views.forEach(el => {
    el.hidden = el.id !== `${view}View`;
  });

  const titles = {
    home: "Início",
    search: "Buscar",
    favorites: "Curtidas",
    albums: "Álbuns",
    tracks: "Músicas",
    album: albumById(state.currentAlbumId)?.title || "Álbum"
  };
  els.desktopPageTitle.textContent = titles[view] || "Trakify";

  if (view !== "album") {
    setTheme("#d96bb6");
  }

  updateNavActive(["home","search","favorites"].includes(view) ? view : null);
  window.scrollTo({ top: 0, behavior: options.instant ? "auto" : "smooth" });

  if (view === "search") {
    setTimeout(() => {
      if (window.innerWidth < 860) els.searchInput.focus({ preventScroll: true });
    }, 100);
  }

  observeReveals();
}

function updateNavActive(view) {
  els.navItems.forEach(item => item.classList.toggle("active", item.dataset.view === view));
}

function openAlbum(id) {
  state.previousView = state.currentView === "album" ? "home" : state.currentView;
  renderAlbum(id);
  setView("album");
}

function backFromAlbum() {
  setView(state.previousView || "home", { instant: true });
}

function currentTrack() {
  return trackById(state.currentId);
}

function queue() {
  if (state.currentAlbumId && state.currentView === "album") {
    return state.tracks.filter(track => track.albumId === state.currentAlbumId);
  }
  return state.tracks;
}

let progressTimer = null;
let segmentTransitioning = false;

let activeSource = "idle";
let playbackToken = 0;
const audioPlayer = document.getElementById("audioPlayer");

function setActiveSource(source) {
  activeSource = source;
  document.body.dataset.audioSource = source;
  if (source === "archive" && "audioSession" in navigator) {
    try { navigator.audioSession.type = "playback"; } catch {}
  }
}

function resetAudio() {
  setActiveSource("idle");
  if (!audioPlayer) return;
  try { audioPlayer.pause(); } catch {}
  audioPlayer.removeAttribute("src");
  try { audioPlayer.load(); } catch {}
}

function playbackUnavailable(track, token, reason = "") {
  if (token !== playbackToken || currentTrack()?.id !== track.id) return;
  console.warn("Áudio do Internet Archive indisponível:", reason || track.archiveUrl || "sem URL");
  setActiveSource("idle");
  state.isPlaying = false;
  setPlayingIcons(false);
  updateTrackRows();
  if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "none";
  showToast("Não foi possível carregar esta faixa do Internet Archive.");
}

function playArchiveTrack(track, token) {
  if (!track?.archiveUrl || !audioPlayer) {
    playbackUnavailable(track, token, "faixa sem URL do Internet Archive");
    return;
  }

  setActiveSource("archive-loading");
  let archiveUrl;
  try {
    archiveUrl = new URL(track.archiveUrl).href;
  } catch {
    playbackUnavailable(track, token, "URL do Internet Archive inválida");
    return;
  }

  audioPlayer.preload = "auto";
  audioPlayer.src = archiveUrl;
  const playPromise = audioPlayer.play();
  if (playPromise?.catch) {
    playPromise.catch(error => {
      if (token !== playbackToken || currentTrack()?.id !== track.id) return;
      playbackUnavailable(track, token, error?.message || "falha ao iniciar reprodução");
    });
  }
}

if (audioPlayer) {
  const saved = Number(localStorage.getItem("trakify:volume"));
  audioPlayer.volume = Number.isFinite(saved) ? Math.max(0, Math.min(1, saved)) : .8;

  audioPlayer.addEventListener("playing", () => {
    if (activeSource === "archive-loading") setActiveSource("archive");
    if (activeSource !== "archive") return;
    state.isPlaying = true;
    setPlayingIcons(true);
    updateTrackRows();
    startProgressTicker();
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
    const track = currentTrack();
    if (track) notifyNowPlaying(track);
  });

  audioPlayer.addEventListener("pause", () => {
    if (activeSource !== "archive") return;
    state.isPlaying = false;
    setPlayingIcons(false);
    updateTrackRows();
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
  });

  audioPlayer.addEventListener("ended", () => {
    if (activeSource !== "archive") return;
    if (state.repeat) {
      audioPlayer.currentTime = 0;
      audioPlayer.play().catch(() => {});
    } else {
      step(1);
    }
  });

  audioPlayer.addEventListener("error", () => {
    const track = currentTrack();
    if (!track || !["archive", "archive-loading"].includes(activeSource)) return;
    let expected = "";
    try { expected = new URL(track.archiveUrl).href; } catch {}
    if (expected && audioPlayer.currentSrc && audioPlayer.currentSrc !== expected) return;
    const code = audioPlayer.error?.code ? ` (código ${audioPlayer.error.code})` : "";
    playbackUnavailable(track, playbackToken, `erro ao carregar o MP3 do Internet Archive${code}`);
  });
}

function segmentDuration(track = currentTrack()) {
  if (!track || !audioPlayer || !["archive", "archive-loading"].includes(activeSource)) return 0;
  return Number.isFinite(audioPlayer.duration) ? Math.max(0, audioPlayer.duration) : 0;
}

function startProgressTicker() {
  if (progressTimer) return;
  progressTimer = setInterval(updatePlaybackProgress, 180);
}

function updatePlaybackProgress() {
  const track = currentTrack();
  if (!track || !audioPlayer || !["archive", "archive-loading"].includes(activeSource)) return;

  const duration = segmentDuration(track);
  const current = Math.max(0, Number(audioPlayer.currentTime || 0));
  const progress = duration > 0 ? Math.max(0, Math.min(1000, Math.round(current / duration * 1000))) : 0;

  els.currentTime.textContent = fmt(current);
  els.duration.textContent = duration > 0 ? fmt(duration) : (track.duration || "—");
  els.sheetCurrentTime.textContent = fmt(current);
  els.sheetDuration.textContent = duration > 0 ? fmt(duration) : (track.duration || "—");
  els.seek.value = progress;
  els.sheetSeek.value = progress;
  els.miniProgress.style.width = `${progress / 10}%`;

  if ("mediaSession" in navigator && duration > 0 && Number.isFinite(current)) {
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: audioPlayer.playbackRate || 1,
        position: Math.min(duration, current)
      });
    } catch {}
  }
}

function handleSegmentEnd() {
  if (state.repeat && audioPlayer) {
    audioPlayer.currentTime = 0;
    audioPlayer.play().catch(() => {});
  } else {
    step(1);
  }
}

function playAlbum(id, disc = null) {
  let tracks = state.tracks.filter(track => track.albumId === id && track.archiveUrl);
  if (disc) tracks = tracks.filter(track => track.disc === Number(disc));
  if (!tracks.length) {
    showToast("Este álbum não possui faixas disponíveis no Internet Archive.");
    return;
  }
  playTrack(state.shuffle ? tracks[Math.floor(Math.random() * tracks.length)].id : tracks[0].id);
}

async function playTrack(id) {
  const track = trackById(id);
  if (!track) return;

  if (!track.archiveUrl) {
    showToast("Esta faixa não possui uma URL do Internet Archive.");
    return;
  }

  const changed = state.currentId !== id;
  if (changed) {
    state.currentId = id;
    localStorage.setItem("trakify:lastPlayed", JSON.stringify(id));
    state.lastPlayed = id;
    updateNowPlaying(track);
    renderQuickCards();
  }

  state.isPlaying = false;
  setPlayingIcons(false);
  updateTrackRows();

  resetAudio();
  const token = ++playbackToken;
  playArchiveTrack(track, token);
}

async function togglePlay() {
  if (!state.currentId) {
    const first = state.tracks.find(track => track.archiveUrl);
    if (first) playTrack(first.id);
    return;
  }

  if (activeSource === "archive-loading") {
    showToast("Carregando a faixa…");
    return;
  }

  if (activeSource === "archive" && audioPlayer) {
    if (audioPlayer.paused) {
      if ("audioSession" in navigator) {
        try { navigator.audioSession.type = "playback"; } catch {}
      }
      audioPlayer.play().catch(() => {});
    } else {
      audioPlayer.pause();
    }
    return;
  }

  playTrack(state.currentId);
}

function step(direction) {
  const list = queue().filter(track => track.archiveUrl);
  if (!list.length) return;

  let index = list.findIndex(track => track.id === state.currentId);
  if (index < 0) index = 0;

  if (state.shuffle && list.length > 1) {
    let next = index;
    while (next === index) next = Math.floor(Math.random() * list.length);
    index = next;
  } else {
    index = (index + direction + list.length) % list.length;
  }

  playTrack(list[index].id);
}

function updateTrackRows() {
  document.querySelectorAll("[data-track-card]").forEach(card => {
    const active = card.dataset.trackCard === state.currentId;
    card.classList.toggle("current", active);
    card.classList.toggle("is-playing", active && state.isPlaying);
  });
  document.querySelectorAll("[data-track-row]").forEach(row => {
    const active = row.dataset.trackRow === state.currentId;
    const index = row.querySelector("[data-track-index]");
    if (index) index.innerHTML = active && state.isPlaying
      ? '<span class="audio-bars" aria-label="Tocando"><i></i><i></i><i></i><i></i></span>'
      : esc(index.dataset.indexLabel || "");
  });
}

function toggleFavorite(id) {
  if (!id) return;
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);

  localStorage.setItem("trakify:favorites", JSON.stringify([...state.favorites]));
  renderFavorites();
  updateFavoriteState();
  rerenderVisibleLists();
}

function updateFavoriteState() {
  const liked = state.currentId && state.favorites.has(state.currentId);
  [els.favoriteNowBtn, els.miniFavoriteBtn, els.sheetFavoriteBtn].forEach(button => {
    if (!button) return;
    button.classList.toggle("active", !!liked);
    button.innerHTML = icon("heart", !!liked);
  });
}

function updateNowPlaying(track) {
  const album = albumById(track.albumId);
  const cover = albumArtwork(album).cover || "";
  const coverHtml = imageMarkup(cover, "", track.albumTitle);
  const artistLine = trackArtistLine(track);

  els.miniPlayer.hidden = false;
  els.miniCover.innerHTML = coverHtml;
  els.miniTitle.textContent = track.title;
  els.miniArtist.textContent = artistLine;

  els.nowCover.innerHTML = coverHtml;
  els.nowTitle.textContent = track.title;
  els.nowArtist.textContent = artistLine;

  els.sheetCover.innerHTML = coverHtml;
  els.sheetTitle.textContent = track.title;
  els.sheetArtist.textContent = artistLine;
  els.sheetAlbum.textContent = track.albumTitle;

  document.title = `${track.title} · Trakify`;
  updateFavoriteState();

  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: artistLine,
      album: track.albumTitle,
      artwork: cover ? [{ src: new URL(cover, location.href).href }] : []
    });
  }
}

async function syncNotificationButton() {
  if (!els.mobileNotifyBtn || !("Notification" in window)) return;
  const granted = Notification.permission === "granted";
  els.mobileNotifyBtn.classList.toggle("active", granted);
  els.mobileNotifyBtn.setAttribute("aria-label", granted ? "Notificações ativadas" : "Ativar notificações");
}

async function requestNotifications() {
  if (!("Notification" in window)) {
    showToast("Este navegador não oferece notificações web.", { icon: "bell" });
    return;
  }
  if (Notification.permission === "granted") {
    showToast("Notificações já estão ativadas.", { icon: "bell", solid: true });
    return;
  }
  if (Notification.permission === "denied") {
    showToast("As notificações foram bloqueadas nas permissões do navegador.", { icon: "bell" });
    return;
  }
  const permission = await Notification.requestPermission();
  await syncNotificationButton();
  showToast(permission === "granted" ? "Notificações ativadas para o Trakify." : "Notificações continuam desativadas.", { icon: "bell", solid: permission === "granted" });
}

async function notifyNowPlaying(track) {
  if (!("Notification" in window) || Notification.permission !== "granted" || document.visibilityState === "visible") return;
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (!reg) return;
    const album = albumById(track.albumId);
    const iconUrl = albumArtwork(album).notificationIcon || albumArtwork(album).cover || "";
    const options = {
      body: trackArtistLine(track),
      tag: "trakify-now-playing",
      renotify: false,
      silent: true,
      data: { url: location.href }
    };
    if (iconUrl) options.icon = new URL(iconUrl, location.href).href;
    await reg.showNotification(track.title, options);
  } catch {}
}

function setPlayingIcons(playing) {
  const markup = icon(playing ? "pause" : "play", true);
  [els.playBtn, els.miniPlayBtn, els.sheetPlayBtn].forEach(button => {
    if (button) button.innerHTML = markup;
  });
}

function setToggleState() {
  [els.shuffleBtn, els.sheetShuffleBtn, els.albumShuffleBtn].forEach(button => {
    button?.classList.toggle("active", state.shuffle);
  });
  [els.repeatBtn, els.sheetRepeatBtn].forEach(button => {
    button?.classList.toggle("active", state.repeat);
  });
}

function rerenderVisibleLists() {
  if (state.currentView === "album" && state.currentAlbumId) {
    const tracks = state.tracks.filter(track => track.albumId === state.currentAlbumId);
    renderTrackList(els.albumTrackList, tracks, { discHeaders: true, useTrackNumber: true });
  }
  if (state.currentView === "search") renderSearchResults(state.query);
  if (state.currentView === "favorites") renderFavorites();
  if (state.currentView === "tracks") renderAllTracks();
}

function openSheet() {
  if (!state.currentId || window.innerWidth >= 860) return;
  els.nowPlayingSheet.classList.add("open");
  els.nowPlayingSheet.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeSheet() {
  els.nowPlayingSheet.classList.remove("open");
  els.nowPlayingSheet.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

let revealObserver;
function observeReveals() {
  const items = [...document.querySelectorAll(".reveal-item:not(.is-visible)")];
  if (!items.length) return;
  if (!("IntersectionObserver" in window)) { items.forEach(item => item.classList.add("is-visible")); return; }
  items.forEach(item => item.classList.add("reveal-ready"));
  revealObserver ||= new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); revealObserver.unobserve(entry.target); }
    });
  }, { rootMargin: "80px 0px 20px", threshold: .01 });
  items.forEach(item => { revealObserver.observe(item); setTimeout(() => item.classList.add("is-visible"), 700); });
}

/* Delegated interactions */
document.addEventListener("click", event => {
  const playAlbumTarget = event.target.closest("[data-play-album]");
  if (playAlbumTarget) {
    event.stopPropagation();
    playAlbum(playAlbumTarget.dataset.playAlbum);
    return;
  }

  const albumTarget = event.target.closest("[data-open-album]");
  if (albumTarget) {
    openAlbum(albumTarget.dataset.openAlbum);
    return;
  }

  const like = event.target.closest("[data-like]");
  if (like) {
    event.stopPropagation();
    toggleFavorite(like.dataset.like);
    return;
  }

  const playTrackTarget = event.target.closest("[data-play-track]");
  if (playTrackTarget) {
    playTrack(playTrackTarget.dataset.playTrack);
    return;
  }

  const quickView = event.target.closest("[data-quick-view]");
  if (quickView) {
    setView(quickView.dataset.quickView);
    return;
  }

  const quickTrack = event.target.closest("[data-quick-track]");
  if (quickTrack) {
    playTrack(quickTrack.dataset.quickTrack);
    return;
  }

  const quickAlbum = event.target.closest("[data-quick-album]");
  if (quickAlbum) {
    state.shuffle = false;
    setToggleState();
    playAlbum(quickAlbum.dataset.quickAlbum, quickAlbum.dataset.disc);
  }
});

/* Navigation */
els.brandHome?.addEventListener("click", () => setView("home"));
els.mobileBrandHome.addEventListener("click", () => setView("home"));
els.mobileSearchBtn.addEventListener("click", () => setView("search"));
els.mobileNotifyBtn?.addEventListener("click", requestNotifications);
els.navItems.forEach(item => item.addEventListener("click", () => setView(item.dataset.view)));
els.seeAlbumsBtn.addEventListener("click", () => setView("albums"));
els.seeTracksBtn.addEventListener("click", () => setView("tracks"));
els.albumBackBtn.addEventListener("click", backFromAlbum);
els.albumBrandHome?.addEventListener("click", () => setView("home"));

els.albumPlayBtn.addEventListener("click", () => {
  if (state.currentAlbumId) playAlbum(state.currentAlbumId);
});
els.albumShuffleBtn.addEventListener("click", () => {
  state.shuffle = !state.shuffle;
  setToggleState();
  if (state.shuffle && state.currentAlbumId) playAlbum(state.currentAlbumId);
});

/* Search */
function syncSearch(value) {
  els.searchInput.value = value;
  els.desktopSearchInput.value = value;
  renderSearchResults(value);
}

els.searchInput.addEventListener("input", () => syncSearch(els.searchInput.value));
els.desktopSearchInput.addEventListener("input", () => {
  syncSearch(els.desktopSearchInput.value);
  if (els.desktopSearchInput.value.trim()) setView("search", { instant: true });
});
els.clearSearchBtn.addEventListener("click", () => {
  syncSearch("");
  els.searchInput.focus();
});

/* Player */
els.playBtn.addEventListener("click", togglePlay);
els.miniPlayBtn.addEventListener("click", togglePlay);
els.sheetPlayBtn.addEventListener("click", togglePlay);

els.prevBtn.addEventListener("click", () => step(-1));
els.sheetPrevBtn.addEventListener("click", () => step(-1));
els.nextBtn.addEventListener("click", () => step(1));
els.sheetNextBtn.addEventListener("click", () => step(1));

function toggleShuffle() {
  state.shuffle = !state.shuffle;
  setToggleState();
}
function toggleRepeat() {
  state.repeat = !state.repeat;
  setToggleState();
}
els.shuffleBtn.addEventListener("click", toggleShuffle);
els.sheetShuffleBtn.addEventListener("click", toggleShuffle);
els.repeatBtn.addEventListener("click", toggleRepeat);
els.sheetRepeatBtn.addEventListener("click", toggleRepeat);

els.favoriteNowBtn.addEventListener("click", () => toggleFavorite(state.currentId));
els.miniFavoriteBtn.addEventListener("click", () => toggleFavorite(state.currentId));
els.sheetFavoriteBtn.addEventListener("click", () => toggleFavorite(state.currentId));

els.miniPlayerOpen.addEventListener("click", openSheet);
els.closeSheetBtn.addEventListener("click", closeSheet);
els.sheetBackdrop.addEventListener("click", closeSheet);

function seekFrom(input) {
  const track=currentTrack(); if(!track) return; const duration=segmentDuration(track); if(!duration) return;
  if (["archive", "archive-loading"].includes(activeSource) && audioPlayer) audioPlayer.currentTime = Number(input.value) / 1000 * duration;
  updatePlaybackProgress();
}
els.seek.addEventListener("input", () => seekFrom(els.seek));
els.sheetSeek.addEventListener("input", () => seekFrom(els.sheetSeek));

const savedVolume = Number(localStorage.getItem("trakify:volume"));
const initialVolume = Number.isFinite(savedVolume) && savedVolume >= 0 && savedVolume <= 1 ? savedVolume : .8;

function applyVolume(value) {
  value = Math.max(0, Math.min(1, Number(value)));
  localStorage.setItem("trakify:volume", String(value));
  if (value > 0) localStorage.setItem("trakify:lastNonZeroVolume", String(value));
  if (audioPlayer) { audioPlayer.volume = value; audioPlayer.muted = value === 0; }
  if (els.volume) els.volume.value = value;
  if (els.sheetVolume) els.sheetVolume.value = value;
  if (els.sheetVolumeValue) els.sheetVolumeValue.textContent = `${Math.round(value * 100)}%`;
  if (els.miniVolumeBtn) { els.miniVolumeBtn.innerHTML = icon("volume", false); els.miniVolumeBtn.classList.toggle("muted", value === 0); }
}
applyVolume(initialVolume);
els.volume?.addEventListener("input", () => applyVolume(els.volume.value));
els.sheetVolume?.addEventListener("input", () => applyVolume(els.sheetVolume.value));
els.miniVolumeBtn?.addEventListener("click", () => {
  const current = Number(localStorage.getItem("trakify:volume") || 0);
  const restore = Number(localStorage.getItem("trakify:lastNonZeroVolume") || .8);
  applyVolume(current > 0 ? 0 : Math.max(.05, Math.min(1, restore)));
});

if ("audioSession" in navigator) {
  try { navigator.audioSession.type = "playback"; } catch {}
}

if (audioPlayer) {
  try { audioPlayer.disableRemotePlayback = true; } catch {}
}

if ("mediaSession" in navigator) {
  navigator.mediaSession.setActionHandler("play", () => togglePlay());
  navigator.mediaSession.setActionHandler("pause", () => audioPlayer?.pause());
  navigator.mediaSession.setActionHandler("previoustrack", () => step(-1));
  navigator.mediaSession.setActionHandler("nexttrack", () => step(1));
  navigator.mediaSession.setActionHandler("seekbackward", details => {
    if (!audioPlayer) return;
    audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - (details.seekOffset || 10));
  });
  navigator.mediaSession.setActionHandler("seekforward", details => {
    if (!audioPlayer) return;
    audioPlayer.currentTime = Math.min(audioPlayer.duration || Infinity, audioPlayer.currentTime + (details.seekOffset || 10));
  });
  try {
    navigator.mediaSession.setActionHandler("seekto", details => {
      if (!audioPlayer || !Number.isFinite(details.seekTime)) return;
      audioPlayer.currentTime = Math.max(0, Math.min(audioPlayer.duration || Infinity, details.seekTime));
    });
  } catch {}
}

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("sw.js", { updateViaCache: "none" });
      await registration.update();
    } catch {}
  });
}

document.addEventListener("keydown", event => {
  if (event.target.matches("input,textarea")) return;
  if (event.code === "Space") {
    event.preventDefault();
    togglePlay();
  }
  if (event.code === "Escape") closeSheet();
});



syncNotificationButton();
loadLibrary();
