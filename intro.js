/* ═══════════════════════════════════════════════
   FUTURISTIC INTRO SCREEN — intro.js
   ═══════════════════════════════════════════════ */

(function () {
  const screen   = document.getElementById('intro-screen');
  const fill     = document.getElementById('intro-progress-fill');
  const label    = document.getElementById('intro-progress-label');
  const titleEl  = document.getElementById('intro-title');
  const canvas   = document.getElementById('intro-canvas');
  const ctx      = canvas ? canvas.getContext('2d') : null;

  if (!screen) return;

  /* ── Particle canvas background ── */
  function resizeCanvas() {
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const particles = Array.from({ length: 80 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    r: Math.random() * 1.5 + 0.5,
    alpha: Math.random() * 0.6 + 0.2,
  }));

  let rafId;
  function drawParticles() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 240, 255, ${p.alpha})`;
      ctx.fill();
    });

    // Draw faint connecting lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0,240,255,${0.08 * (1 - dist / 100)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    rafId = requestAnimationFrame(drawParticles);
  }
  drawParticles();

  /* ── Typewriter for title ── */
  const words = ['DOMS', 'FUTURE.', 'AI LIFE.'];
  let wordIdx = 0, charIdx = 0, deleting = false;
  let typeTimer;

  function typeWrite() {
    const word = words[wordIdx];
    if (!deleting) {
      titleEl.textContent = word.slice(0, ++charIdx);
      if (charIdx === word.length) {
        deleting = true;
        typeTimer = setTimeout(typeWrite, 800);
        return;
      }
    } else {
      titleEl.textContent = word.slice(0, --charIdx);
      if (charIdx === 0) {
        deleting = false;
        wordIdx = (wordIdx + 1) % words.length;
      }
    }
    typeTimer = setTimeout(typeWrite, deleting ? 60 : 100);
  }
  typeWrite();

  /* ── Progress bar ── */
  const DURATION = 2800; // ms total
  let start = null;

  function animateProgress(ts) {
    if (!start) start = ts;
    const elapsed = ts - start;
    const pct = Math.min(100, Math.round((elapsed / DURATION) * 100));

    fill.style.width  = pct + '%';
    label.textContent = pct + '%';

    if (pct < 100) {
      requestAnimationFrame(animateProgress);
    } else {
      // Done — fade out intro
      setTimeout(dismissIntro, 300);
    }
  }

  // Small delay before starting progress so logo has time to appear
  setTimeout(() => requestAnimationFrame(animateProgress), 400);

  /* ── Dismiss ── */
  function dismissIntro() {
    clearTimeout(typeTimer);
    cancelAnimationFrame(rafId);
    screen.classList.add('fade-out');
    setTimeout(() => {
      if (screen.parentNode) screen.parentNode.removeChild(screen);
    }, 900);
  }

  // Also allow clicking/tapping to skip
  screen.addEventListener('click', dismissIntro);
})();
