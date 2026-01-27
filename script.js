// ----------------- Elements -----------------
const audio = document.getElementById("audio");
const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const fileInput = document.getElementById("fileInput");
const currentSong = document.getElementById("currentSong");
const playlistEl = document.getElementById("playlist");
const playlistSelector = document.getElementById("playlistSelector");
const createPlaylistBtn = document.getElementById("createPlaylistBtn");
const newPlaylistName = document.getElementById("newPlaylistName");
const progressContainer = document.getElementById("progress-container");
const progress = document.getElementById("progress");

// ----------------- Player State -----------------
let playlists = {}; // { name: [{name, file}] }
let currentPlaylist = null;
let currentIndex = 0;
let db;

// ----------------- IndexedDB -----------------
const request = indexedDB.open("MP3_PLAYER_DB", 1);

request.onupgradeneeded = e => {
  db = e.target.result;
  db.createObjectStore("playlists", { keyPath: "name" });
  db.createObjectStore("songs", { keyPath: "id", autoIncrement: true });
};

request.onsuccess = e => {
  db = e.target.result;
  loadFromDB();
};

// ----------------- Load Saved Data -----------------
function loadFromDB() {
  const plTx = db.transaction("playlists", "readonly").objectStore("playlists");
  plTx.getAll().onsuccess = e => {
    e.target.result.forEach(p => playlists[p.name] = []);
    updatePlaylistSelector();

    const songTx = db.transaction("songs", "readonly").objectStore("songs");
    songTx.getAll().onsuccess = ev => {
      ev.target.result.forEach(s => {
        const blob = new Blob([s.data], { type: "audio/mpeg" });
        playlists[s.playlist].push({ name: s.name, file: blob });
      });
      currentPlaylist = Object.keys(playlists)[0] || null;
      updatePlaylistSelector();
      renderPlaylist();
    };
  };
}

// ----------------- Controls -----------------
playBtn.onclick = () => audio.play();
pauseBtn.onclick = () => audio.pause();

document.getElementById("nextBtn").onclick = () => nextSong();
document.getElementById("prevBtn").onclick = () => prevSong();

// ----------------- Create Playlist -----------------
createPlaylistBtn.onclick = () => {
  const name = newPlaylistName.value.trim();
  if (!name || playlists[name]) return;

  playlists[name] = [];
  currentPlaylist = name;
  newPlaylistName.value = "";

  db.transaction("playlists", "readwrite")
    .objectStore("playlists")
    .put({ name });

  updatePlaylistSelector();
  renderPlaylist();
};

// ----------------- Select Playlist -----------------
playlistSelector.onchange = () => {
  currentPlaylist = playlistSelector.value;
  renderPlaylist();
};

// ----------------- Upload Songs -----------------
fileInput.onchange = e => {
  if (!currentPlaylist) return alert("Create or select a playlist first.");

  Array.from(e.target.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result;

      db.transaction("songs", "readwrite")
        .objectStore("songs")
        .add({
          name: file.name,
          playlist: currentPlaylist,
          data
        });

      playlists[currentPlaylist].push({
        name: file.name,
        file: new Blob([data], { type: "audio/mpeg" })
      });

      renderPlaylist();
    };
    reader.readAsArrayBuffer(file);
  });
};

// ----------------- Render Playlist -----------------
function renderPlaylist() {
  playlistEl.innerHTML = "";
  if (!currentPlaylist) return;

  playlists[currentPlaylist].forEach((song, i) => {
    const li = document.createElement("li");
    li.textContent = song.name;
    li.onclick = () => playSong(i);
    playlistEl.appendChild(li);
  });
}

// ----------------- Play Song -----------------
function playSong(index) {
  const song = playlists[currentPlaylist][index];
  if (!song) return;

  currentIndex = index;
  audio.src = URL.createObjectURL(song.file);
  audio.play();
  currentSong.textContent = song.name;

  [...playlistEl.children].forEach((li, i) =>
    li.style.fontWeight = i === index ? "bold" : "normal"
  );
}

// ----------------- Next / Prev -----------------
function nextSong() {
  if (!currentPlaylist) return;
  currentIndex = (currentIndex + 1) % playlists[currentPlaylist].length;
  playSong(currentIndex);
}

function prevSong() {
  if (!currentPlaylist) return;
  currentIndex =
    (currentIndex - 1 + playlists[currentPlaylist].length) %
    playlists[currentPlaylist].length;
  playSong(currentIndex);
}

audio.onended = nextSong;

// ----------------- Progress Bar -----------------
audio.ontimeupdate = () => {
  if (audio.duration)
    progress.style.width =
      (audio.currentTime / audio.duration) * 100 + "%";
};

progressContainer.onclick = e => {
  const rect = progressContainer.getBoundingClientRect();
  audio.currentTime =
    ((e.clientX - rect.left) / rect.width) * audio.duration;
};

// ----------------- Dropdown -----------------
function updatePlaylistSelector() {
  playlistSelector.innerHTML = "";
  Object.keys(playlists).forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    playlistSelector.appendChild(option);
  });
  if (currentPlaylist) playlistSelector.value = currentPlaylist;
}

// ----------------- Draggable Window -----------------
const player = document.getElementById("player");
const titleBar = document.getElementById("titleBar");

let isDragging = false;
let offsetX = 0;
let offsetY = 0;

titleBar.addEventListener("mousedown", (e) => {
  isDragging = true;
  const rect = player.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  let x = e.clientX - offsetX;
  let y = e.clientY - offsetY;

  // keep window on screen
  x = Math.max(0, Math.min(x, window.innerWidth - player.offsetWidth));
  y = Math.max(0, Math.min(y, window.innerHeight - player.offsetHeight));

  player.style.left = x + "px";
  player.style.top = y + "px";
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});