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
  currentCandidates: [],
  audioCandidateIndex: 0,
  query: "",
  lastPlayed: JSON.parse(localStorage.getItem("trakify:lastPlayed") || "null")
};

const $ = id => document.getElementById(id);
const audio = $("audio");

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
  albumPlayBtn: $("albumPlayBtn"),
  albumShuffleBtn: $("albumShuffleBtn"),

  miniPlayer: $("miniPlayer"),
  miniPlayerOpen: $("miniPlayerOpen"),
  miniCover: $("miniCover"),
  miniTitle: $("miniTitle"),
  miniArtist: $("miniArtist"),
  miniPlayBtn: $("miniPlayBtn"),
  miniFavoriteBtn: $("miniFavoriteBtn"),
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

function audioUrls(file) {
  const id = encodeURIComponent(file);
  return [
    `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${id}`,
    `https://drive.google.com/uc?id=${id}&export=download`
  ];
}

function drivePreview(file) {
  return `https://drive.google.com/file/d/${encodeURIComponent(file)}/view`;
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

function coverFor(track) {
  return driveImage(albumById(track?.albumId)?.cover, 600);
}

function flattenLibrary(data) {
  const tracks = [];
  (data.albums || []).forEach(album => {
    (album.discs || []).forEach((disc, discIndex) => {
      (disc.tracks || []).forEach((track, trackIndex) => {
        tracks.push({
          ...track,
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
  const cover = driveImage(album.cover, 700);
  const count = state.tracks.filter(t => t.albumId === album.id).length;

  els.featuredSection.innerHTML = `
    <article class="featured-card reveal-item" data-open-album="${esc(album.id)}">
      <div class="featured-banner" style="background-image:url('${esc(banner)}')"></div>
      <button class="featured-play" data-play-album="${esc(album.id)}" aria-label="Tocar ${esc(album.title)}">
        ${icon("play", true)}
      </button>
      <div class="featured-content">
        <div class="featured-cover">${cover ? `<img src="${esc(cover)}" alt="">` : "♫"}</div>
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
        ${card.image ? `<img src="${esc(card.image)}" alt="">` : icon(card.icon || "music", false)}
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
  return `
    <button class="album-card reveal-item" data-open-album="${esc(album.id)}" style="--delay:${i * 60}ms">
      <span class="album-art">${cover ? `<img src="${esc(cover)}" alt="">` : "♫"}</span>
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
    return `
      <button class="home-track reveal-item" data-play-track="${esc(track.id)}" style="--delay:${i * 42}ms">
        <span class="home-track-art">${cover ? `<img src="${esc(cover)}" alt="">` : ""}</span>
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
      <div class="track-index">${current && !audio.paused ? icon("play", true) : (options.useTrackNumber ? track.trackNumber : index + 1)}</div>
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

  els.albumBanner.style.backgroundImage = `url("${banner}")`;
  els.albumCover.innerHTML = cover ? `<img id="albumColorSource" crossorigin="anonymous" src="${esc(cover)}" alt="">` : "♫";
  els.albumTitle.textContent = album.title;
  els.albumMeta.textContent = `${album.artist} · ${tracks.length} faixas${album.subtitle ? ` · ${album.subtitle}` : ""}`;
  renderTrackList(els.albumTrackList, tracks, { discHeaders: true, useTrackNumber: true });

  setTheme(album.fallbackAccent || "#d96bb6");
  extractImageTheme(banner, album.fallbackAccent || "#d96bb6");
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

function extractImageTheme(url, fallback) {
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
  img.onerror = () => setTheme(fallback);
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

function playAlbum(id, disc = null) {
  let tracks = state.tracks.filter(track => track.albumId === id && track.file);
  if (disc) tracks = tracks.filter(track => track.disc === Number(disc));
  if (!tracks.length) return;
  playTrack(state.shuffle ? tracks[Math.floor(Math.random() * tracks.length)].id : tracks[0].id);
}

function playTrack(id) {
  const track = trackById(id);
  if (!track?.file) {
    showToast("Essa faixa ainda não tem arquivo configurado.");
    return;
  }

  if (state.currentId !== id) {
    state.currentId = id;
    state.currentCandidates = audioUrls(track.file);
    state.audioCandidateIndex = 0;
    audio.src = state.currentCandidates[0];
    localStorage.setItem("trakify:lastPlayed", JSON.stringify(id));
    state.lastPlayed = id;
    updateNowPlaying(track);
    renderQuickCards();
  }

  audio.play().catch(error => {
    console.warn(error);
    if (!tryNextAudioUrl()) {
      showToast("O Google Drive não liberou esta faixa. Confira o compartilhamento.");
    }
  });

  rerenderVisibleLists();
}

function tryNextAudioUrl() {
  if (!state.currentId || state.audioCandidateIndex >= state.currentCandidates.length - 1) return false;
  state.audioCandidateIndex += 1;
  audio.src = state.currentCandidates[state.audioCandidateIndex];
  audio.play().catch(console.warn);
  return true;
}

function togglePlay() {
  if (!state.currentId) {
    const first = state.tracks.find(track => track.file);
    if (first) playTrack(first.id);
    return;
  }
  if (audio.paused) audio.play().catch(() => {
    if (!tryNextAudioUrl()) showToast("Não foi possível reproduzir esta faixa.");
  });
  else audio.pause();
}

function step(direction) {
  const list = queue().filter(track => track.file);
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
  const coverHtml = cover ? `<img src="${esc(cover)}" alt="">` : "♫";

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

  if (!("IntersectionObserver" in window)) {
    items.forEach(item => item.classList.add("is-visible"));
    return;
  }

  revealObserver ||= new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: "50px 0px -20px", threshold: .04 });

  items.forEach(item => revealObserver.observe(item));
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
  if (audio.duration) audio.currentTime = Number(input.value) / 1000 * audio.duration;
}
els.seek.addEventListener("input", () => seekFrom(els.seek));
els.sheetSeek.addEventListener("input", () => seekFrom(els.sheetSeek));

els.volume.addEventListener("input", () => {
  audio.volume = Number(els.volume.value);
  localStorage.setItem("trakify:volume", String(audio.volume));
});

audio.addEventListener("play", () => {
  setPlayingIcons(true);
  rerenderVisibleLists();
});
audio.addEventListener("pause", () => {
  setPlayingIcons(false);
  rerenderVisibleLists();
});
audio.addEventListener("loadedmetadata", () => {
  els.duration.textContent = fmt(audio.duration);
  els.sheetDuration.textContent = fmt(audio.duration);
});
audio.addEventListener("timeupdate", () => {
  const progress = audio.duration ? Math.round(audio.currentTime / audio.duration * 1000) : 0;
  els.currentTime.textContent = fmt(audio.currentTime);
  els.duration.textContent = fmt(audio.duration);
  els.sheetCurrentTime.textContent = fmt(audio.currentTime);
  els.sheetDuration.textContent = fmt(audio.duration);
  els.seek.value = progress;
  els.sheetSeek.value = progress;
  els.miniProgress.style.width = `${progress / 10}%`;
});
audio.addEventListener("ended", () => {
  if (state.repeat) {
    audio.currentTime = 0;
    audio.play().catch(console.warn);
  } else {
    step(1);
  }
});
audio.addEventListener("error", () => {
  console.warn("Falha de áudio", audio.error);
  if (!tryNextAudioUrl()) {
    const track = currentTrack();
    console.warn("Arquivo do Drive:", track?.file ? drivePreview(track.file) : "(sem arquivo)");
    showToast("Drive bloqueou a faixa. Deixe o arquivo como 'Qualquer pessoa com o link'.");
  }
});

const savedVolume = Number(localStorage.getItem("trakify:volume"));
audio.volume = Number.isFinite(savedVolume) && savedVolume >= 0 && savedVolume <= 1 ? savedVolume : .8;
els.volume.value = audio.volume;

if ("mediaSession" in navigator) {
  navigator.mediaSession.setActionHandler("play", () => audio.play());
  navigator.mediaSession.setActionHandler("pause", () => audio.pause());
  navigator.mediaSession.setActionHandler("previoustrack", () => step(-1));
  navigator.mediaSession.setActionHandler("nexttrack", () => step(1));
  navigator.mediaSession.setActionHandler("seekbackward", details => {
    audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset || 10));
  });
  navigator.mediaSession.setActionHandler("seekforward", details => {
    audio.currentTime = Math.min(audio.duration || Infinity, audio.currentTime + (details.seekOffset || 10));
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

document.addEventListener("error", event => {
  const img = event.target;
  if (!(img instanceof HTMLImageElement)) return;
  const parent = img.parentElement;
  img.remove();
  if (parent && !parent.textContent.trim()) parent.textContent = "♫";
}, true);

loadLibrary();
