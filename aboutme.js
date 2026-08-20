/* ═══════════════════════════════════════════
   aboutme.js — About Me page interactions
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Scroll-triggered fade-in ──
  function initScrollAnimations() {
    const targets = document.querySelectorAll(
      '.skill-card, .cert-card, .about-profile-card, .about-bio-card, .block-badge, .block-title, .block-subtitle'
    );

    targets.forEach(el => el.classList.add('fade-up'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, idx) => {
          if (entry.isIntersecting) {
            // stagger the animations slightly
            setTimeout(() => {
              entry.target.classList.add('visible');
            }, idx * 60);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );

    targets.forEach(el => observer.observe(el));
  }

  // ── Skill bar animation ──
  function initSkillBars() {
    const bars = document.querySelectorAll('.skill-bar-fill');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const bar = entry.target;
            const targetWidth = bar.style.width;
            bar.style.setProperty('--target-width', targetWidth);
            bar.style.width = '0';
            // force reflow then animate
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                bar.style.transition = 'width 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                bar.style.width = targetWidth;
              });
            });
            observer.unobserve(bar);
          }
        });
      },
      { threshold: 0.3 }
    );

    bars.forEach(bar => observer.observe(bar));
  }

  // ── Smooth scroll for anchor links ──
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // ── Certificate card image handling ──
  function initCertImages() {
    // For images that fail to load, show placeholder
    document.querySelectorAll('.cert-image').forEach(img => {
      img.addEventListener('error', function () {
        this.style.display = 'none';
        const placeholder = this.nextElementSibling;
        if (placeholder && placeholder.classList.contains('cert-placeholder')) {
          placeholder.style.display = 'flex';
        }
      });
    });
  }

  // ── Full-Screen 3-Second Binary Face Intro Overlay ──
  function initBinaryIntroOverlay() {
    const overlay = document.getElementById('binary-intro-overlay');
    const canvas = document.getElementById('binary-intro-canvas');
    const countdownEl = document.getElementById('binary-countdown');
    if (!overlay || !canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId = null;
    let countdownInterval = null;
    let autoCloseTimer = null;
    let gridData = [];
    let cols = 0;
    let rows = 0;
    let charWidth = 0;
    let charHeight = 0;
    let timeLeft = 3;

    function triggerOverlay() {
      // Clear any existing running timer/animation
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (countdownInterval) clearInterval(countdownInterval);
      if (autoCloseTimer) clearTimeout(autoCloseTimer);

      overlay.classList.add('active');
      timeLeft = 3;
      if (countdownEl) countdownEl.textContent = '3';

      countdownInterval = setInterval(() => {
        timeLeft--;
        if (countdownEl && timeLeft >= 0) {
          countdownEl.textContent = timeLeft;
        }
        if (timeLeft <= 0) {
          clearInterval(countdownInterval);
        }
      }, 1000);

      autoCloseTimer = setTimeout(() => {
        closeOverlay();
      }, 3000);

      startBinaryAnimation();
    }

    // Show overlay automatically upon entering the page
    triggerOverlay();

    function closeOverlay() {
      overlay.classList.remove('active');
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (countdownInterval) clearInterval(countdownInterval);
      if (autoCloseTimer) clearTimeout(autoCloseTimer);
    }

    // Skip on click anywhere on the overlay or Escape key
    overlay.addEventListener('click', closeOverlay);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        closeOverlay();
      }
    });

    function startBinaryAnimation() {
      const img = new Image();
      // Load user specified photo 32c9fd01-48f7-497e-a7f5-14ab1834abe6.jpg
      img.src = '32c9fd01-48f7-497e-a7f5-14ab1834abe6.jpg';
      img.onload = () => {
        setupCanvasAndRender(img);
      };
      img.onerror = () => {
        img.src = 'profile-photo.jpg';
        img.onload = () => setupCanvasAndRender(img);
      };
    }

    function setupCanvasAndRender(img) {
      const w = window.innerWidth || document.documentElement.clientWidth || 1200;
      const h = window.innerHeight || document.documentElement.clientHeight || 800;
      const dpr = Math.max(window.devicePixelRatio || 1, 1.25);

      canvas.width = w * dpr;
      canvas.height = h * dpr;

      // Density of characters for full-screen detail
      cols = Math.floor(w / 7.5);
      if (cols < 90) cols = 90;
      rows = Math.floor(cols * (canvas.height / canvas.width));

      charWidth = canvas.width / cols;
      charHeight = canvas.height / rows;

      const offscreen = document.createElement('canvas');
      offscreen.width = cols;
      offscreen.height = rows;
      const offCtx = offscreen.getContext('2d');

      const imgAspect = img.width / img.height;
      const canvasAspect = cols / rows;
      let drawW, drawH, drawX, drawY;

      if (imgAspect > canvasAspect) {
        drawH = rows;
        drawW = rows * imgAspect;
        drawX = (cols - drawW) / 2;
        drawY = 0;
      } else {
        drawW = cols;
        drawH = cols / imgAspect;
        drawX = 0;
        drawY = (rows - drawH) / 2;
      }

      offCtx.fillStyle = '#000';
      offCtx.fillRect(0, 0, cols, rows);
      offCtx.drawImage(img, drawX, drawY, drawW, drawH);

      const imgData = offCtx.getImageData(0, 0, cols, rows).data;
      gridData = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = (r * cols + c) * 4;
          const red = imgData[idx];
          const green = imgData[idx + 1];
          const blue = imgData[idx + 2];

          const brightness = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
          gridData.push({
            x: c * charWidth,
            y: r * charHeight,
            brightness: brightness,
            char: Math.random() > 0.5 ? '1' : '0'
          });
        }
      }

      let frameCount = 0;

      function renderLoop() {
        ctx.fillStyle = '#020610';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = `600 ${Math.floor(charHeight * 0.95)}px "Space Grotesk", "Consolas", monospace`;
        ctx.textBaseline = 'top';

        frameCount++;

        for (let i = 0; i < gridData.length; i++) {
          const item = gridData[i];
          const b = item.brightness;

          if (b < 0.03) continue;

          if (frameCount % 3 === 0 && Math.random() < 0.09) {
            item.char = Math.random() > 0.5 ? '1' : '0';
          }

          let color;
          let shadowBlur = 0;

          if (b > 0.65) {
            // Bright facial features / highlights -> Electric White Cyan Glow
            color = `rgba(224, 247, 255, ${Math.min(1, b + 0.25)})`;
            shadowBlur = 8;
          } else if (b > 0.35) {
            // Midtones -> Neon Cyan Blue
            color = `rgba(0, 240, 255, ${b + 0.2})`;
            shadowBlur = 4;
          } else if (b > 0.18) {
            // Shadows -> Deep Blue
            color = `rgba(0, 140, 255, ${b + 0.15})`;
          } else {
            // Faint outlines -> Dark Cyber Blue
            color = `rgba(0, 75, 175, ${b * 1.8})`;
          }
          ctx.fillStyle = color;
          if (shadowBlur > 0) {
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = shadowBlur;
          } else {
            ctx.shadowBlur = 0;
          }

          ctx.fillText(item.char, item.x, item.y);
        }

        animationFrameId = requestAnimationFrame(renderLoop);
      }

      renderLoop();
    }
  }

  // ══════════════════════════════════════════════════════════
  //  BINARY FLOOD — 4-Phase Drama
  //
  //  PHASE 0 · RISING     — flood rises from bottom, elements glitch on contact
  //  PHASE 1 · FIGHT      — flood hits photo, photo fights back (shake + oscillate)
  //  PHASE 2 · EXPLODE    — photo wins: binary particle explosion, flood driven away
  //  PHASE 3 · AFTERMATH  — 3 s full-page chaos, then everything restores to normal
  // ══════════════════════════════════════════════════════════
  function initBinaryFlood() {
    const tryBtn      = document.getElementById('btn-try-binary');
    const floodCanvas = document.getElementById('binary-flood-canvas');
    if (!tryBtn || !floodCanvas) return;

    const ctx = floodCanvas.getContext('2d');
    const FS  = 13;

    // Phase constants
    const P_RISING    = 0;
    const P_FIGHT     = 1;
    const P_EXPLODE   = 2;
    const P_AFTERMATH = 3;

    let animId     = null;
    let running    = false;
    let phase      = P_RISING;
    let phaseF     = 0;        // frames elapsed in current phase
    let fadeAlpha  = 1;
    let floodLevel = 0;        // document Y — rising ceiling (decreases = rises)
    let cols = [], numCols = 0, numRows = 0;
    let DOC_W = 0, DOC_H = 0;
    let frameCount  = 0;
    let glitchTargets = [];
    let exParticles   = [];    // explosion binary particles
    let chaosTimeout  = null;

    // Avatar ring info — populated in collectTargets()
    let avatarRing  = null;
    let avatarTrigY = 0;       // doc Y — flood triggers FIGHT here (avatar bottom - margin)
    let avatarDocCX = 0;       // doc X of avatar centre (canvas particle origin)
    let avatarDocCY = 0;       // doc Y of avatar centre (canvas particle origin)
    let avatarVpCX  = 0;       // viewport X (fixed DOM rings)
    let avatarVpCY  = 0;       // viewport Y (fixed DOM rings)

    // ── Progressive Binary Rot Layer Helpers ──────────────────
    function createRotLayer(el) {
      let layer = el.querySelector('.binary-rot-layer');
      if (!layer) {
        layer = document.createElement('div');
        layer.className = 'binary-rot-layer';
        let txt = '';
        for (let i = 0; i < 180; i++) {
          txt += (Math.random() > 0.5 ? '1' : '0') + (i % 22 === 21 ? '\n' : ' ');
        }
        layer.textContent = txt;
        const saved = getComputedStyle(el).position;
        if (saved === 'static') el.style.position = 'relative';
        el._floodPos = saved;
        el.appendChild(layer);
      }
      return layer;
    }

    function removeRotLayer(el) {
      el.querySelector('.binary-rot-layer')?.remove();
      if (el._floodPos === 'static') el.style.position = '';
    }

    // ── Collect glitchable targets ────────────────────────────
    function collectTargets() {
      const sels = [
        '.about-bio-card', '.bio-lead', '.bio-text',
        '.profile-name', '.profile-tagline', '.profile-badge',
        '.social-pill', '.skill-card', '.cert-card',
        '.block-title', '.block-subtitle', '.block-badge',
        '.btn-about', '.about-footer'
      ];
      glitchTargets = [];
      sels.forEach(s => {
        document.querySelectorAll(s).forEach(el => {
          const r = el.getBoundingClientRect();
          const height = Math.max(1, r.height);
          glitchTargets.push({
            el,
            docTop:    r.top    + window.scrollY,
            docBottom: r.bottom + window.scrollY,
            height:    height,
            glitching: false,
            rotLayer:  createRotLayer(el)
          });
        });
      });

      // Avatar is handled separately for the fight sequence
      avatarRing = document.querySelector('.profile-avatar-ring');
      if (avatarRing) {
        const r      = avatarRing.getBoundingClientRect();
        avatarTrigY  = r.bottom + window.scrollY - FS * 2;
        avatarDocCX  = r.left + r.width  / 2;
        avatarDocCY  = r.top  + window.scrollY + r.height / 2;
        avatarVpCX   = r.left + r.width  / 2;
        avatarVpCY   = r.top  + r.height / 2;
      }
    }

    // ── Canvas / document setup ───────────────────────────────
    function setup() {
      DOC_W = Math.max(document.documentElement.scrollWidth, window.innerWidth);
      DOC_H = document.documentElement.scrollHeight;
      floodCanvas.style.cssText =
        `position:absolute;top:0;left:0;width:${DOC_W}px;height:${DOC_H}px;` +
        `opacity:1;pointer-events:none;background:transparent;z-index:500;`;
      floodCanvas.width  = DOC_W;
      floodCanvas.height = DOC_H;
      numCols = Math.floor(DOC_W / FS);
      numRows = Math.floor(DOC_H / FS) + 2;
      cols = [];
      for (let c = 0; c < numCols; c++) {
        const chars = [];
        for (let r = 0; r < numRows; r++) chars.push(Math.random() > 0.5 ? '1' : '0');
        cols.push({ x: c * FS, chars, lag: Math.random() * DOC_H * 0.04 });
      }
      floodLevel = DOC_H + FS;
    }

    // ── Draw the binary flood body ────────────────────────────
    function drawFlood(alpha) {
      ctx.font = `bold ${FS}px "Courier New",monospace`;
      ctx.textBaseline = 'top';
      for (let c = 0; c < numCols; c++) {
        const col  = cols[c];
        const ceil = floodLevel + col.lag;
        if (frameCount % 4 === c % 4) {
          col.chars[Math.floor(Math.random() * col.chars.length)] = Math.random() > 0.5 ? '1' : '0';
        }
        for (let r = 0; r < numRows; r++) {
          const cy = r * FS;
          if (cy < ceil) continue;
          const dist = cy - ceil;
          let rC, gC, bC, aC;
          ctx.shadowBlur = 0;
          if (dist < FS * 1.5) {
            rC = 220; gC = 255; bC = 255; aC = alpha;
            ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 20;
          } else if (dist < FS * 5) {
            rC = 0; gC = 220; bC = 255; aC = alpha * 0.95;
            ctx.shadowColor = '#00dcff'; ctx.shadowBlur = 10;
          } else if (dist < FS * 16) {
            const t = (dist - FS * 5) / (FS * 11);
            rC = 0; gC = Math.round(150 - t * 120); bC = 245; aC = alpha * (0.88 - t * 0.25);
          } else {
            const t = Math.min(1, (dist - FS * 16) / (DOC_H * 0.4));
            rC = 0; gC = 20; bC = Math.round(190 - t * 100); aC = alpha * Math.max(0, 0.58 - t * 0.52);
          }
          if (aC < 0.03) continue;
          ctx.fillStyle = `rgba(${rC},${gC},${bC},${aC})`;
          ctx.fillText(col.chars[r], col.x, cy);
          ctx.shadowBlur = 0;
        }
      }
    }

    // ── Explosion particle system ─────────────────────────────
    function spawnExplosion() {
      const PALETTE = ['#00f0ff', '#ff0050', '#a000ff', '#00ff64', '#ffffff', '#ffee00', '#ff8800'];
      for (let i = 0; i < 140; i++) {
        const angle = Math.PI * 2 * i / 140 + (Math.random() - 0.5) * 0.5;
        const speed = 9 + Math.random() * 24;
        exParticles.push({
          x: avatarDocCX, y: avatarDocCY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          char:  Math.random() > 0.5 ? '1' : '0',
          color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
          life: 1,
          decay: 0.015 + Math.random() * 0.025,
          size:  10 + Math.random() * 11
        });
      }
    }

    function drawExplosionParticles() {
      ctx.textBaseline = 'top';
      for (let i = exParticles.length - 1; i >= 0; i--) {
        const p = exParticles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.28;
        p.life -= p.decay;
        if (p.life <= 0) { exParticles.splice(i, 1); continue; }
        ctx.globalAlpha = p.life;
        ctx.fillStyle   = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur  = 14;
        ctx.font = `bold ${Math.round(p.size)}px "Courier New",monospace`;
        ctx.fillText(p.char, p.x, p.y);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur  = 0;
    }

    // ── DOM explosion rings (fixed-position) ──────────────────
    function spawnExplosionRings() {
      const COLORS = ['#00f0ff', '#ff0050', '#a000ff', '#00ff64'];
      [0, 130, 280, 450].forEach((delay, idx) => {
        setTimeout(() => {
          const ring = document.createElement('div');
          ring.className = 'explosion-ring';
          const sz  = 180 + idx * 60;
          const col = COLORS[idx % COLORS.length];
          ring.style.cssText =
            `left:${avatarVpCX - sz / 2}px;top:${avatarVpCY - sz / 2}px;` +
            `width:${sz}px;height:${sz}px;border-color:${col};` +
            `box-shadow:0 0 30px ${col},0 0 60px ${col},inset 0 0 30px ${col}44;`;
          document.body.appendChild(ring);
          setTimeout(() => ring.remove(), 1100);
        }, delay);
      });
    }

    // ── Full-page chaos ───────────────────────────────────────
    function startChaos() {
      let ov = document.getElementById('chaos-overlay');
      if (!ov) {
        ov = document.createElement('div');
        ov.id = 'chaos-overlay';
        document.body.appendChild(ov);
      }
      ov.classList.add('active');
      document.body.classList.add('page-chaos');
    }

    function stopChaos() {
      document.getElementById('chaos-overlay')?.classList.remove('active');
      document.body.classList.remove('page-chaos');
    }

    // ── Cleanup ───────────────────────────────────────────────
    function cleanupAll() {
      glitchTargets.forEach(t => {
        t.el.classList.remove('flood-glitch', 'flood-touch-impact');
        t.glitching = false;
        removeRotLayer(t.el);
      });
      avatarRing?.classList.remove('flood-glitch', 'avatar-fight', 'avatar-explode-flash');
    }

    function stop() {
      running = false;
      if (animId) cancelAnimationFrame(animId);
      animId = null;
      if (chaosTimeout) clearTimeout(chaosTimeout);
      ctx.clearRect(0, 0, DOC_W, DOC_H);
      floodCanvas.style.cssText =
        'position:fixed;top:0;left:0;width:100vw;height:100vh;opacity:0;pointer-events:none;background:transparent;';
      cleanupAll();
      stopChaos();
      exParticles = [];
    }

    // ── Main animation loop ───────────────────────────────────
    function loop() {
      if (!running) return;
      frameCount++;
      phaseF++;
      ctx.clearRect(0, 0, DOC_W, DOC_H);

      // ────────────────────────────────────────────────────────
      // PHASE 0 · RISING
      //   Flood rises from bottom. Binary rot eats step-by-step
      //   into elements from bottom to top as floodLevel moves up.
      //   Stops when it reaches the avatar bottom edge → FIGHT.
      // ────────────────────────────────────────────────────────
      if (phase === P_RISING) {
        const dist  = Math.max(0, floodLevel - avatarTrigY);
        const speed = Math.max(1.5, Math.min(6, dist / 80 + 2));
        if (floodLevel > avatarTrigY) floodLevel -= speed;

        // Progressive step-by-step binary rot & glitch as flood rises
        glitchTargets.forEach(t => {
          const submergedPx = Math.max(0, Math.min(t.height, t.docBottom - floodLevel));
          
          if (submergedPx > 0) {
            if (!t.glitching) {
              t.glitching = true;
              t.el.classList.add('flood-glitch', 'flood-touch-impact');
              setTimeout(() => t.el.classList.remove('flood-touch-impact'), 400);
            }

            // Construct organic multi-point wave polygon matching the wave front
            const pts = [];
            for (let i = 0; i <= 8; i++) {
              const xPct = i * 12.5;
              const waveOffset = Math.sin((xPct * 0.08) + (frameCount * 0.15)) * 14 +
                                 Math.cos((xPct * 0.12) - (frameCount * 0.10)) * 8;
              const waveY = floodLevel + waveOffset;
              const yPct = Math.max(0, Math.min(100, ((waveY - t.docTop) / t.height) * 100));
              pts.push(`${xPct.toFixed(1)}% ${yPct.toFixed(1)}%`);
            }

            if (t.rotLayer) {
              t.rotLayer.style.clipPath = `polygon(0% 100%, ${pts.join(', ')}, 100% 100%)`;
              if (frameCount % 3 === 0) {
                let txt = '';
                for (let i = 0; i < 180; i++) {
                  txt += (Math.random() > 0.5 ? '1' : '0') + (i % 22 === 21 ? '\n' : ' ');
                }
                t.rotLayer.textContent = txt;
              }
            }
          } else {
            if (t.rotLayer) {
              t.rotLayer.style.clipPath = 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)';
            }
          }
        });

        drawFlood(1);

        // Trigger FIGHT when flood reaches avatar
        if (floodLevel <= avatarTrigY + 2) {
          phase  = P_FIGHT;
          phaseF = 0;
          avatarRing?.classList.add('avatar-fight');
        }
      }

      // ────────────────────────────────────────────────────────
      // PHASE 1 · FIGHT
      //   Photo fights back! Flood oscillates (pushed back & forth).
      //   Canvas shakes to feel the impact.
      //   After ~1.5 s → EXPLODE.
      // ────────────────────────────────────────────────────────
      else if (phase === P_FIGHT) {
        // Oscillate flood level around avatar bottom — "push-back"
        const osc = Math.sin(phaseF * 0.35) * FS * 3;
        floodLevel = avatarTrigY + osc;

        // Screen shake — intensifies as fight goes on
        const intensity = Math.min(1, phaseF / 60);
        const shakeX = (Math.random() - 0.5) * 8 * intensity;
        const shakeY = (Math.random() - 0.5) * 8 * intensity;
        ctx.save();
        ctx.translate(shakeX, shakeY);
        drawFlood(1);
        ctx.restore();

        // After ~1.5 s (≈90 frames at 60 fps) → EXPLODE
        if (phaseF > 90) {
          phase  = P_EXPLODE;
          phaseF = 0;
          avatarRing?.classList.remove('avatar-fight');
          avatarRing?.classList.add('avatar-explode-flash');
          spawnExplosion();
          spawnExplosionRings();
        }
      }

      // ────────────────────────────────────────────────────────
      // PHASE 2 · EXPLODE
      //   Photo wins. Flood retreats rapidly downward.
      //   Binary particles burst outward from photo centre.
      //   After ~1 s → AFTERMATH.
      // ────────────────────────────────────────────────────────
      else if (phase === P_EXPLODE) {
        // Flood retreats fast
        floodLevel += 16;
        fadeAlpha = Math.max(0, 1 - phaseF / 40);

        if (fadeAlpha > 0) drawFlood(fadeAlpha);
        drawExplosionParticles();

        // After ~1 s → AFTERMATH
        if (phaseF > 62) {
          phase  = P_AFTERMATH;
          phaseF = 0;
          avatarRing?.classList.remove('avatar-explode-flash');
          cleanupAll();
          fadeAlpha = 0;
          ctx.clearRect(0, 0, DOC_W, DOC_H);

          // 3-second full-page chaos, then restore
          startChaos();
          chaosTimeout = setTimeout(() => {
            stopChaos();
            setTimeout(() => stop(), 500);
          }, 3000);
        }
      }

      // ────────────────────────────────────────────────────────
      // PHASE 3 · AFTERMATH
      //   Canvas is invisible — all chaos is CSS-driven via
      //   .page-chaos on <body>. Loop stays alive until stop().
      // ────────────────────────────────────────────────────────
      // (nothing to draw — chaosTimeout will call stop())

      animId = requestAnimationFrame(loop);
    }

    // ── Try button ────────────────────────────────────────────
    tryBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (running) { stop(); return; }

      // Reset state and start fresh
      phase      = P_RISING;
      phaseF     = 0;
      fadeAlpha  = 1;
      frameCount = 0;
      exParticles = [];
      running    = true;
      setup();
      collectTargets();
      loop();
    });
  }

  // ── Initialize ──
  document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initSkillBars();
    initSmoothScroll();
    initCertImages();
    initBinaryIntroOverlay();
    initBinaryFlood();
  });
})();
