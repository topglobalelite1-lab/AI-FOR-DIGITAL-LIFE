/* ═══════════════════════════════════════════
   content.js — Scroll animations, interactions, quiz
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Logging System & Admin Library ──
  function writeLog(action, details) {
    try {
      const logs = JSON.parse(localStorage.getItem('ycwc_logs') || '[]');
      const timestamp = new Date().toLocaleString();
      logs.unshift({ timestamp, action, details });
      if (logs.length > 50) logs.length = 50;
      localStorage.setItem('ycwc_logs', JSON.stringify(logs));
      
      if (typeof renderLibraryLogs === 'function') renderLibraryLogs();
    } catch(e) {
      console.error('Failed to write log', e);
    }
  }

  function renderLibraryLogs() {
    const tbody = document.getElementById('library-logs-body');
    if (!tbody) return;
    try {
      const logs = JSON.parse(localStorage.getItem('ycwc_logs') || '[]');
      if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="log-empty">No activity logs found.</td></tr>';
        return;
      }
      tbody.innerHTML = logs.map(log => `
        <tr>
          <td>${log.timestamp}</td>
          <td><strong style="color: #d7ffff;">${log.action}</strong></td>
          <td>${log.details}</td>
        </tr>
      `).join('');
    } catch(e) {}
  }
  
  function initLibrary() {
    const clearBtn = document.getElementById('clear-logs-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if(confirm('Are you sure you want to clear all classified logs?')) {
          localStorage.removeItem('ycwc_logs');
          renderLibraryLogs();
        }
      });
    }
  }

  function enableAdminFeatures() {
    document.querySelectorAll('.admin-only, .dom-only').forEach(el => {
      el.style.display = ''; 
    });
    renderLibraryLogs();
  }

  // ── Scroll-triggered fade-in animations ──
  function initScrollAnimations() {
    const targets = document.querySelectorAll(
      '.impact-card, .ai-type-card, .process-step, .pros-cons-item, .timeline-item, .ethics-card, .content-section > .section-badge, .content-section > .section-title, .content-section > .section-subtitle, .quiz-card'
    );

    targets.forEach(el => el.classList.add('fade-in'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    targets.forEach(el => observer.observe(el));
  }

  // ── Active nav link on scroll ──
  function initActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinks.forEach(link => {
              link.classList.toggle(
                'active',
                link.getAttribute('href') === '#' + id
              );
            });
          }
        });
      },
      { threshold: 0.2, rootMargin: '-80px 0px -50% 0px' }
    );

    sections.forEach(section => observer.observe(section));
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

  // ── Staggered animation for grids ──
  function initStaggeredAnimations() {
    const grids = document.querySelectorAll(
      '.impact-grid, .ai-types-grid, .ethics-grid, .pros-cons-grid'
    );

    grids.forEach(grid => {
      const children = grid.children;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              Array.from(children).forEach((child, index) => {
                child.style.transitionDelay = `${index * 80}ms`;
              });
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(grid);
    });
  }

  // ── Parallax-like subtle movement on hero ──
  function initHeroParallax() {
    const hero = document.querySelector('.hero-container');
    if (!hero) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const offset = Math.min(scrollY * 0.15, 60);
          hero.style.transform = `translateY(${offset}px)`;
          hero.style.opacity = Math.max(1 - scrollY / 800, 0.3);
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ── Sticky header scroll effect ──
  function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          header.classList.toggle('scrolled', window.scrollY > 40);
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ── Mouse-tracking glow on cards ──
  function initCardGlow() {
    const cards = document.querySelectorAll('.impact-card, .ai-type-card, .ethics-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mouse-x', x + '%');
        card.style.setProperty('--mouse-y', y + '%');
      });
    });
  }

  // ── Count-up animation for hero stats ──
  function initCountUp() {
    const statNumbers = document.querySelectorAll('.hero-stat-number[data-count]');
    if (!statNumbers.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseFloat(el.getAttribute('data-count'));
            const originalText = el.textContent;
            const prefix = originalText.match(/^[^\d]*/)?.[0] || '';
            const suffix = originalText.match(/[^\d.]*$/)?.[0] || '';
            const isDecimal = target % 1 !== 0;
            const duration = 2000;
            const startTime = performance.now();

            function update(now) {
              const elapsed = now - startTime;
              const progress = Math.min(elapsed / duration, 1);
              // Ease out cubic
              const eased = 1 - Math.pow(1 - progress, 3);
              const current = target * eased;

              if (isDecimal) {
                el.textContent = prefix + current.toFixed(1) + suffix;
              } else {
                el.textContent = prefix + Math.round(current) + suffix;
              }

              if (progress < 1) {
                requestAnimationFrame(update);
              }
            }

            requestAnimationFrame(update);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    statNumbers.forEach(el => observer.observe(el));
  }

  // ══════════════════════════════════════════
  //  LOGIN GATE
  // ══════════════════════════════════════════

  function initLoginGate() {
    const loginOverlay = document.getElementById('login-overlay');
    const loginForm = document.getElementById('login-form');
    
    if (!loginOverlay || !loginForm) return;

    // Check if already authenticated this session
    if (sessionStorage.getItem('ycwc_authenticated') === 'true') {
      loginOverlay.style.display = 'none';
      document.body.classList.remove('locked');
      if (sessionStorage.getItem('ycwc_admin') === 'true') {
        enableAdminFeatures();
      }
      return;
    }

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const user = loginForm.querySelector('#username').value.trim();
      const pass = loginForm.querySelector('#password').value;
      writeLog('Login Attempt', `Username used: ${user || 'Unknown'}`);
      
      const btn = loginForm.querySelector('.login-btn');
      const originalText = btn.textContent;

      let isAdmin = false;

      if (user === 'Dom') {
        if (pass !== 'DominoOwn') {
          btn.textContent = 'Access Denied';
          btn.style.backgroundColor = 'rgba(248, 113, 113, 0.2)';
          btn.style.color = '#f87171';
          btn.style.borderColor = '#f87171';
          writeLog('Login Failed', `Failed admin attempt for Dom`);
          
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style = '';
          }, 2000);
          return;
        }
        isAdmin = true;
      }
      
      // Add a slight delay for dramatic effect
      btn.textContent = 'Authenticating...';
      btn.style.opacity = '0.7';

      setTimeout(() => {
        sessionStorage.setItem('ycwc_authenticated', 'true');
        sessionStorage.setItem('ycwc_user', user || 'Guest');
        
        if (isAdmin) {
          sessionStorage.setItem('ycwc_admin', 'true');
          enableAdminFeatures();
          writeLog('Admin Access', 'Access granted for Dom.');
        } else {
          writeLog('Public Access', `User ${user || 'Guest'} entered the site.`);
        }
        
        loginOverlay.classList.add('hidden');
        document.body.classList.remove('locked');
        
        // Let the CSS transition finish before hiding completely
        setTimeout(() => {
          loginOverlay.style.display = 'none';
        }, 600);
      }, 800);
    });
  }

  // ══════════════════════════════════════════
  //  QUIZ SECTION
  // ══════════════════════════════════════════

  const quizQuestions = [
    {
      question: "What is the primary difference between AI and traditional software?",
      options: [
        "AI uses more electricity",
        "AI can learn and adapt from data without explicit programming",
        "AI only works on supercomputers",
        "AI was invented before traditional software"
      ],
      correct: 1,
      explanation: "Unlike traditional software that follows rigid rules, AI systems can learn from data and improve over time."
    },
    {
      question: "Which type of AI powers chatbots and voice assistants like Siri?",
      options: [
        "Computer Vision",
        "Generative AI",
        "Natural Language Processing (NLP)",
        "Reinforcement Learning"
      ],
      correct: 2,
      explanation: "NLP is the branch of AI that understands and generates human language — powering chatbots, translators, and voice assistants."
    },
    {
      question: "In what year was the term 'Artificial Intelligence' first coined?",
      options: [
        "1943",
        "1950",
        "1956",
        "1969"
      ],
      correct: 2,
      explanation: "The Dartmouth Conference in 1956 officially coined the term 'Artificial Intelligence.'"
    },
    {
      question: "What AI milestone happened in 1997?",
      options: [
        "Siri was launched",
        "ChatGPT reached 100 million users",
        "IBM's Deep Blue defeated chess champion Garry Kasparov",
        "AlphaGo defeated the world Go champion"
      ],
      correct: 2,
      explanation: "In 1997, IBM's Deep Blue defeated world chess champion Garry Kasparov, proving AI could outperform humans in complex strategic tasks."
    },
    {
      question: "Which is NOT listed as a real-world impact area of AI on this website?",
      options: [
        "Education",
        "Space Exploration",
        "Smart Homes",
        "Healthcare"
      ],
      correct: 1,
      explanation: "The six impact areas covered are: Education, Healthcare, Work & Productivity, Smart Homes, Transportation, and Entertainment."
    },
    {
      question: "What is the first step in how AI works?",
      options: [
        "Making predictions",
        "Training the model",
        "Data collection",
        "Pattern recognition"
      ],
      correct: 2,
      explanation: "Everything starts with data collection. AI systems need vast amounts of information to learn from."
    },
    {
      question: "What environmental concern is associated with training large AI models?",
      options: [
        "Water pollution",
        "Noise pollution",
        "High carbon emissions from enormous computational power",
        "Deforestation for server farms"
      ],
      correct: 2,
      explanation: "Training large AI models requires enormous computational power. A single large model training run can emit as much carbon as five cars over their lifetimes."
    },
    {
      question: "What does 'algorithmic bias' mean in the context of AI?",
      options: [
        "AI algorithms are always slower than humans",
        "AI learns from historical data containing biases, leading to discriminatory outcomes",
        "AI systems prefer certain programming languages",
        "AI can only work with numerical data"
      ],
      correct: 1,
      explanation: "AI learns from historical data which can contain biases, potentially leading to discriminatory outcomes in hiring, lending, and more."
    },
    {
      question: "How many users did ChatGPT reach in its first two months?",
      options: [
        "10 million",
        "50 million",
        "100 million",
        "500 million"
      ],
      correct: 2,
      explanation: "ChatGPT reached 100 million users in just two months, making it the fastest-growing consumer application in history."
    },
    {
      question: "Which ethical principle states that people should know when they're interacting with AI?",
      options: [
        "Sustainability",
        "Fairness",
        "Transparency",
        "Inclusivity"
      ],
      correct: 2,
      explanation: "Transparency means AI systems should be explainable, and people deserve to know when they're interacting with AI."
    }
  ];

  function initQuiz() {
    const quizCard = document.getElementById('quiz-card');
    if (!quizCard) return;

    let currentQuestion = 0;
    let score = 0;
    let answered = false;
    let selectedIndex = -1;

    function renderQuestion() {
      const q = quizQuestions[currentQuestion];
      const letters = ['A', 'B', 'C', 'D'];
      const progress = ((currentQuestion) / quizQuestions.length) * 100;

      quizCard.innerHTML = `
        <div class="quiz-progress">
          <div class="quiz-progress-bar">
            <div class="quiz-progress-fill" style="width: ${progress}%"></div>
          </div>
          <span class="quiz-progress-text">${currentQuestion + 1}/${quizQuestions.length}</span>
        </div>
        <div class="quiz-question-number">QUESTION ${currentQuestion + 1}</div>
        <div class="quiz-question">${q.question}</div>
        <div class="quiz-options">
          ${q.options.map((opt, i) => `
            <div class="quiz-option" data-index="${i}">
              <span class="quiz-option-letter">${letters[i]}</span>
              <span>${opt}</span>
            </div>
          `).join('')}
        </div>
        <div class="quiz-feedback" id="quiz-feedback"></div>
        <div class="quiz-actions">
          <button class="quiz-btn quiz-btn-next" id="quiz-next" disabled>
            ${currentQuestion < quizQuestions.length - 1 ? 'Next Question →' : 'See Results →'}
          </button>
        </div>
      `;

      answered = false;
      selectedIndex = -1;

      // Bind option clicks
      quizCard.querySelectorAll('.quiz-option').forEach(option => {
        option.addEventListener('click', () => {
          if (answered) return;
          handleAnswer(parseInt(option.dataset.index));
        });
      });

      // Bind next button
      document.getElementById('quiz-next').addEventListener('click', () => {
        if (!answered) return;
        currentQuestion++;
        if (currentQuestion < quizQuestions.length) {
          renderQuestion();
        } else {
          renderResult();
        }
      });
    }

    function handleAnswer(index) {
      answered = true;
      selectedIndex = index;
      const q = quizQuestions[currentQuestion];
      const isCorrect = index === q.correct;

      if (isCorrect) score++;

      const options = quizCard.querySelectorAll('.quiz-option');
      options.forEach((opt, i) => {
        if (i === q.correct) {
          opt.classList.add('correct');
        } else if (i === index && !isCorrect) {
          opt.classList.add('wrong');
        }
        if (i !== index && i !== q.correct) {
          opt.classList.add('disabled');
        }
      });

      const feedback = document.getElementById('quiz-feedback');
      feedback.className = 'quiz-feedback show ' + (isCorrect ? 'correct' : 'wrong');
      feedback.innerHTML = isCorrect
        ? `✅ Correct! ${q.explanation}`
        : `❌ Not quite. ${q.explanation}`;

      document.getElementById('quiz-next').disabled = false;
    }

    function renderResult() {
      const pct = (score / quizQuestions.length) * 100;
      let emoji, title, message;

      if (pct === 100) {
        emoji = '🏆';
        title = 'Perfect Score!';
        message = "You're an AI expert! You've mastered every concept covered on this page. Incredible work!";
      } else if (pct >= 80) {
        emoji = '🌟';
        title = 'Outstanding!';
        message = "You have an excellent grasp of AI concepts. Just a few more details to master!";
      } else if (pct >= 60) {
        emoji = '💡';
        title = 'Good Job!';
        message = "You have a solid understanding of AI. Review the sections you missed to sharpen your knowledge.";
      } else if (pct >= 40) {
        emoji = '📚';
        title = 'Keep Learning!';
        message = "You're on the right track! Scroll back through the website to explore the topics you missed.";
      } else {
        emoji = '🚀';
        title = 'Time to Explore!';
        message = "AI is a big topic! Take your time reading through each section above, then try again. You've got this!";
      }

      quizCard.innerHTML = `
        <div class="quiz-result">
          <span class="quiz-result-emoji">${emoji}</span>
          <div class="quiz-score-circle">
            <span class="quiz-score-number">${score}</span>
            <span class="quiz-score-total">of ${quizQuestions.length}</span>
          </div>
          <div class="quiz-result-title">${title}</div>
          <p class="quiz-result-message">${message}</p>
          <div class="quiz-actions" style="justify-content: center;">
            <button class="quiz-btn quiz-btn-restart" id="quiz-restart">↺ Try Again</button>
            <button class="quiz-btn quiz-btn-next" id="quiz-top" style="font-size:0.85rem;">↑ Back to Top</button>
          </div>
        </div>
      `;

      writeLog('Quiz Completed', `Score: ${score}/${quizQuestions.length} (${Math.round(pct)}%)`);

      // 🏆 PERFECT SCORE — show reward modal after a short delay
      if (pct === 100) {
        setTimeout(() => showRewardModal(), 900);
      }

      document.getElementById('quiz-restart').addEventListener('click', () => {
        currentQuestion = 0;
        score = 0;
        renderQuestion();
      });

      document.getElementById('quiz-top').addEventListener('click', () => {
        document.getElementById('hero').scrollIntoView({ behavior: 'smooth' });
      });
    }

    // ── Reward Modal (perfect score) — shows ONLY the password ──
    function showRewardModal() {
      const existing = document.getElementById('reward-modal-overlay');
      if (existing) existing.remove();

      // Mark as permanently unlocked & show toggle in header
      localStorage.setItem('ycwc_futuristic_unlocked', 'true');
      if (typeof window._futuristicMarkUnlocked === 'function') {
        window._futuristicMarkUnlocked();
      }

      const overlay = document.createElement('div');
      overlay.id = 'reward-modal-overlay';
      overlay.innerHTML = `
        <div class="reward-modal" id="reward-modal">
          <div class="reward-particles" aria-hidden="true">
            ${Array.from({length: 24}, (_, i) => `<span class="reward-particle" style="left:${Math.round(i/24*98)}%"></span>`).join('')}
          </div>
          <div class="reward-glow-ring" aria-hidden="true"></div>

          <div class="reward-header">
            <div class="reward-trophy">🏆</div>
            <div class="reward-badge-label">ACHIEVEMENT UNLOCKED</div>
            <h2 class="reward-title">AI Master</h2>
            <p class="reward-subtitle">10/10 — Perfect Score!<br>You've earned the Futuristic Design password.</p>
          </div>

          <div class="reward-divider"></div>

          <div class="reward-password-section">
            <div class="reward-password-label">
              <span>🔑</span><span>FUTURISTIC DESIGN PASSWORD</span>
            </div>
            <div class="reward-password-box">
              <span class="reward-password-text">AI26</span>
              <button class="reward-copy-btn" id="reward-copy-btn" title="Copy">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
            </div>
            <p class="reward-password-hint">
              A <strong>🌐 toggle switch</strong> has appeared next to <strong>DV</strong> in the header.<br>
              Use it anytime to switch the Futuristic look on or off!
            </p>
          </div>

          <div class="reward-footer">
            <button class="reward-close-btn" id="reward-close-btn">✕ &nbsp;Got it!</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('reward-visible')));

      document.getElementById('reward-copy-btn').addEventListener('click', () => {
        navigator.clipboard.writeText('AI26').then(() => {
          const b = document.getElementById('reward-copy-btn');
          if (!b) return;
          b.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
          setTimeout(() => {
            if (document.getElementById('reward-copy-btn'))
              b.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
          }, 2000);
        });
      });

      document.getElementById('reward-close-btn').addEventListener('click', () => closeRewardModal(overlay));
      overlay.addEventListener('click', (e) => { if (e.target === overlay) closeRewardModal(overlay); });
    }

    function closeRewardModal(overlay) {
      overlay.classList.remove('reward-visible');
      setTimeout(() => overlay.remove(), 400);
    }


    renderQuestion();
  }


  // ── Initialize everything ──
  document.addEventListener('DOMContentLoaded', () => {
    initLoginGate();
    initLibrary();
    initScrollAnimations();
    initActiveNav();
    initSmoothScroll();
    initStaggeredAnimations();
    initHeroParallax();
    initHeaderScroll();
    initCardGlow();
    initCountUp();
    initQuiz();
  });
})();
