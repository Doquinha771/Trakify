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
  themeColorMeta: $("themeColorMeta")
};

const esc = (value = "") => String(value).replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
}[c]));

function driveImage(id, size = 1200) {
  return id ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w${size}` : "";
}

function youtubeThumb(videoId, quality = "hqdefault") {
  return videoId ? `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/${quality}.jpg` : "";
}

function imageMarkup(primary, fallback, alt = "") {
  const src = primary || fallback;
  if (!src) return "♫";
  return `<img src="${esc(src)}" ${fallback && fallback !== src ? `data-fallback-src="${esc(fallback)}"` : ""} alt="${esc(alt)}" draggable="false" decoding="async">`;
}

function fmt(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  return `${m}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.hidden = true, 3300);
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

function albumFallbackImage(album) {
  return youtubeThumb(album?.discs?.[0]?.youtube, "hqdefault");
}

function coverFor(track) {
  return driveImage(albumById(track?.albumId)?.cover, 600);
}

function coverFallbackFor(track) {
  return youtubeThumb(track?.youtube, "hqdefault");
}

function flattenLibrary(data) {
  const tracks = [];
  (data.albums || []).forEach(album => {
    (album.discs || []).forEach((disc, discIndex) => {
      const discTracks = disc.tracks || [];
      discTracks.forEach((track, trackIndex) => {
        const start = Number(track.start || 0);
        const nextStart = trackIndex < discTracks.length - 1 ? Number(discTracks[trackIndex + 1].start) : null;
        const end = Number.isFinite(nextStart) ? nextStart : null;
        tracks.push({
          ...track,
          youtube: disc.youtube,
          start,
          end,
          duration: end !== null ? fmt(end - start) : (track.duration || ""),
          id: `${album.id}-d${discIndex + 1}-t${trackIndex + 1}`,
          albumId: album.id,
          albumTitle: album.title,
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

  const banner = driveImage(album.banner, 1800);
  const fallback = albumFallbackImage(album);
  const cover = driveImage(album.cover, 700);
  const count = state.tracks.filter(t => t.albumId === album.id).length;

  els.featuredSection.innerHTML = `
    <article class="featured-card reveal-item" data-open-album="${esc(album.id)}">
      <div class="featured-banner" style="background-image:url('${esc(banner)}'),url('${esc(fallback)}')"></div>
      <button class="featured-play" data-play-album="${esc(album.id)}" aria-label="Tocar ${esc(album.title)}">
        ${icon("play", true)}
      </button>
      <div class="featured-content">
        <div class="featured-cover">${imageMarkup(cover, fallback, album.title)}</div>
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
  const cover = album ? driveImage(album.cover, 500) : "";
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
  const cover = driveImage(album.cover, 650);
  const fallback = albumFallbackImage(album);
  return `
    <button class="album-card reveal-item" data-open-album="${esc(album.id)}" style="--delay:${i * 60}ms">
      <span class="album-art">${imageMarkup(cover, fallback, album.title)}</span>
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
      <button class="home-track reveal-item" data-play-track="${esc(track.id)}" style="--delay:${i * 42}ms">
        <span class="home-track-art">${imageMarkup(cover, fallback, track.albumTitle)}</span>
        <span class="home-track-copy">
          <strong>${esc(track.title)}</strong>
          <span>${esc(track.artist)}</span>
        </span>
        ${icon("angle-small-right")}
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
    <div class="track-row reveal-item ${current ? "current" : ""}" data-track-row="${esc(track.id)}" data-play-track="${esc(track.id)}" style="--delay:${Math.min(index, 12) * 28}ms">
      <div class="track-index" data-track-index="${esc(track.id)}" data-index-label="${options.useTrackNumber ? track.trackNumber : index + 1}">${current && state.isPlaying ? icon("play", true) : (options.useTrackNumber ? track.trackNumber : index + 1)}</div>
      <div class="track-copy">
        <span class="track-title">${esc(track.title)}</span>
        <span class="track-subtitle">${esc(track.artist)}${options.showAlbum ? ` · ${esc(track.albumTitle)}` : ""}</span>
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
    return [track.title, track.artist, track.albumTitle].some(value =>
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
  const cover = driveImage(album.cover, 900);
  const banner = driveImage(album.banner, 1900);
  const fallback = albumFallbackImage(album);

  els.albumBanner.style.backgroundImage = `url("${banner}"), url("${fallback}")`;
  els.albumCover.innerHTML = imageMarkup(cover, fallback, album.title);
  els.albumTitle.textContent = album.title;
  els.albumMeta.textContent = `${album.artist} · ${tracks.length} faixas${album.subtitle ? ` · ${album.subtitle}` : ""}`;
  renderTrackList(els.albumTrackList, tracks, { discHeaders: true, useTrackNumber: true });

  setTheme(album.fallbackAccent || "#d96bb6");
  extractImageTheme(banner || fallback, album.fallbackAccent || "#d96bb6", fallback);
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

function extractImageTheme(url, fallback, fallbackUrl = "") {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;
  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 48;
      canvas.height = 48;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, 48, 48);
      const data = ctx.getImageData(0, 0, 48, 48).data;

      let best = null;
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
        if (a < 220) continue;
        const max = Math.max(r,g,b), min = Math.min(r,g,b);
        const saturation = max - min;
        const brightness = (r + g + b) / 3;
        if (brightness < 45 || brightness > 225 || saturation < 28) continue;

        const score = saturation + (180 - Math.abs(brightness - 145)) * .25;
        if (!best || score > best.score) best = { r,g,b,score };
      }

      if (best) {
        const boost = 1.08;
        const r = Math.min(235, Math.round(best.r * boost));
        const g = Math.min(235, Math.round(best.g * boost));
        const b = Math.min(235, Math.round(best.b * boost));
        setTheme(`#${[r,g,b].map(v => v.toString(16).padStart(2,"0")).join("")}`);
      }
    } catch {
      setTheme(fallback);
    }
  };
  img.onerror = () => {
    if (fallbackUrl && fallbackUrl !== url) extractImageTheme(fallbackUrl, fallback, "");
    else setTheme(fallback);
  };
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
  if (source === "local" && "audioSession" in navigator) {
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
  console.warn("Áudio local indisponível:", reason || track.localFile || "sem arquivo");
  setActiveSource("idle");
  state.isPlaying = false;
  setPlayingIcons(false);
  updateTrackRows();
  if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "none";
  showToast("Não foi possível tocar o arquivo local desta faixa.");
}

function playLocalTrack(track, token) {
  if (!track?.localFile || !audioPlayer) {
    playbackUnavailable(track, token, "faixa sem localFile");
    return;
  }

  setActiveSource("local-loading");
  audioPlayer.src = track.localFile;
  audioPlayer.load();

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
    if (activeSource === "local-loading") setActiveSource("local");
    if (activeSource !== "local") return;
    state.isPlaying = true;
    setPlayingIcons(true);
    updateTrackRows();
    startProgressTicker();
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
  });

  audioPlayer.addEventListener("pause", () => {
    if (activeSource !== "local") return;
    state.isPlaying = false;
    setPlayingIcons(false);
    updateTrackRows();
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
  });

  audioPlayer.addEventListener("ended", () => {
    if (activeSource !== "local") return;
    if (state.repeat) {
      audioPlayer.currentTime = 0;
      audioPlayer.play().catch(() => {});
    } else {
      step(1);
    }
  });

  audioPlayer.addEventListener("error", () => {
    const track = currentTrack();
    if (!track || !["local", "local-loading"].includes(activeSource)) return;
    playbackUnavailable(track, playbackToken, "erro ao carregar o MP3 local");
  });
}

function segmentDuration(track = currentTrack()) {
  if (!track || !audioPlayer || !["local", "local-loading"].includes(activeSource)) return 0;
  return Number.isFinite(audioPlayer.duration) ? Math.max(0, audioPlayer.duration) : 0;
}

function startProgressTicker() {
  if (progressTimer) return;
  progressTimer = setInterval(updatePlaybackProgress, 180);
}

function updatePlaybackProgress() {
  const track = currentTrack();
  if (!track || !audioPlayer || !["local", "local-loading"].includes(activeSource)) return;

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
  let tracks = state.tracks.filter(track => track.albumId === id && track.localFile);
  if (disc) tracks = tracks.filter(track => track.disc === Number(disc));
  if (!tracks.length) {
    showToast("Este álbum não possui músicas locais.");
    return;
  }
  playTrack(state.shuffle ? tracks[Math.floor(Math.random() * tracks.length)].id : tracks[0].id);
}

async function playTrack(id) {
  const track = trackById(id);
  if (!track) return;

  if (!track.localFile) {
    showToast("Esta faixa não possui um MP3 local.");
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

  const token = ++playbackToken;
  resetAudio();
  playLocalTrack(track, token);
}

async function togglePlay() {
  if (!state.currentId) {
    const first = state.tracks.find(track => track.localFile);
    if (first) playTrack(first.id);
    return;
  }

  if (activeSource === "local-loading") {
    showToast("Carregando a faixa…");
    return;
  }

  if (activeSource === "local" && audioPlayer) {
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
  const list = queue().filter(track => track.localFile);
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
  document.querySelectorAll("[data-track-row]").forEach(row => {
    const active = row.dataset.trackRow === state.currentId;
    row.classList.toggle("current", active);
    const index = row.querySelector("[data-track-index]");
    if (index) index.innerHTML = active && state.isPlaying ? icon("play", true) : esc(index.dataset.indexLabel || "");
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
  const cover = coverFor(track);
  const coverHtml = imageMarkup(cover, coverFallbackFor(track), track.albumTitle);

  els.miniPlayer.hidden = false;
  els.miniCover.innerHTML = coverHtml;
  els.miniTitle.textContent = track.title;
  els.miniArtist.textContent = track.artist;

  els.nowCover.innerHTML = coverHtml;
  els.nowTitle.textContent = track.title;
  els.nowArtist.textContent = track.artist;

  els.sheetCover.innerHTML = coverHtml;
  els.sheetTitle.textContent = track.title;
  els.sheetArtist.textContent = track.artist;
  els.sheetAlbum.textContent = track.albumTitle;

  document.title = `${track.title} · Trakify`;
  updateFavoriteState();

  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.albumTitle,
      artwork: cover ? [{ src: cover }] : []
    });
  }
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
  if (["local", "local-loading"].includes(activeSource) && audioPlayer) audioPlayer.currentTime = Number(input.value) / 1000 * duration;
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
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

document.addEventListener("keydown", event => {
  if (event.target.matches("input,textarea")) return;
  if (event.code === "Space") {
    event.preventDefault();
    togglePlay();
  }
  if (event.code === "Escape") closeSheet();
});

document.addEventListener("error", event => {
  const img = event.target;
  if (!(img instanceof HTMLImageElement)) return;
  const fallback = img.dataset.fallbackSrc;
  if (fallback && img.src !== fallback) {
    img.dataset.fallbackSrc = "";
    img.src = fallback;
    return;
  }
  const parent = img.parentElement;
  img.remove();
  if (parent && !parent.textContent.trim()) parent.textContent = "♫";
}, true);

loadLibrary();
