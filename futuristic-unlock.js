/**
 * futuristic-unlock.js — Shared across ALL pages
 *
 * Rules:
 *  - ALWAYS start with dark theme (even on refresh)
 *  - If localStorage has ycwc_futuristic_unlocked=true → show the toggle switch
 *  - User can flip the switch to enable/disable futuristic look per-session
 *  - Switch state is saved in sessionStorage so it persists within the same tab session
 *    but resets on a new tab / full page reload (satisfying "old look on refresh")
 *  - After perfect quiz score: marks password as unlocked, shows button next to DV
 *    that shows ONLY the password when clicked
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════
     THEME CONTROL
  ══════════════════════════════════════ */
  const UNLOCK_KEY  = 'ycwc_futuristic_unlocked';  // localStorage — permanent unlock
  const SESSION_KEY = 'ycwc_fut_session_on';         // sessionStorage — per-session toggle state

  function isUnlocked() {
    return localStorage.getItem(UNLOCK_KEY) === 'true';
  }

  function applyTheme(futuristic) {
    document.documentElement.setAttribute('data-theme', futuristic ? 'futuristic' : 'dark');
    const toggle = document.getElementById('fut-toggle');
    if (toggle) toggle.checked = futuristic;
    const switchWrap = document.getElementById('fut-switch-wrap');
    if (switchWrap) switchWrap.setAttribute('aria-checked', String(futuristic));
  }

  // Expose globally so content.js can call it
  window.activateFuturisticDesign = function () {
    localStorage.setItem(UNLOCK_KEY, 'true');
    sessionStorage.setItem(SESSION_KEY, 'true');
    applyTheme(true);
    injectCyberOverlay();
    buildHeaderControls();
  };

  /* ══════════════════════════════════════
     CYBER OVERLAY (scanlines + grid)
  ══════════════════════════════════════ */
  function injectCyberOverlay() {
    if (document.getElementById('cyber-overlay')) return;
    const el = document.createElement('div');
    el.id = 'cyber-overlay';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="cyber-scanline"></div>' +
      '<div class="cyber-grid"></div>' +
      '<div class="cyber-vignette"></div>';
    document.body.prepend(el);
  }

  function removeCyberOverlay() {
    const el = document.getElementById('cyber-overlay');
    if (el) el.remove();
  }

  /* ══════════════════════════════════════
     HEADER CONTROLS (button + switch)
  ══════════════════════════════════════ */
  function buildHeaderControls() {
    if (!isUnlocked()) return;

    /* ── Theme toggle switch ── */
    if (document.getElementById('fut-switch-wrap')) return; // already built

    const wrap = document.createElement('label');
    wrap.id = 'fut-switch-wrap';
    wrap.title = 'Toggle Futuristic Design';
    wrap.setAttribute('aria-label', 'Toggle Futuristic Design');
    wrap.innerHTML = `
      <span class="fut-switch-label">🌐</span>
      <span class="fut-track">
        <input type="checkbox" id="fut-toggle" ${sessionStorage.getItem(SESSION_KEY) === 'true' ? 'checked' : ''}>
        <span class="fut-thumb"></span>
      </span>
      <span class="fut-switch-label fut-switch-right">FUT</span>
    `;

    // Insert into header brand area
    const brandArea = document.getElementById('header-brand-area');
    if (brandArea) {
      brandArea.appendChild(wrap);
    } else {
      // Fallback: append next to reward button
      const rewardBtn = document.getElementById('reward-header-btn');
      if (rewardBtn && rewardBtn.parentElement) {
        rewardBtn.parentElement.appendChild(wrap);
      } else {
        const header = document.querySelector('.header, .camera-header');
        if (header) header.appendChild(wrap);
      }
    }

    // Toggle listener
    document.getElementById('fut-toggle').addEventListener('change', (e) => {
      const on = e.target.checked;
      if (on) {
        // Require quiz reward password before activating futuristic mode
        showSwitchPasswordPrompt(e.target);
      } else {
        sessionStorage.setItem(SESSION_KEY, 'false');
        applyTheme(false);
        removeCyberOverlay();
      }
    });
  }

  /* ══════════════════════════════════════
     SWITCH PASSWORD PROMPT
     Called when user flips the futuristic toggle ON.
     Requires the quiz reward password (AI26).
  ══════════════════════════════════════ */
  function showSwitchPasswordPrompt(toggleEl) {
    // If already verified this session, activate immediately
    if (sessionStorage.getItem('ycwc_fut_pw_verified') === 'true') {
      sessionStorage.setItem(SESSION_KEY, 'true');
      applyTheme(true);
      injectCyberOverlay();
      return;
    }

    // Build prompt overlay
    const existing = document.getElementById('fut-pw-prompt');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'fut-pw-prompt';
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:99999;
      background:rgba(2,6,18,0.85);
      backdrop-filter:blur(18px);
      display:flex;justify-content:center;align-items:center;
      animation:futPwFadeIn 0.25s ease;
    `;
    overlay.innerHTML = `
      <style>
        @keyframes futPwFadeIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
        #fut-pw-card{
          background:rgba(10,20,50,0.95);
          border:1px solid rgba(0,240,255,0.4);
          border-radius:20px;
          padding:2rem 1.8rem;
          max-width:370px;width:90%;
          text-align:center;
          box-shadow:0 0 60px rgba(0,240,255,0.25);
          font-family:'Space Grotesk','Inter',sans-serif;
        }
        #fut-pw-card .fp-icon{font-size:2.8rem;margin-bottom:.75rem;display:block;}
        #fut-pw-card h3{color:#fff;font-size:1.3rem;margin:0 0 .35rem;}
        #fut-pw-card p{color:#94a3b8;font-size:.82rem;margin:0 0 1.25rem;}
        #fut-pw-input{
          font-family:'Space Grotesk',monospace;
          font-size:1.15rem;
          text-align:center;
          letter-spacing:.18em;
          padding:.75rem 1rem;
          width:100%;box-sizing:border-box;
          background:rgba(0,0,0,.5);
          border:1px solid rgba(0,240,255,0.35);
          border-radius:10px;
          color:#00f0ff;
          outline:none;
          margin-bottom:1rem;
          transition:border-color .2s,box-shadow .2s;
        }
        #fut-pw-input:focus{border-color:#00f0ff;box-shadow:0 0 12px rgba(0,240,255,.4);}
        #fut-pw-input.shake{animation:fpShake .4s ease;}
        @keyframes fpShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
        .fp-btn-row{display:flex;gap:.75rem;justify-content:center;}
        #fut-pw-submit{
          font-family:'Space Grotesk',sans-serif;
          font-weight:700;font-size:.9rem;
          padding:.65rem 1.4rem;
          border-radius:10px;border:none;
          background:linear-gradient(135deg,#00f0ff,#a000ff);
          color:#000;cursor:pointer;
          transition:opacity .2s,transform .2s;
        }
        #fut-pw-submit:hover{opacity:.85;transform:translateY(-1px);}
        #fut-pw-cancel{
          font-family:'Space Grotesk',sans-serif;
          font-weight:600;font-size:.85rem;
          padding:.65rem 1.2rem;
          border-radius:10px;
          border:1px solid rgba(255,255,255,.15);
          background:transparent;color:#94a3b8;cursor:pointer;
        }
        #fut-pw-cancel:hover{background:rgba(255,255,255,.06);}
        #fut-pw-hint{font-size:.75rem;color:#475569;margin-top:.85rem;}
      </style>
      <div id="fut-pw-card">
        <span class="fp-icon">🔐</span>
        <h3>Futuristic Mode</h3>
        <p>Enter the password you earned from the Quiz to activate the Futuristic Design.</p>
        <input id="fut-pw-input" type="password" placeholder="ENTER PASSWORD" autocomplete="off" autofocus>
        <div class="fp-btn-row">
          <button id="fut-pw-submit">⚡ Activate</button>
          <button id="fut-pw-cancel">Cancel</button>
        </div>
        <p id="fut-pw-hint">Tip: Complete the Quiz with a perfect score to earn the password 🏆</p>
      </div>
    `;

    document.body.appendChild(overlay);

    const input = overlay.querySelector('#fut-pw-input');

    function doCancel() {
      // Flip the switch back off
      if (toggleEl) toggleEl.checked = false;
      overlay.style.animation = 'futPwFadeIn .2s ease reverse';
      setTimeout(() => overlay.remove(), 200);
    }

    function doSubmit() {
      const val = input.value.trim();
      if (val === 'AI26' || val.toUpperCase() === 'AI26') {
        // Correct — cache verification and activate
        sessionStorage.setItem('ycwc_fut_pw_verified', 'true');
        sessionStorage.setItem(SESSION_KEY, 'true');
        overlay.style.animation = 'futPwFadeIn .2s ease reverse';
        setTimeout(() => {
          overlay.remove();
          applyTheme(true);
          injectCyberOverlay();
        }, 180);
      } else {
        // Wrong — shake and flip switch back
        input.classList.remove('shake');
        void input.offsetWidth; // reflow to restart animation
        input.classList.add('shake');
        input.style.borderColor = '#ff0050';
        input.style.color = '#ff0050';
        setTimeout(() => {
          input.style.borderColor = '';
          input.style.color = '';
          input.value = '';
          input.focus();
        }, 600);
        if (toggleEl) toggleEl.checked = false;
      }
    }

    overlay.querySelector('#fut-pw-submit').addEventListener('click', doSubmit);
    overlay.querySelector('#fut-pw-cancel').addEventListener('click', doCancel);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSubmit();
      if (e.key === 'Escape') doCancel();
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) doCancel(); });
  }

  /* ══════════════════════════════════════
     PASSWORD POPUP (reward button click)
  ══════════════════════════════════════ */
  function showPasswordPopup(anchorEl) {
    const existing = document.getElementById('pw-popup');
    if (existing) { existing.remove(); return; }

    const pop = document.createElement('div');
    pop.id = 'pw-popup';
    pop.innerHTML = `
      <div class="pw-pop-scanline"></div>
      <div class="pw-pop-label">🔑 &nbsp;FUTURISTIC PASSWORD</div>
      <div class="pw-pop-code" id="pw-pop-code-text">AI26</div>
      <p class="pw-pop-hint">Flip the switch in the header to activate the futuristic look!</p>
      <button class="pw-pop-copy" id="pw-pop-copy">📋 Copy</button>
    `;
    document.body.appendChild(pop);

    const rect = anchorEl.getBoundingClientRect();
    pop.style.top  = (rect.bottom + window.scrollY + 10) + 'px';
    pop.style.left = Math.max(8, rect.left + window.scrollX - 60) + 'px';

    document.getElementById('pw-pop-copy').addEventListener('click', () => {
      navigator.clipboard.writeText('AI26').then(() => {
        const b = document.getElementById('pw-pop-copy');
        if (b) { b.textContent = '✓ Copied!'; b.style.color = '#4ade80'; }
      });
    });

    setTimeout(() => {
      function outsideClick(e) {
        const p = document.getElementById('pw-popup');
        if (p && !p.contains(e.target) && e.target !== anchorEl) {
          p.remove();
          document.removeEventListener('click', outsideClick);
        }
      }
      document.addEventListener('click', outsideClick);
    }, 120);
  }

  /* ══════════════════════════════════════
     RIPPLE EFFECT
  ══════════════════════════════════════ */
  function initRipple() {
    document.addEventListener('click', (e) => {
      const el = e.target.closest(
        '.btn, .btn-cam, .btn-action, .quiz-btn, .btn-about, .sidebar-link, .nav-link, .impact-card, .ai-type-card, .ethics-card'
      );
      if (!el) return;
      const ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2.2;
      ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
      el.style.overflow = 'hidden';
      el.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    });
  }

  /* ══════════════════════════════════════
     MOUSE GLOW TRAIL (futuristic mode only)
  ══════════════════════════════════════ */
  function initMouseGlow() {
    let dot = document.getElementById('mouse-glow-dot');
    if (dot) return;
    dot = document.createElement('div');
    dot.id = 'mouse-glow-dot';
    document.body.appendChild(dot);

    let x = 0, y = 0, tx = 0, ty = 0;
    document.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });

    function tick() {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      dot.style.transform = `translate(${x - 12}px, ${y - 12}px)`;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ══════════════════════════════════════
     CARD TILT (futuristic 3D hover)
  ══════════════════════════════════════ */
  function initCardTilt() {
    document.querySelectorAll('.impact-card, .ai-type-card, .ethics-card, .skill-card, .cert-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        if (document.documentElement.getAttribute('data-theme') !== 'futuristic') return;
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        card.style.transform = `perspective(600px) rotateY(${dx * 6}deg) rotateX(${-dy * 6}deg) translateZ(8px)`;
        card.style.boxShadow = `${-dx * 12}px ${dy * 12}px 40px rgba(0,255,204,0.12)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.boxShadow = '';
        card.style.transition = 'transform 0.5s ease, box-shadow 0.5s ease';
        setTimeout(() => { card.style.transition = ''; }, 500);
      });
    });
  }

  /* ══════════════════════════════════════
     INIT ON DOM READY
  ══════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    // Always start dark — NEVER auto-apply futuristic on load
    document.documentElement.setAttribute('data-theme', 'dark');

    // If unlocked previously: show controls and restore session state
    if (isUnlocked()) {
      buildHeaderControls();

      // Restore session preference (user switched ON before navigating)
      if (sessionStorage.getItem(SESSION_KEY) === 'true') {
        applyTheme(true);
        injectCyberOverlay();
      }
    }


    // Ripple
    initRipple();

    // Card tilt
    initCardTilt();

    // Mouse glow (only when futuristic is on)
    document.documentElement.addEventListener('DOMAttrModified', () => {
      if (document.documentElement.getAttribute('data-theme') === 'futuristic') initMouseGlow();
    });

    // Cross-tab sync
    window.addEventListener('storage', (e) => {
      if (e.key === UNLOCK_KEY && e.newValue === 'true') {
        buildHeaderControls();
      }
    });
  });

  // Expose for quiz perfect-score trigger
  window._futuristicMarkUnlocked = function () {
    localStorage.setItem(UNLOCK_KEY, 'true');
    buildHeaderControls();
  };

})();
