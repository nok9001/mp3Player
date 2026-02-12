/* =====================================================
   DESKTOP SYSTEM SCRIPT - IMPROVED VERSION
   
   ┌─ MOVIE PLAYER SETUP ─────────────────────────────┐
   │ To add movies, call this in the code (not UI):   │
   │                                                   │
   │ addMovieToDatabase("Movie Name", "path/file.mp4")│
   │                                                   │
   │ Example usage (add to bottom of this file):      │
   │ addMovieToDatabase("Interstellar", "music/movie1.mp4");  │
   │ addMovieToDatabase("Inception", "music/movie2.mp4");     │
   │                                                   │
   │ Movies will load from the 'music/' folder        │
   │ (or wherever you keep your video files)          │
   └─────────────────────────────────────────────────┘
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

  /* ================= CLOCK ================= */
  const clock = document.getElementById("clock");

  function updateClock() {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  setInterval(updateClock, 1000);
  updateClock();

  /* ================= WINDOW CONTROL - ONLY MUSIC & NOTES ================= */
  function openWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    win.style.display = "block";
    if (!win.style.left) {
      win.style.left = "50%";
      win.style.top = "50%";
      win.style.transform = "translate(-50%, -50%)";
    }
  }

  function closeWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    win.style.display = "none";
  }

  // Expose music and video player functions - friends can use both
  window.openWindow = openWindow;
  window.closeWindow = closeWindow;
  window.openMusic = () => openWindow("musicWindow");
  window.closeMusic = () => closeWindow("musicWindow");
  window.openCidwo = () => openWindow("cidwoWindow");
  window.closeCidwo = () => closeWindow("cidwoWindow");
  window.openChat = () => openWindow("chatWindow");
  window.closeChat = () => closeWindow("chatWindow");
  
  // Block access to notes only
  window.openNotes = () => { console.log("Notes are for the owner only!"); };
  window.closeNotes = () => { };

  /* ================= CLIENT-SIDE CHAT SYSTEM (NO SERVER NEEDED) ================= */
  
  let currentUser = null;
  let currentChatId = null;
  let allUsers = [];

  // Get all data from localStorage
  function getChatData() {
    const data = localStorage.getItem('chatAppData');
    return data ? JSON.parse(data) : {
      users: {},
      groups: {},
      messages: [],
      userChats: {}
    };
  }

  // Save all data to localStorage
  function saveChatData(data) {
    localStorage.setItem('chatAppData', JSON.stringify(data));
  }

  window.loginToChat = function() {
    const username = document.getElementById('usernameInput').value.trim();
    if (!username) {
      alert('Please enter a username');
      return;
    }

    const data = getChatData();

    // Create user if doesn't exist
    if (!data.users[username]) {
      data.users[username] = {
        username,
        createdAt: new Date().toISOString()
      };
      data.userChats[username] = {
        groups: [],
        direct: []
      };
      saveChatData(data);
    }

    currentUser = username;
    document.getElementById('currentUserDisplay').textContent = `👤 ${username}`;
    
    // Hide login, show chat
    document.getElementById('loginWindow').style.display = 'none';
    document.getElementById('chatWindow').style.display = 'block';

    // Load user's chats
    loadUserChats();
    refreshUsersList();
  };

  window.logoutChat = function() {
    currentUser = null;
    currentChatId = null;
    document.getElementById('chatWindow').style.display = 'none';
    document.getElementById('loginWindow').style.display = 'block';
    document.getElementById('usernameInput').value = '';
    document.getElementById('messagesContainer').innerHTML = '';
    document.getElementById('directList').innerHTML = '';
    document.getElementById('groupList').innerHTML = '';
  };

  function loadUserChats() {
    const data = getChatData();
    const userChats = data.userChats[currentUser] || { groups: [], direct: [] };

    // Load direct chats
    const directList = document.getElementById('directList');
    directList.innerHTML = '';
    userChats.direct.forEach(friend => {
      const li = document.createElement('li');
      li.textContent = friend;
      li.onclick = () => openChat(friend, 'direct');
      directList.appendChild(li);
    });

    // Load groups
    const groupList = document.getElementById('groupList');
    groupList.innerHTML = '';
    
    userChats.groups.forEach(groupId => {
      if (data.groups[groupId]) {
        const group = data.groups[groupId];
        const li = document.createElement('li');
        li.textContent = group.name;
        li.onclick = () => openChat(groupId, 'group');
        groupList.appendChild(li);
      }
    });
  }

  function refreshUsersList() {
    const data = getChatData();
    allUsers = Object.keys(data.users).map(username => ({
      username,
      createdAt: data.users[username].createdAt
    }));
  }

  window.openNewDirect = function() {
    const select = document.getElementById('friendSelect');
    select.innerHTML = '<option value="">-- Select a friend --</option>';
    
    allUsers.forEach(user => {
      if (user.username !== currentUser) {
        const option = document.createElement('option');
        option.value = user.username;
        option.textContent = user.username;
        select.appendChild(option);
      }
    });

    document.getElementById('newDirectDialog').style.display = 'block';
  };

  window.closeNewDirect = function() {
    document.getElementById('newDirectDialog').style.display = 'none';
  };

  window.startDirectChat = function() {
    const friend = document.getElementById('friendSelect').value;
    if (!friend) {
      alert('Please select a friend');
      return;
    }
    closeNewDirect();
    
    // Add to user's direct chats
    const data = getChatData();
    if (!data.userChats[currentUser].direct.includes(friend)) {
      data.userChats[currentUser].direct.push(friend);
      saveChatData(data);
    }
    
    loadUserChats();
    openChat(friend, 'direct');
  };

  window.openNewGroup = function() {
    document.getElementById('newGroupDialog').style.display = 'block';
  };

  window.closeNewGroup = function() {
    document.getElementById('newGroupDialog').style.display = 'none';
    document.getElementById('groupNameInput').value = '';
    document.getElementById('groupMembersInput').value = '';
  };

  window.createGroup = function() {
    const groupName = document.getElementById('groupNameInput').value.trim();
    const membersText = document.getElementById('groupMembersInput').value.trim();

    if (!groupName) {
      alert('Please enter a group name');
      return;
    }

    const members = membersText.split(',').map(m => m.trim()).filter(m => m && m !== currentUser);
    const data = getChatData();

    const groupId = 'group_' + Date.now();
    data.groups[groupId] = {
      id: groupId,
      name: groupName,
      creator: currentUser,
      members: [currentUser, ...members],
      createdAt: new Date().toISOString()
    };

    // Add group to all members' accounts
    data.groups[groupId].members.forEach(member => {
      if (!data.userChats[member]) {
        data.userChats[member] = { groups: [], direct: [] };
      }
      if (!data.userChats[member].groups.includes(groupId)) {
        data.userChats[member].groups.push(groupId);
      }
    });

    saveChatData(data);
    closeNewGroup();
    loadUserChats();
    openChat(groupId, 'group');
  };

  function openChat(chatId, type) {
    currentChatId = chatId;
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = '';

    const data = getChatData();

    // Update title
    const titleSpan = document.getElementById('currentChatName');
    if (type === 'direct') {
      titleSpan.textContent = `Direct: ${chatId}`;
    } else {
      const group = data.groups[chatId];
      titleSpan.textContent = `Group: ${group ? group.name : 'Chat'}`;
    }

    // Load existing messages
    const chatMessages = data.messages.filter(msg => msg.chatId === chatId);
    chatMessages.forEach(msg => displayMessage(msg));
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Update active chat in list
    document.querySelectorAll('.chat-list li').forEach(li => {
      li.classList.remove('active');
    });
    document.querySelectorAll('.chat-list li').forEach(li => {
      if (li.textContent === chatId || li.textContent.includes(chatId)) {
        li.classList.add('active');
      }
    });
  }

  function displayMessage(message) {
    const messagesContainer = document.getElementById('messagesContainer');
    const messageDiv = document.createElement('div');
    const isUser = message.sender === currentUser;
    messageDiv.className = `chat-message ${isUser ? 'user' : 'other'}`;
    
    const timeStr = new Date(message.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    messageDiv.innerHTML = `
      <div class="chat-message-sender">${message.sender}</div>
      <div>${message.text}</div>
      <div class="chat-message-timestamp">${timeStr}</div>
    `;
    messagesContainer.appendChild(messageDiv);
  }

  window.sendMessage = function() {
    const chatInput = document.getElementById('chatInput');
    const text = chatInput.value.trim();

    if (!text || !currentChatId) {
      return;
    }

    const data = getChatData();
    const message = {
      id: Date.now().toString(),
      chatId: currentChatId,
      sender: currentUser,
      text,
      type: currentChatId.startsWith('group') ? 'group' : 'direct',
      timestamp: new Date().toISOString()
    };

    data.messages.push(message);
    saveChatData(data);

    displayMessage(message);
    chatInput.value = '';
    chatInput.focus();

    document.getElementById('messagesContainer').scrollTop = 
      document.getElementById('messagesContainer').scrollHeight;
  };


  /* ================= DRAG WINDOWS ================= */
  document.querySelectorAll(".window").forEach(makeDraggable);

  function makeDraggable(windowEl) {
    const header = windowEl.querySelector(".title-bar");
    if (!header) return;

    header.addEventListener("mousedown", (e) => {
      let offsetX = e.clientX - windowEl.offsetLeft;
      let offsetY = e.clientY - windowEl.offsetTop;

      function move(e) {
        windowEl.style.left = e.clientX - offsetX + "px";
        windowEl.style.top = e.clientY - offsetY + "px";
      }

      function stop() {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", stop);
      }

      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", stop);
    });
  }

  // Also expose dragWindow for HTML onclick handlers
  window.dragWindow = function(e, id) {
    const win = document.getElementById(id);
    if (!win) return;
    let offsetX = e.clientX - win.offsetLeft;
    let offsetY = e.clientY - win.offsetTop;

    function move(e) {
      win.style.left = e.clientX - offsetX + "px";
      win.style.top = e.clientY - offsetY + "px";
    }

    function stop() {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", stop);
    }

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", stop);
  };

  /* ================= MUSIC PLAYER SETUP ================= */
  // Elements
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

  // Player State
  let playlists = {};
  let currentPlaylist = null;
  let currentIndex = 0;
  let db = null;
  let dbReady = false;
  let movies = [];
  
  // Get CIDWO elements
  const cidwoVideo = document.getElementById("cidwoVideo");
  const movieListEl = document.getElementById("movieList");
  
  console.log("🎬 Movie list element found:", movieListEl ? "✓" : "✗");

  /* ================= INDEXEDDB SETUP ================= */
  function initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("NOAH_MUSIC_DB", 2);

      request.onupgradeneeded = (e) => {
        const database = e.target.result;
        if (!database.objectStoreNames.contains("playlists")) {
          database.createObjectStore("playlists", { keyPath: "name" });
        }
        if (!database.objectStoreNames.contains("songs")) {
          database.createObjectStore("songs", { keyPath: "id", autoIncrement: true });
        }
        if (!database.objectStoreNames.contains("movies")) {
          database.createObjectStore("movies", { keyPath: "id", autoIncrement: true });
        }
        console.log("✓ Database structure created");
      };

      request.onsuccess = () => {
        db = request.result;
        console.log("✓ Database opened successfully");
        resolve(db);
      };

      request.onerror = () => {
        console.error("✗ Database error:", request.error);
        reject(request.error);
      };
    });
  }

  /* ================= LOAD ALL DATA ================= */
  async function loadAllData() {
    if (!db) {
      console.log("Waiting for database...");
      return;
    }

    try {
      // Load playlists
      const playlistTx = db.transaction("playlists", "readonly");
      const playlistStore = playlistTx.objectStore("playlists");
      
      return new Promise((resolve) => {
        const getAll = playlistStore.getAll();
        
        getAll.onsuccess = () => {
          const playlistList = getAll.result;
          console.log("📂 Found", playlistList.length, "playlists");
          
          playlists = {};
          playlistList.forEach((p) => {
            playlists[p.name] = [];
            console.log("  - Playlist:", p.name);
          });

          // Now load songs
          const songTx = db.transaction("songs", "readonly");
          const songStore = songTx.objectStore("songs");
          const getSongs = songStore.getAll();

          getSongs.onsuccess = () => {
            const songList = getSongs.result;
            console.log("🎵 Found", songList.length, "songs");

            songList.forEach((song) => {
              if (playlists[song.playlist]) {
                try {
                  const blob = new Blob([song.data], { type: "audio/mpeg" });
                  playlists[song.playlist].push({
                    name: song.name,
                    file: blob
                  });
                  console.log("  ✓ Loaded:", song.name);
                } catch (err) {
                  console.error("  ✗ Error loading song:", song.name, err);
                }
              }
            });

            currentPlaylist = Object.keys(playlists)[0] || null;
            updatePlaylistSelector();
            renderPlaylist();
            console.log("✓ All data loaded successfully!");
            resolve();
          };
        };
      });
    } catch (err) {
      console.error("✗ Error loading data:", err);
    }
  }

  /* ================= INITIALIZE ================= */
  initDB().then(() => {
    dbReady = true;
    loadAllData();
    loadMoviesFromDB().then(() => {
      if (fileInput) fileInput.disabled = false;
      if (createPlaylistBtn) createPlaylistBtn.disabled = false;
      console.log("✓ All data loaded and initialized");
      console.log("🎬 Movies ready for display");
    });
  }).catch(err => {
    console.error("Failed to initialize database:", err);
    alert("Error: Database failed to load. Please refresh.");
  });

  /* ================= DEFAULT MOVIES TO ALWAYS HAVE ================= */
  const defaultMovies = [
    { name: "FNAF (Five Nights at Freddy's)", path: "media/Five-Nights-at-Freddys_1080p.mp4" },
    { name: "FNAF 2", path: "media/Five-Nights-at-Freddys-2_1080p.mp4" },
    { name: "Send Help", path: "media/Send-Help_1080p.mp4" }
  ];

  /* ================= LOAD MOVIES FROM DATABASE ================= */
  function loadMoviesFromDB() {
    return new Promise((resolve) => {
      if (!db) {
        console.log("Database not ready, seeding default movies to memory");
        movies = defaultMovies.map(m => ({
          name: m.name,
          url: m.path,
          file: null
        }));
        renderMovieList();
        resolve();
        return;
      }
      try {
        const movieTx = db.transaction("movies", "readonly");
        const movieStore = movieTx.objectStore("movies");
        const getAll = movieStore.getAll();

        getAll.onsuccess = () => {
          const movieList = getAll.result || [];
          console.log("🎬 Found", movieList.length, "movies in database");
          
          if (movieList.length === 0) {
            // Database is empty, add default movies
            console.log("📽️ Database is empty, adding default movies...");
            ensureDefaultMovies().then(() => resolve());
          } else {
            movies = movieList.map((m) => ({
              name: m.name,
              url: m.url || m.path,
              file: m.file ? new Blob([m.file], { type: m.type }) : null
            }));
            renderMovieList();
            resolve();
          }
        };
      } catch (err) {
        console.log("Movies store not initialized yet, using defaults");
        movies = defaultMovies.map(m => ({
          name: m.name,
          url: m.path,
          file: null
        }));
        renderMovieList();
        resolve();
      }
    });
  }

  /* ================= ENSURE DEFAULT MOVIES EXIST ================= */
  function ensureDefaultMovies() {
    return new Promise((resolve) => {
      if (!db) {
        movies = defaultMovies.map(m => ({
          name: m.name,
          url: m.path,
          file: null
        }));
        renderMovieList();
        resolve();
        return;
      }

      let added = 0;
      const totalToAdd = defaultMovies.length;

      defaultMovies.forEach((defaultMovie) => {
        const tx = db.transaction("movies", "readwrite");
        const store = tx.objectStore("movies");
        const request = store.add({
          name: defaultMovie.name,
          path: defaultMovie.path,
          url: defaultMovie.path
        });

        request.onsuccess = () => {
          added++;
          console.log(`✓ Added default movie: ${defaultMovie.name} (${added}/${totalToAdd})`);
          
          // Add to memory
          if (!movies.find(m => m.name === defaultMovie.name)) {
            movies.push({
              name: defaultMovie.name,
              url: defaultMovie.path,
              file: null
            });
          }

          // When all are added, render
          if (added === totalToAdd) {
            renderMovieList();
            console.log("✓ All default movies added and rendered");
            resolve();
          }
        };

        request.onerror = () => {
          // Movie might already exist, just add to memory if needed
          added++;
          if (!movies.find(m => m.name === defaultMovie.name)) {
            movies.push({
              name: defaultMovie.name,
              url: defaultMovie.path,
              file: null
            });
          }
          console.log(`✓ Movie exists or added: ${defaultMovie.name}`);
          if (added === totalToAdd) {
            renderMovieList();
            resolve();
          }
        };
      });
    });
  }


  /* ================= ADD MOVIE (CODE ONLY) ================= */
  // Use this function in the code to add movies
  // Example: addMovieToDatabase("Movie Name", "path/to/movie.mp4");
  window.addMovieToDatabase = function(movieName, moviePath) {
    if (!db) {
      console.error("Database not ready yet!");
      return;
    }

    // Check if movie already exists in memory
    const existingMovie = movies.find(m => m.name === movieName);
    if (existingMovie) {
      console.log("ℹ Movie already exists in list:", movieName);
      return;
    }

    const tx = db.transaction("movies", "readwrite");
    const store = tx.objectStore("movies");
    const request = store.add({
      name: movieName,
      path: moviePath,
      url: moviePath
    });

    request.onsuccess = () => {
      console.log("✓ Movie added to database:", movieName);
      movies.push({ name: movieName, url: moviePath, file: null });
      console.log("✓ Movies array now has:", movies.length, "movies");
      console.log("  Movie list:", movies.map(m => m.name).join(", "));
      renderMovieList();
      console.log("✓ Movie list re-rendered");
    };

    request.onerror = () => {
      // If error is because movie already exists in DB, add it to memory anyway
      console.error("✗ Database error for movie:", movieName, request.error);
      const existsInMemory = movies.find(m => m.name === movieName);
      if (!existsInMemory) {
        movies.push({ name: movieName, url: moviePath, file: null });
        renderMovieList();
        console.log("✓ Added movie to list (was in DB)");
      }
    };
  };

  /* ================= PLAYER CONTROLS ================= */
  if (playBtn) playBtn.onclick = () => audio.play();
  if (pauseBtn) pauseBtn.onclick = () => audio.pause();

  const nextBtn = document.getElementById("nextBtn");
  const prevBtn = document.getElementById("prevBtn");

  if (nextBtn) nextBtn.onclick = () => nextSong();
  if (prevBtn) prevBtn.onclick = () => prevSong();

  /* ================= CREATE PLAYLIST ================= */
  if (createPlaylistBtn) {
    createPlaylistBtn.disabled = true;
    createPlaylistBtn.title = "Loading...";
    
    createPlaylistBtn.onclick = () => {
      const name = newPlaylistName.value.trim();

      if (!name) {
        alert("Please enter a playlist name");
        return;
      }

      if (playlists[name]) {
        alert("Playlist already exists!");
        return;
      }

      // Add to memory
      playlists[name] = [];

      // Save to database
      if (db) {
        const tx = db.transaction("playlists", "readwrite");
        const store = tx.objectStore("playlists");
        const request = store.add({ name: name });

        request.onsuccess = () => {
          console.log("✓ Playlist saved:", name);
          currentPlaylist = name;
          newPlaylistName.value = "";
          updatePlaylistSelector();
          renderPlaylist();
          alert("✓ Playlist created: " + name);
        };

        request.onerror = () => {
          console.error("✗ Failed to save playlist:", request.error);
          alert("Error saving playlist!");
        };
      }
    };
  }

  /* ================= SELECT PLAYLIST - HANDLED IN updatePlaylistSelector ================= */

  /* ================= UPLOAD SONGS ================= */
  if (fileInput) {
    fileInput.disabled = true;
    
    fileInput.onchange = (e) => {
      if (!currentPlaylist) {
        alert("❌ Create or select a playlist first!");
        return;
      }

      const files = Array.from(e.target.files);
      console.log("📤 Uploading", files.length, "file(s)...");

      let savedCount = 0;

      files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = () => {
          const data = reader.result;

          if (!db) {
            alert("Database not ready!");
            return;
          }

          const tx = db.transaction("songs", "readwrite");
          const store = tx.objectStore("songs");
          const request = store.add({
            name: file.name,
            playlist: currentPlaylist,
            data: data
          });

          request.onsuccess = () => {
            savedCount++;
            console.log("✓ Saved:", file.name, `(${savedCount}/${files.length})`);

            // Also add to memory
            if (!playlists[currentPlaylist]) {
              playlists[currentPlaylist] = [];
            }
            playlists[currentPlaylist].push({
              name: file.name,
              file: new Blob([data], { type: "audio/mpeg" })
            });

            if (savedCount === files.length) {
              console.log("✓✓ All songs uploaded!");
              renderPlaylist();
              alert(`✓ ${files.length} song(s) added to ${currentPlaylist}`);
            } else {
              renderPlaylist();
            }
          };

          request.onerror = () => {
            console.error("✗ Failed to save:", file.name);
          };
        };
        reader.readAsArrayBuffer(file);
      });

      fileInput.value = "";
    };
  }

  /* ================= RENDER PLAYLIST ================= */
  function renderPlaylist() {
    if (!playlistEl) return;
    playlistEl.innerHTML = "";

    if (!currentPlaylist || !playlists[currentPlaylist]) {
      if (playlistEl) playlistEl.innerHTML = "<li style='color: #999;'>No songs yet</li>";
      return;
    }

    const songs = playlists[currentPlaylist];
    if (songs.length === 0) {
      playlistEl.innerHTML = "<li style='color: #999;'>No songs in this playlist</li>";
      return;
    }

    songs.forEach((song, i) => {
      const li = document.createElement("li");
      li.textContent = song.name;
      li.style.cursor = "pointer";
      li.style.padding = "8px";
      li.style.borderRadius = "4px";
      li.onclick = () => playSong(i);
      li.onmouseover = () => (li.style.backgroundColor = "rgba(255, 255, 255, 0.1)");
      li.onmouseout = () => (li.style.backgroundColor = "transparent");
      playlistEl.appendChild(li);
    });
  }

  /* ================= PLAY SONG ================= */
  function playSong(index) {
    if (!currentPlaylist || !playlists[currentPlaylist]) return;
    const song = playlists[currentPlaylist][index];
    if (!song) return;

    currentIndex = index;
    audio.src = URL.createObjectURL(song.file);
    audio.play();

    if (currentSong) {
      currentSong.textContent = "🎵 " + song.name;
    }

    // Highlight current song
    if (playlistEl) {
      [...playlistEl.children].forEach((li, i) => {
        if (i === index) {
          li.style.fontWeight = "bold";
          li.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
        } else {
          li.style.fontWeight = "normal";
          li.style.backgroundColor = "transparent";
        }
      });
    }

    console.log("▶ Now playing:", song.name);
  }

  /* ================= NEXT / PREV SONG ================= */
  function nextSong() {
    if (!currentPlaylist || !playlists[currentPlaylist] || playlists[currentPlaylist].length === 0) return;
    currentIndex = (currentIndex + 1) % playlists[currentPlaylist].length;
    playSong(currentIndex);
  }

  function prevSong() {
    if (!currentPlaylist || !playlists[currentPlaylist] || playlists[currentPlaylist].length === 0) return;
    currentIndex = (currentIndex - 1 + playlists[currentPlaylist].length) % playlists[currentPlaylist].length;
    playSong(currentIndex);
  }

  audio.onended = nextSong;

  /* ================= PROGRESS BAR ================= */
  audio.ontimeupdate = () => {
    if (audio.duration && progress) {
      progress.style.width =
        (audio.currentTime / audio.duration) * 100 + "%";
    }
  };

  if (progressContainer) {
    progressContainer.onclick = (e) => {
      const rect = progressContainer.getBoundingClientRect();
      audio.currentTime =
        ((e.clientX - rect.left) / rect.width) * audio.duration;
    };
  }

  /* ================= UPDATE PLAYLIST DROPDOWN ================= */
  function updatePlaylistSelector() {
    if (!playlistSelector) return;
    playlistSelector.innerHTML = "";

    if (Object.keys(playlists).length === 0) {
      const li = document.createElement("li");
      li.textContent = "No playlists yet";
      li.style.color = "#999";
      playlistSelector.appendChild(li);
      return;
    }

    Object.keys(playlists).forEach((name) => {
      const li = document.createElement("li");
      li.textContent = `${name} (${playlists[name].length} songs)`;
      li.dataset.playlistName = name;
      
      if (name === currentPlaylist) {
        li.classList.add("active");
      }
      
      li.addEventListener("click", () => {
        currentPlaylist = name;
        
        // Update active state
        document.querySelectorAll("#playlistSelector li").forEach(item => {
          item.classList.remove("active");
        });
        li.classList.add("active");
        
        renderPlaylist();
      });
      
      playlistSelector.appendChild(li);
    });
  }

  /* ================= RENDER MOVIE LIST ================= */
  function renderMovieList() {
    if (!movieListEl) {
      console.error("✗ Movie list element not found!");
      return;
    }
    
    console.log("🎬 Rendering movie list with", movies.length, "movies");
    movieListEl.innerHTML = "";
    
    if (movies.length === 0) {
      const li = document.createElement("li");
      li.textContent = "🎬 No movies available";
      li.style.color = "#999";
      li.style.padding = "20px";
      li.style.textAlign = "center";
      movieListEl.appendChild(li);
      return;
    }

    movies.forEach((m, i) => {
      const li = document.createElement("li");
      li.textContent = "▶ " + m.name;
      li.style.cursor = "pointer";
      li.style.padding = "12px 8px";
      li.style.borderRadius = "4px";
      li.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
      li.style.borderLeft = "3px solid transparent";
      li.style.transition = "all 0.2s";
      li.style.fontSize = "14px";
      li.style.fontWeight = "500";
      li.onclick = () => playMovie(i);
      li.onmouseover = () => {
        li.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
        li.style.borderLeft = "3px solid #5636e6";
        li.style.transform = "translateX(4px)";
      };
      li.onmouseout = () => {
        li.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
        li.style.borderLeft = "3px solid transparent";
        li.style.transform = "translateX(0)";
      };
      movieListEl.appendChild(li);
      console.log("  ✓ Rendered movie:", m.name);
    });
  }

  /* ================= PLAY MOVIE ================= */
  function playMovie(index) {
    const mv = movies[index];
    if (!mv) return;
    
    if (cidwoVideo) {
      // If it's a file blob, create object URL
      if (mv.file) {
        cidwoVideo.src = URL.createObjectURL(mv.file);
      } else {
        // If it's a path/URL, use it directly
        cidwoVideo.src = mv.url;
      }
      cidwoVideo.play();
    }
    
    // Highlight currently playing movie
    if (movieListEl) {
      [...movieListEl.children].forEach((li, i) => {
        if (i === index) {
          li.style.fontWeight = "bold";
          li.style.backgroundColor = "rgba(86, 54, 230, 0.3)";
          li.style.borderLeft = "3px solid #5636e6";
        } else {
          li.style.fontWeight = "normal";
          li.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
          li.style.borderLeft = "3px solid transparent";
        }
      });
    }

    console.log("▶ Now playing:", mv.name);
  }

  /* ================= EXPOSE CIDWO FUNCTIONS ================= */
  window.openCidwo = () => openWindow("cidwoWindow");
  window.closeCidwo = () => closeWindow("cidwoWindow");

  /* ================= AUTO OPEN WELCOME WINDOW ================= */
  window.addEventListener("load", () => {
    // Auto-open the video player for friends
    const cidwoWindow = document.getElementById("cidwoWindow");
    if (cidwoWindow) {
      cidwoWindow.style.display = "block";
      cidwoWindow.style.left = "50%";
      cidwoWindow.style.top = "50%";
      cidwoWindow.style.transform = "translate(-50%, -50%)";
      console.log("🎬 Video player ready!");
    }
  });

  /* ================= LOAD MOVIES (ADD YOUR MOVIES HERE) ================= */
  // Movies are now loaded and added during database initialization
  // To add more movies, edit the addMovieToDatabase lines in the INITIALIZE section above

});
