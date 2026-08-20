/* ═══════════════════════════════════════════════════════════
   DOM VAULT PORTAL SCRIPT (dom_vault.js)
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const authOverlay = document.getElementById('auth-overlay');
  const authForm = document.getElementById('auth-form');
  const authCode = document.getElementById('auth-code');
  const btnUnlock = document.getElementById('btn-unlock');
  const btnLockVault = document.getElementById('btn-lock-vault');

  // Stats Elements
  const statTotal = document.getElementById('stat-total');
  const statBlurred = document.getElementById('stat-blurred');
  const statClear = document.getElementById('stat-clear');

  // Controls Elements
  const domVaultGrid = document.getElementById('dom-vault-grid');
  const domEmptyState = document.getElementById('dom-empty-state');
  const filterTabs = document.querySelectorAll('.filter-tab');
  const btnExportJson = document.getElementById('btn-export-json');
  const btnClearArchive = document.getElementById('btn-clear-archive');

  // Lightbox Elements
  const lightbox = document.getElementById('lightbox');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxMeta = document.getElementById('lightbox-meta');
  const btnLightboxDownload = document.getElementById('btn-lightbox-download');
  const btnLightboxDelete = document.getElementById('btn-lightbox-delete');
  const btnDeleteUser = document.getElementById('btn-delete-user');

  // State Variables
  let currentFilter = 'all';
  let activeLightboxPhoto = null;

  // Check Session Authentication (Integrates with main site Dom account)
  const isAuth = sessionStorage.getItem('dom_authenticated') === 'true' ||
    sessionStorage.getItem('ycwc_admin') === 'true';
  if (isAuth) {
    authOverlay.style.display = 'none';
  }

  // -------------------------------------------------------------
  // 1. Passcode Authentication Logic
  // -------------------------------------------------------------
  function unlockVault() {
    const inputVal = authCode.value.trim();
    // Validated against Dom account passcode (Domino)
    if (inputVal === 'Domino' || inputVal.toUpperCase() === 'DOMINO') {
      sessionStorage.setItem('dom_authenticated', 'true');
      sessionStorage.setItem('ycwc_admin', 'true');
      authOverlay.style.display = 'none';
      loadDomVaultData();
    } else {
      alert("Access Denied: Invalid Dom Passcode.");
      authCode.value = '';
      authCode.focus();
    }
  }

  authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    unlockVault();
  });

  btnLockVault.addEventListener('click', () => {
    sessionStorage.removeItem('dom_authenticated');
    authOverlay.style.display = 'flex';
  });

  const vaultUserSelect = document.getElementById('vault-user-select');

  function getUserList() {
    try {
      const list = JSON.parse(localStorage.getItem('dom_vault_user_list') || '[]');
      if (!list.includes('Dom')) list.unshift('Dom');
      if (!list.includes('Guest')) list.push('Guest');
      return [...new Set(list)];
    } catch (e) {
      return ['Dom', 'Guest'];
    }
  }

  function populateUserDropdown() {
    if (!vaultUserSelect) return;
    const users = getUserList();
    const currentVal = vaultUserSelect.value || 'ALL';

    vaultUserSelect.innerHTML = `<option value="ALL">🌐 All Users' Archives</option>` +
      users.map(u => `<option value="${u}">👤 Account: ${u}</option>`).join('');

    vaultUserSelect.value = currentVal;
  }

  function getStorageKey(user) {
    const sanitized = user.toLowerCase().replace(/[^a-z0-9_]/g, '');
    return `dom_vault_photos_${sanitized}`;
  }

  // -------------------------------------------------------------
  // 2. Load Photos & Data Sync Across User Accounts
  // -------------------------------------------------------------
  function getPhotosFromStorage() {
    const selectedUser = vaultUserSelect ? vaultUserSelect.value : 'ALL';

    // Primary source: master archive (written every time a photo is taken)
    let photos = [];
    try {
      photos = JSON.parse(localStorage.getItem('dom_vault_master_archive') || '[]');
    } catch(e) { photos = []; }

    // Fallback: scan all dom_vault_photos_* keys in case master archive is empty
    if (photos.length === 0) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('dom_vault_photos_')) {
            const rawUser = k.replace('dom_vault_photos_', '');
            const uPhotos = JSON.parse(localStorage.getItem(k) || '[]');
            uPhotos.forEach(p => photos.push({ ...p, author: p.author || rawUser }));
          }
        }
      } catch(e) {}
      // Also check legacy key
      try {
        const legacy = JSON.parse(localStorage.getItem('dom_vault_photos') || '[]');
        legacy.forEach(p => photos.push({ ...p, author: p.author || 'Guest' }));
      } catch(e) {}
    }

    // Filter by selected user if not ALL
    if (selectedUser && selectedUser !== 'ALL') {
      photos = photos.filter(p => (p.author || 'Guest').toLowerCase() === selectedUser.toLowerCase());
    }

    return photos;
  }

  function loadDomVaultData() {
    populateUserDropdown();

    const selectedUser = vaultUserSelect ? vaultUserSelect.value : 'ALL';
    if (btnDeleteUser) {
      btnDeleteUser.style.display = (selectedUser && selectedUser !== 'ALL') ? 'inline-block' : 'none';
    }

    const photos = getPhotosFromStorage();

    // Update Stats
    const totalCount = photos.length;
    const blurredCount = photos.filter(p => p.isBlurred).length;
    const clearCount = totalCount - blurredCount;

    statTotal.textContent = totalCount;
    statBlurred.textContent = blurredCount;
    statClear.textContent = clearCount;

    // Filter photos based on tab state
    let filteredPhotos = photos;
    if (currentFilter === 'blurred') {
      filteredPhotos = photos.filter(p => p.isBlurred);
    } else if (currentFilter === 'clear') {
      filteredPhotos = photos.filter(p => !p.isBlurred);
    }

    renderGrid(filteredPhotos);
  }

  if (vaultUserSelect) {
    vaultUserSelect.addEventListener('change', () => {
      loadDomVaultData();
    });
  }

  // Delete Selected User Account Event
  if (btnDeleteUser) {
    btnDeleteUser.addEventListener('click', () => {
      const selectedUser = vaultUserSelect ? vaultUserSelect.value : 'ALL';
      if (!selectedUser || selectedUser === 'ALL') return;

      if (confirm(`Are you sure you want to completely delete account '${selectedUser}' and ALL photos associated with it?`)) {
        // 1. Remove user photos from master archive
        try {
          let master = JSON.parse(localStorage.getItem('dom_vault_master_archive') || '[]');
          master = master.filter(p => (p.author || 'Guest').toLowerCase() !== selectedUser.toLowerCase());
          localStorage.setItem('dom_vault_master_archive', JSON.stringify(master));
        } catch (e) { }

        // 2. Remove user-specific storage key
        try {
          localStorage.removeItem(getStorageKey(selectedUser));
        } catch (e) { }

        // 3. Remove user from user list
        try {
          let users = getUserList();
          users = users.filter(u => u.toLowerCase() !== selectedUser.toLowerCase());
          localStorage.setItem('dom_vault_user_list', JSON.stringify(users));
        } catch (e) { }

        vaultUserSelect.value = 'ALL';
        loadDomVaultData();
      }
    });
  }

  function renderGrid(photos) {
    if (!domVaultGrid) return;

    if (photos.length === 0) {
      domEmptyState.style.display = 'block';
      domVaultGrid.innerHTML = '';
      domVaultGrid.appendChild(domEmptyState);
      return;
    }

    domEmptyState.style.display = 'none';
    domVaultGrid.innerHTML = '';

    photos.forEach(photo => {
      const card = document.createElement('div');
      card.className = 'photo-card';
      card.dataset.id = photo.id;

      card.innerHTML = `
        <img src="${photo.dataUrl}" alt="${photo.title}">
        <span class="photo-card-badge">${photo.title} [${photo.author || 'User'}] ${photo.isBlurred ? '🌫️' : '✨'}</span>
      `;

      card.addEventListener('click', () => {
        openLightbox(photo);
      });

      domVaultGrid.appendChild(card);
    });
  }

  // Filter Tabs Event Handler
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      loadDomVaultData();
    });
  });

  // -------------------------------------------------------------
  // 3. Lightbox Inspection Modal
  // -------------------------------------------------------------
  function openLightbox(photo) {
    activeLightboxPhoto = photo;
    lightboxImg.src = photo.dataUrl;
    lightboxTitle.textContent = `${photo.title} ${photo.isBlurred ? '[BLURRED SNAPSHOT]' : '[CLEAR SNAPSHOT]'}`;
    lightboxMeta.textContent = `User Account: ${photo.author || 'Guest'} • Captured: ${photo.date} ${photo.timestamp} • Trigger: ${photo.triggerNote}`;
    lightbox.classList.add('show');
  }

  lightboxClose.addEventListener('click', () => {
    lightbox.classList.remove('show');
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.classList.remove('show');
    }
  });

  btnLightboxDownload.addEventListener('click', () => {
    if (!activeLightboxPhoto) return;
    const link = document.createElement('a');
    link.href = activeLightboxPhoto.dataUrl;
    link.download = `${activeLightboxPhoto.id}_DOM_EXPORT.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Delete Image Event inside Lightbox
  if (btnLightboxDelete) {
    btnLightboxDelete.addEventListener('click', () => {
      if (!activeLightboxPhoto) return;
      if (confirm(`Are you sure you want to delete image ${activeLightboxPhoto.title}?`)) {
        const targetId = activeLightboxPhoto.id;
        const author = activeLightboxPhoto.author || 'Guest';

        // 1. Remove from master archive
        try {
          let master = JSON.parse(localStorage.getItem('dom_vault_master_archive') || '[]');
          master = master.filter(p => !(p.id === targetId && (p.author || 'Guest') === author));
          localStorage.setItem('dom_vault_master_archive', JSON.stringify(master));
        } catch (e) { }

        // 2. Remove from user's storage key
        try {
          const userKey = getStorageKey(author);
          let uPhotos = JSON.parse(localStorage.getItem(userKey) || '[]');
          uPhotos = uPhotos.filter(p => p.id !== targetId);
          localStorage.setItem(userKey, JSON.stringify(uPhotos));
        } catch (e) { }

        lightbox.classList.remove('show');
        loadDomVaultData();
      }
    });
  }

  // -------------------------------------------------------------
  // 4. Export Metadata & Clear Archive
  // -------------------------------------------------------------
  btnExportJson.addEventListener('click', () => {
    const photos = getPhotosFromStorage();
    if (photos.length === 0) {
      alert("No photos in Dom Vault to export.");
      return;
    }

    // Strip heavy base64 strings or format full JSON
    const exportData = photos.map(p => ({
      id: p.id,
      title: p.title,
      author: p.author || 'Guest',
      date: p.date,
      timestamp: p.timestamp,
      isBlurred: p.isBlurred,
      triggerNote: p.triggerNote
    }));

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `DOM_VAULT_METADATA_EXPORT_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  btnClearArchive.addEventListener('click', () => {
    if (confirm("Are you sure you want to permanently clear ALL photos and user archives in Dom Vault?")) {
      localStorage.removeItem('dom_vault_master_archive');
      localStorage.removeItem('dom_vault_user_list');
      localStorage.removeItem('dom_vault_photos');
      loadDomVaultData();
    }
  });

  // Auto-refresh when another tab writes to localStorage (camera page)
  window.addEventListener('storage', () => {
    loadDomVaultData();
  });

  // Auto-refresh when user switches back to this tab
  window.addEventListener('focus', () => {
    loadDomVaultData();
  });

  // Also poll every 3 seconds as fallback for same-tab updates
  setInterval(() => {
    loadDomVaultData();
  }, 3000);

  // Initial Load
  loadDomVaultData();
});
