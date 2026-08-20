(function(){
  try {
    const canvas = document.getElementById('bg-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if(!ctx) return;

    let w = canvas.width = innerWidth;
    let h = canvas.height = innerHeight;

    // Performance: cap at 200 particles max (using spatial grid so it's efficient)
    const count = Math.min(200, Math.max(50, Math.round((w * h) / 10000)));
    const particles = [];
    const connectionDist = 120;
    const gridSize = connectionDist;
    let paused = false;

    function rand(min, max) { return Math.random() * (max - min) + min; }

    function resize() {
      w = canvas.width = innerWidth;
      h = canvas.height = innerHeight;
    }
    addEventListener('resize', resize);

    // Pause when tab is hidden
    document.addEventListener('visibilitychange', () => {
      paused = document.hidden;
      if (!paused) requestAnimationFrame(draw);
    });

    for (let i = 0; i < count; i++) {
      particles.push({
        x: rand(0, w),
        y: rand(0, h),
        r: rand(0.5, 2.2),
        vx: rand(-0.2, 0.2),
        vy: rand(-0.06, 0.06),
        alpha: rand(0.2, 0.8)
      });
    }

    // Spatial grid for O(n) connection line lookups
    function buildGrid() {
      const grid = {};
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const cx = Math.floor(p.x / gridSize);
        const cy = Math.floor(p.y / gridSize);
        const key = cx + ',' + cy;
        if (!grid[key]) grid[key] = [];
        grid[key].push(i);
      }
      return grid;
    }

    function getNeighborCells(cx, cy) {
      const cells = [];
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          cells.push((cx + dx) + ',' + (cy + dy));
        }
      }
      return cells;
    }

    function draw() {
      if (paused) return;

      try {
        ctx.clearRect(0, 0, w, h);

        const theme = document.documentElement?.getAttribute?.('data-theme') || 'dark';
        const isDark = theme === 'dark';
        const rgb = isDark ? '255,255,255' : '0,0,0';

        // Move particles
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -10) p.x = w + 10;
          if (p.x > w + 10) p.x = -10;
          if (p.y < -10) p.y = h + 10;
          if (p.y > h + 10) p.y = -10;
        }

        // Build spatial grid
        const grid = buildGrid();
        const drawnLines = new Set();

        // Draw connection lines using spatial grid (O(n) instead of O(n²))
        ctx.lineWidth = 0.5;
        for (let i = 0; i < particles.length; i++) {
          const a = particles[i];
          const cx = Math.floor(a.x / gridSize);
          const cy = Math.floor(a.y / gridSize);
          const neighbors = getNeighborCells(cx, cy);

          for (const cellKey of neighbors) {
            const cell = grid[cellKey];
            if (!cell) continue;
            for (const j of cell) {
              if (j <= i) continue;
              const lineKey = i < j ? i * 1000 + j : j * 1000 + i;
              if (drawnLines.has(lineKey)) continue;

              const b = particles[j];
              const dx = a.x - b.x;
              const dy = a.y - b.y;
              const d = dx * dx + dy * dy; // Skip Math.hypot for perf
              const maxD = connectionDist * connectionDist;

              if (d < maxD) {
                drawnLines.add(lineKey);
                const lineAlpha = 0.15 * (1 - d / maxD);
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(' + rgb + ',' + lineAlpha + ')';
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
              }
            }
          }
        }

        // Draw particles — NO shadowBlur (was the #1 GPU killer)
        for (const p of particles) {
          ctx.beginPath();
          ctx.fillStyle = 'rgba(' + rgb + ',' + (p.alpha * 0.85) + ')';
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }

        // Single soft glow in bottom-right corner (cheap alternative to per-particle shadows)
        const cornerSize = Math.min(w, 550);
        const g2 = ctx.createRadialGradient(w, h, cornerSize * 0.15, w, h, cornerSize);
        g2.addColorStop(0, 'rgba(0,0,0,0.25)');
        g2.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g2;
        ctx.fillRect(w - cornerSize, h - cornerSize, cornerSize, cornerSize);

        requestAnimationFrame(draw);
      } catch (e) {
        console.error('Particle draw error', e);
      }
    }

    draw();
  } catch (err) {
    console.error('Particles init failed', err);
  }
})();
