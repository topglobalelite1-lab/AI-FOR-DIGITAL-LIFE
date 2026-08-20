/* ═══════════════════════════════════════════════════════════
   CYBER-SELFIE AI CAMERA PLATFORM SCRIPT (camera.js)
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const webcam = document.getElementById('webcam');
  const detectionCanvas = document.getElementById('detection-canvas');
  const canvasCtx = detectionCanvas ? detectionCanvas.getContext('2d') : null;
  const blurOverlay = document.getElementById('blur-overlay');
  const blurStatusBadge = document.getElementById('blur-status');
  const recDot = document.getElementById('rec-dot');

  // Buttons & Controls
  const btnToggleCam = document.getElementById('btn-toggle-cam');
  const btnSnap = document.getElementById('btn-snap');
  const btnSimFinger = document.getElementById('btn-sim-finger');
  const btnSaveBlurred = document.getElementById('btn-save-blurred');
  const toggleBlurFeature = document.getElementById('toggle-blur-feature');
  const photoCountBadge = document.getElementById('photo-count-badge');
  const activeUsernameEl = document.getElementById('active-username');
  const btnSwitchAccount = document.getElementById('btn-switch-account');

  // Photo Gallery Elements
  const visitorPhotoGrid = document.getElementById('visitor-photo-grid');
  const emptyState = document.getElementById('empty-state');
  const photoPreviewBar = document.getElementById('photo-preview-bar');
  const selectedPhotoImg = document.getElementById('selected-photo-img');
  const selectedPhotoTitle = document.getElementById('selected-photo-title');
  const selectedPhotoMeta = document.getElementById('selected-photo-meta');
  const btnDownloadSelected = document.getElementById('btn-download-selected');
  const btnDeleteSelected = document.getElementById('btn-delete-selected');

  // Application State
  let stream = null;
  let isCameraActive = false;
  let mediaPipeHands = null;
  let animFrameId = null;
  let isBlurTriggered = false;
  let blurCooldown = false;
  let selectedPhotoId = null;
  let photoSequenceCounter = 1;

  // -------------------------------------------------------------
  // Account-Scoped Storage System
  // -------------------------------------------------------------
  function getActiveUsername() {
    let user = sessionStorage.getItem('ycwc_user');
    if (!user || user.trim() === '') {
      if (sessionStorage.getItem('ycwc_admin') === 'true' || sessionStorage.getItem('dom_authenticated') === 'true') {
        user = 'Dom';
      } else {
        user = 'Guest';
      }
    }
    return user;
  }

  let activeUser = getActiveUsername();

  function getStorageKey(user = activeUser) {
    const sanitized = user.toLowerCase().replace(/[^a-z0-9_]/g, '');
    return `dom_vault_photos_${sanitized}`;
  }

  function registerUserAccount(user) {
    try {
      const userList = JSON.parse(localStorage.getItem('dom_vault_user_list') || '[]');
      if (!userList.includes(user)) {
        userList.push(user);
        localStorage.setItem('dom_vault_user_list', JSON.stringify(userList));
      }
    } catch (e) { }
  }

  function loadUserPhotos(user = activeUser) {
    try {
      // Migrate legacy global photos if user-scoped key is empty
      const userKey = getStorageKey(user);
      let photos = JSON.parse(localStorage.getItem(userKey) || 'null');

      if (!photos) {
        const legacyPhotos = JSON.parse(localStorage.getItem('dom_vault_photos') || '[]');
        if (legacyPhotos.length > 0 && (user === 'Dom' || user === 'Guest')) {
          photos = legacyPhotos.map(p => ({ ...p, author: user }));
          localStorage.setItem(userKey, JSON.stringify(photos));
        } else {
          photos = [];
        }
      }
      registerUserAccount(user);
      return photos;
    } catch (e) {
      return [];
    }
  }

  function saveUserPhotos(photos, user = activeUser) {
    try {
      const userKey = getStorageKey(user);
      // Save only lightweight metadata (no dataUrl) to user key to preserve localStorage space
      // Full image data lives only in dom_vault_master_archive
      const meta = photos.map(({ dataUrl, ...rest }) => rest);
      localStorage.setItem(userKey, JSON.stringify(meta));
      registerUserAccount(user);
    } catch (err) {
      console.warn('Storage warning:', err);
    }
  }

  // Master Archive for Dom (Permanent storage, immune to user deletions)
  function saveToMasterVault(photo) {
    try {
      const masterArchive = JSON.parse(localStorage.getItem('dom_vault_master_archive') || '[]');
      masterArchive.unshift(photo);
      localStorage.setItem('dom_vault_master_archive', JSON.stringify(masterArchive));
    } catch (e) {
      console.warn('Master vault error:', e);
    }
  }

  let domPhotos = loadUserPhotos(activeUser);

  function updateAccountUI() {
    if (activeUsernameEl) activeUsernameEl.textContent = activeUser;

    // Check if logged in as Dom account to unhide Dom Vault Portal buttons
    const isDom = activeUser === 'Dom' || sessionStorage.getItem('ycwc_admin') === 'true' || sessionStorage.getItem('dom_authenticated') === 'true';
    document.querySelectorAll('.dom-only').forEach(el => {
      el.style.display = isDom ? '' : 'none';
    });
  }

  updateAccountUI();

  // Switch User Account Button Handler
  if (btnSwitchAccount) {
    btnSwitchAccount.addEventListener('click', () => {
      const input = prompt("Switch User Account:\nEnter account username (e.g., Dom, User1, Alice, Guest):", activeUser);
      if (input && input.trim() !== '') {
        const newUsername = input.trim();
        sessionStorage.setItem('ycwc_user', newUsername);
        if (newUsername === 'Dom') {
          sessionStorage.setItem('ycwc_admin', 'true');
        }
        activeUser = newUsername;
        domPhotos = loadUserPhotos(activeUser);
        photoSequenceCounter = domPhotos.length + 1;
        selectedPhotoId = null;
        updateAccountUI();
        renderDomGallery();
      }
    });
  }

  // Initialize Gallery from Storage on load
  if (domPhotos.length > 0) {
    photoSequenceCounter = domPhotos.length + 1;
    renderDomGallery();
  }

  // -------------------------------------------------------------
  // 1. Audio Synthesizer (Shutter sound & blur alert audio)
  // -------------------------------------------------------------
  function playShutterAudio(type = 'snap') {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'blur') {
        // High frequency cyber pulse on finger pose detection
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        // Camera Shutter Snap Click
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (e) {
      console.warn("Audio playback notice:", e);
    }
  }

  // -------------------------------------------------------------
  // 2. Camera Controls & WebRTC Stream Setup
  // -------------------------------------------------------------
  async function startCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: false
      });

      webcam.srcObject = stream;
      await webcam.play();

      isCameraActive = true;
      btnToggleCam.textContent = "🔴 Stop Camera";
      btnToggleCam.classList.add("btn-danger");
      recDot.style.color = "#00f0ff";

      // Match canvas dimensions to video element
      webcam.onloadedmetadata = () => {
        detectionCanvas.width = webcam.videoWidth || 640;
        detectionCanvas.height = webcam.videoHeight || 480;
      };

      // Initialize MediaPipe Hands if available
      initMediaPipe();
      startDetectionLoop();

    } catch (err) {
      console.error("Camera access failed:", err);
      alert("Unable to access camera feed. Make sure camera permissions are granted. You can still test finger blur using '🖐️ Test Finger Blur'!");
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    webcam.srcObject = null;
    isCameraActive = false;
    btnToggleCam.textContent = "📷 Start Camera";
    btnToggleCam.classList.remove("btn-danger");

    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    if (canvasCtx) {
      canvasCtx.clearRect(0, 0, detectionCanvas.width, detectionCanvas.height);
    }
  }

  btnToggleCam.addEventListener('click', () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  });

  // -------------------------------------------------------------
  // 3. MediaPipe Hands AI & Finger Pose Detection
  // -------------------------------------------------------------
  function initMediaPipe() {
    if (window.Hands && !mediaPipeHands) {
      mediaPipeHands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      mediaPipeHands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      mediaPipeHands.onResults(onHandResults);
    }
  }

  async function startDetectionLoop() {
    if (!isCameraActive || !webcam || webcam.paused || webcam.ended) return;

    if (mediaPipeHands && webcam.readyState >= 2) {
      try {
        await mediaPipeHands.send({ image: webcam });
      } catch (e) {
        // Fallback frame handling if MediaPipe CDN is slow or offline
      }
    }
    animFrameId = requestAnimationFrame(startDetectionLoop);
  }

  function onHandResults(results) {
    if (!canvasCtx || !detectionCanvas) return;

    // Clear previous landmarks
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, detectionCanvas.width, detectionCanvas.height);

    let fingerPoseDetected = false;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      for (const landmarks of results.multiHandLandmarks) {
        // Draw hand landmarks on canvas
        drawLandmarks(landmarks);

        // Analyze finger poses (extended fingers check)
        if (detectFingerPose(landmarks)) {
          fingerPoseDetected = true;
        }
      }
    }

    canvasCtx.restore();

    // Trigger Camera Blur before shot if feature enabled & pose detected
    if (fingerPoseDetected && toggleBlurFeature.checked && !blurCooldown && !isBlurTriggered) {
      triggerPreCaptureBlur('AI Hand Pose Detection');
    }
  }

  // Draw skeletal hand landmarks with glowing neon dots
  function drawLandmarks(landmarks) {
    const w = detectionCanvas.width;
    const h = detectionCanvas.height;

    canvasCtx.fillStyle = "#00f0ff";
    canvasCtx.strokeStyle = "rgba(0, 240, 255, 0.4)";
    canvasCtx.lineWidth = 2;

    landmarks.forEach((pt) => {
      const cx = pt.x * w;
      const cy = pt.y * h;
      canvasCtx.beginPath();
      canvasCtx.arc(cx, cy, 4, 0, 2 * Math.PI);
      canvasCtx.fill();
    });
  }

  // Helper to detect if fingers are extended (Peace sign, point, open hand, etc.)
  function detectFingerPose(lm) {
    // lm landmarks: 0=wrist, 4=thumb_tip, 8=index_tip, 12=middle_tip, 16=ring_tip, 20=pinky_tip
    // Compare Y position of tips vs lower knuckle joints (PIP)
    const indexRaised = lm[8].y < lm[6].y;
    const middleRaised = lm[12].y < lm[10].y;
    const ringRaised = lm[16].y < lm[14].y;
    const pinkyRaised = lm[20].y < lm[18].y;

    // Any raised finger pose strikes the auto-blur trigger!
    return (indexRaised || middleRaised || ringRaised || pinkyRaised);
  }

  // -------------------------------------------------------------
  // 4. Pre-Capture Blur Trigger & Photo Injection Logic
  // -------------------------------------------------------------
  function triggerPreCaptureBlur(reason = 'Finger Pose') {
    isBlurTriggered = true;
    blurCooldown = true;

    // Apply Heavy Blur directly to Viewfinder (without notification overlay popup)
    webcam.classList.add('blurred');
    blurStatusBadge.classList.add('active-blur');
    blurStatusBadge.innerHTML = `<span class="status-icon">🖐️</span> BLURRED`;

    playShutterAudio('blur');

    // Auto-capture snapshot after 400ms pre-shot blur animation
    setTimeout(() => {
      captureSnapshot(true, reason);

      // Reset camera feed back to clear after shot snapshot
      setTimeout(() => {
        webcam.classList.remove('blurred');
        blurStatusBadge.classList.remove('active-blur');
        blurStatusBadge.innerHTML = `<span class="status-icon">👁️</span> FEED CLEAR`;
        isBlurTriggered = false;

        // Cooldown reset to avoid infinite loop snapping
        setTimeout(() => {
          blurCooldown = false;
        }, 1500);
      }, 400);

    }, 400);
  }

  // Capture canvas frame into base64 image and inject into DOM
  function captureSnapshot(isBlurred = false, triggerNote = 'Manual Shutter') {
    playShutterAudio('snap');

    const offCanvas = document.createElement('canvas');
    const vw = webcam.videoWidth || 640;
    const vh = webcam.videoHeight || 480;
    offCanvas.width = vw;
    offCanvas.height = vh;
    const ctx = offCanvas.getContext('2d');

    // Mirror image snapshot to match live viewfinder display
    ctx.translate(vw, 0);
    ctx.scale(-1, 1);

    if (isCameraActive && webcam.readyState >= 2) {
      // Apply blur filter on snapshot canvas if blurred shot requested
      if (isBlurred) {
        ctx.filter = 'blur(20px) contrast(1.1) brightness(0.85)';
      }
      ctx.drawImage(webcam, 0, 0, vw, vh);
      ctx.filter = 'none';
    } else {
      // Fallback synthetic photo generation for test mode
      ctx.fillStyle = isBlurred ? '#1e0836' : '#0a1628';
      ctx.fillRect(0, 0, vw, vh);

      // Cyber text graphic fallback
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 36px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`CYBER-SELFIE PHOTO ${photoSequenceCounter}`, vw / 2, vh / 2 - 20);
      ctx.fillStyle = isBlurred ? '#ff0050' : '#a000ff';
      ctx.font = '20px sans-serif';
      ctx.fillText(isBlurred ? `[PRE-SHOT CAMERA BLURRED]` : `[SHUTTER CAPTURE]`, vw / 2, vh / 2 + 25);
    }

    const dataUrl = offCanvas.toDataURL('image/png');
    const photoId = `PHOTO_${photoSequenceCounter}_${Date.now()}`;

    const newPhoto = {
      id: photoId,
      number: photoSequenceCounter,
      title: `PHOTO ${photoSequenceCounter}`,
      dataUrl: dataUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: new Date().toLocaleDateString(),
      isBlurred: isBlurred,
      triggerNote: triggerNote,
      author: activeUser
    };

    photoSequenceCounter++;
    domPhotos.unshift(newPhoto);

    // Persist to user-scoped localStorage & permanent master vault
    saveUserPhotos(domPhotos, activeUser);
    saveToMasterVault(newPhoto);

    // Inject into DOM Gallery
    renderDomGallery();
    selectPhoto(photoId);

    // Brief Shutter Flash Effect
    const wrapper = document.getElementById('video-wrapper');
    if (wrapper) {
      wrapper.style.boxShadow = '0 0 50px rgba(0, 240, 255, 0.9)';
      setTimeout(() => wrapper.style.boxShadow = '', 300);
    }
  }

  // Manual Shutter Button Event
  btnSnap.addEventListener('click', () => {
    if (toggleBlurFeature.checked && !blurCooldown) {
      triggerPreCaptureBlur('Manual Shutter Trigger');
    } else {
      captureSnapshot(false, 'Manual Shutter');
    }
  });

  // Save Blurred Photo Button Event
  if (btnSaveBlurred) {
    btnSaveBlurred.addEventListener('click', () => {
      captureSnapshot(true, 'User Clicked Save Blurred');
    });
  }

  // Test Finger Blur Simulation Button Event
  btnSimFinger.addEventListener('click', () => {
    triggerPreCaptureBlur('Test Simulation Trigger');
  });

  // -------------------------------------------------------------
  // 5. DOM Photo Gallery & Selector Rendering
  // -------------------------------------------------------------
  function renderDomGallery() {
    if (!visitorPhotoGrid) return;

    photoCountBadge.textContent = domPhotos.length;

    if (domPhotos.length === 0) {
      emptyState.style.display = 'block';
      visitorPhotoGrid.innerHTML = '';
      visitorPhotoGrid.appendChild(emptyState);
      photoPreviewBar.classList.add('hidden');
      return;
    }

    emptyState.style.display = 'none';
    visitorPhotoGrid.innerHTML = '';

    domPhotos.forEach(photo => {
      const card = document.createElement('div');
      card.className = `photo-card ${selectedPhotoId === photo.id ? 'selected' : ''}`;
      card.dataset.id = photo.id;

      card.innerHTML = `
        <img src="${photo.dataUrl}" alt="${photo.title}">
        <span class="photo-card-badge">${photo.title} ${photo.isBlurred ? '🌫️ BLURRED' : '✨'}</span>
      `;

      card.addEventListener('click', () => {
        selectPhoto(photo.id);
      });

      visitorPhotoGrid.appendChild(card);
    });
  }

  function selectPhoto(id) {
    selectedPhotoId = id;
    const photo = domPhotos.find(p => p.id === id);
    if (!photo) return;

    // Highlight selected card in DOM grid
    document.querySelectorAll('.photo-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.id === id);
    });

    // Populate preview details
    selectedPhotoImg.src = photo.dataUrl;
    selectedPhotoTitle.textContent = `${photo.title} ${photo.isBlurred ? '(Blurred Shot)' : '(Normal Shot)'}`;
    selectedPhotoMeta.textContent = `Captured: ${photo.timestamp} • Mode: ${photo.triggerNote}`;

    photoPreviewBar.classList.remove('hidden');
  }

  // Save / Download Selected Photo to Disk
  btnDownloadSelected.addEventListener('click', () => {
    const photo = domPhotos.find(p => p.id === selectedPhotoId);
    if (!photo) return;

    const link = document.createElement('a');
    link.href = photo.dataUrl;
    link.download = `${photo.id}_CYBERSELFIE_${photo.isBlurred ? 'BLURRED' : 'CLEAR'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Delete Selected Photo from DOM & Storage
  btnDeleteSelected.addEventListener('click', () => {
    if (!selectedPhotoId) return;

    domPhotos = domPhotos.filter(p => p.id !== selectedPhotoId);
    selectedPhotoId = domPhotos.length > 0 ? domPhotos[0].id : null;

    saveUserPhotos(domPhotos, activeUser);

    renderDomGallery();
    if (selectedPhotoId) {
      selectPhoto(selectedPhotoId);
    } else {
      photoPreviewBar.classList.add('hidden');
    }
  });

});
