/* =============================================
   NexaAI Studio — main.js
   ES6+ JavaScript & jQuery
   ============================================= */

// ── Page Loader ──────────────────────────────
$(document).ready(function () {
  // Remove loader after page loads
  setTimeout(() => {
    $('#page-loader').addClass('hidden');
    document.body.style.overflow = '';
  }, 1200);
});

window.addEventListener('load', () => {
  // Init all modules
  initNeuralCanvas();
  initScrollReveal();
  initStatsCounter();
  initSkillBars();
  initPortfolioFilter();
  initFAQ();
  initContactForm();
  initSearch();
  initBackToTop();
  initThemeToggle();
  initCursorGlow();
  initNavScroll();
  initAIRecommendations();
  initNewsletter();
  initSmoothScroll();
});

// ── Neural Canvas Animation ──────────────────
function initNeuralCanvas() {
  const canvas = document.getElementById('neural-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let nodes = [];
  const NODE_COUNT = 65;

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', () => { resize(); });

  // Create nodes
  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 2.5 + 1,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update & draw nodes
    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
      if (n.y < 0 || n.y > canvas.height) n.vy *= -1;

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(124,58,237,0.7)';
      ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 140) {
          const alpha = (1 - dist / 140) * 0.35;
          const grad = ctx.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
          grad.addColorStop(0, `rgba(124,58,237,${alpha})`);
          grad.addColorStop(1, `rgba(6,182,212,${alpha})`);
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// ── Scroll Reveal ────────────────────────────
function initScrollReveal() {
  const observer = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); }
    }),
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ── Stats Counter ────────────────────────────
function initStatsCounter() {
  const counters = document.querySelectorAll('.count-num');
  if (!counters.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseFloat(el.getAttribute('data-target'));
        const isDecimal = el.getAttribute('data-decimal') === 'true';
        const duration = 2000;
        const start = performance.now();

        function update(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = eased * target;
          el.textContent = isDecimal ? current.toFixed(1) : Math.floor(current).toLocaleString();
          if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

// ── Skill Bars ───────────────────────────────
function initSkillBars() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.skill-fill').forEach(fill => {
          fill.style.width = fill.getAttribute('data-width') + '%';
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const skillSection = document.querySelector('.skills-wrap');
  if (skillSection) observer.observe(skillSection);
}

// ── Portfolio Filter ─────────────────────────
function initPortfolioFilter() {
  $(document).on('click', '.filter-btn', function () {
    $('.filter-btn').removeClass('active');
    $(this).addClass('active');
    const filter = $(this).attr('data-filter');

    $('.portfolio-item').each(function () {
      const cat = $(this).attr('data-category');
      if (filter === 'all' || cat === filter) {
        $(this).closest('.port-col').fadeIn(300);
      } else {
        $(this).closest('.port-col').fadeOut(200);
      }
    });
  });
}

// ── FAQ Accordion ────────────────────────────
function initFAQ() {
  $(document).on('click', '.faq-question', function () {
    const item = $(this).closest('.faq-item');
    const isOpen = item.hasClass('open');
    // Close all
    $('.faq-item').removeClass('open');
    // Toggle clicked
    if (!isOpen) item.addClass('open');
  });
}

// ── Contact Form Validation ──────────────────
function initContactForm() {
  $('#contactForm').on('submit', function (e) {
    e.preventDefault();
    let valid = true;

    // Clear errors
    $('.form-error').removeClass('show');
    $('.form-control-custom').removeClass('error');

    const name  = $('#contactName').val().trim();
    const email = $('#contactEmail').val().trim();
    const msg   = $('#contactMessage').val().trim();
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name) {
      showError('#nameError', '#contactName'); valid = false;
    }
    if (!email || !emailReg.test(email)) {
      showError('#emailError', '#contactEmail'); valid = false;
    }
    if (msg.length < 10) {
      showError('#msgError', '#contactMessage'); valid = false;
    }

    if (valid) {
      const btn = $('#contactSubmit');
      btn.html('<i class="fas fa-spinner fa-spin me-2"></i>Sending...').prop('disabled', true);
      setTimeout(() => {
        btn.html('<i class="fas fa-check me-2"></i>Message Sent!').prop('disabled', false);
        $('#formSuccess').addClass('show');
        $('#contactForm')[0].reset();
        setTimeout(() => {
          btn.html('Send Message <i class="fas fa-paper-plane ms-2"></i>');
          $('#formSuccess').removeClass('show');
        }, 4000);
      }, 1800);
    }
  });
}

function showError(errorId, fieldId) {
  $(errorId).addClass('show');
  $(fieldId).addClass('error');
}

// ── Search with Suggestions ──────────────────
const SEARCH_DATA = [
  { label: 'AI-Powered Design Systems', type: 'service' },
  { label: 'Machine Learning Integration', type: 'service' },
  { label: 'Smart Data Analytics', type: 'service' },
  { label: 'Neural Network Visualization', type: 'portfolio' },
  { label: 'E-Commerce AI Platform', type: 'portfolio' },
  { label: 'Getting Started with NexaAI', type: 'blog' },
  { label: 'Future of Generative AI', type: 'blog' },
  { label: 'API Documentation', type: 'resource' },
  { label: 'Pricing & Plans', type: 'resource' },
  { label: 'Chatbot Development', type: 'service' },
];

function initSearch() {
  const icons = { service: '⚡', portfolio: '🎨', blog: '📝', resource: '📄' };

  $('#heroSearch').on('input', function () {
    const q = $(this).val().trim().toLowerCase();
    const box = $('#searchSuggestions');
    if (!q) { box.removeClass('active').empty(); return; }

    const matches = SEARCH_DATA.filter(d => d.label.toLowerCase().includes(q)).slice(0, 5);
    if (!matches.length) { box.removeClass('active').empty(); return; }

    const html = matches.map(m =>
      `<div class="suggestion-item" data-label="${m.label}">
         <span>${icons[m.type] || '🔍'}</span> ${m.label}
         <span class="ms-auto badge" style="background:rgba(124,58,237,0.15);color:var(--violet);font-size:0.68rem;">${m.type}</span>
       </div>`
    ).join('');
    box.html(html).addClass('active');
  });

  $(document).on('click', '.suggestion-item', function () {
    $('#heroSearch').val($(this).attr('data-label'));
    $('#searchSuggestions').removeClass('active').empty();
  });

  $(document).on('click', function (e) {
    if (!$(e.target).closest('.search-wrap').length) {
      $('#searchSuggestions').removeClass('active');
    }
  });
}

// ── Back to Top ──────────────────────────────
function initBackToTop() {
  $(window).on('scroll', function () {
    if ($(this).scrollTop() > 400) {
      $('#backToTop').addClass('visible');
    } else {
      $('#backToTop').removeClass('visible');
    }
  });

  $('#backToTop').on('click', function () {
    $('html,body').animate({ scrollTop: 0 }, 600, 'swing');
  });
}

// ── Theme Toggle ─────────────────────────────
function initThemeToggle() {
  const savedTheme = localStorage.getItem('nexaai-theme') || 'dark';
  if (savedTheme === 'light') applyLight();

  $('#themeToggle').on('click', function () {
    if ($('body').hasClass('light-mode')) {
      $('body').removeClass('light-mode');
      $(this).html('<i class="fas fa-moon"></i> Dark');
      localStorage.setItem('nexaai-theme', 'dark');
    } else {
      applyLight();
    }
  });

  function applyLight() {
    $('body').addClass('light-mode');
    $('#themeToggle').html('<i class="fas fa-sun"></i> Light');
    localStorage.setItem('nexaai-theme', 'light');
  }
}

// ── Cursor Glow ──────────────────────────────
function initCursorGlow() {
  const glow = document.querySelector('.cursor-glow');
  if (!glow || window.innerWidth < 768) return;
  document.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top  = e.clientY + 'px';
  });
}

// ── Navbar Scroll ────────────────────────────
function initNavScroll() {
  $(window).on('scroll', function () {
    if ($(this).scrollTop() > 50) {
      $('#mainNav').addClass('scrolled');
    } else {
      $('#mainNav').removeClass('scrolled');
    }
  });
}

// ── Smooth Scroll ────────────────────────────
function initSmoothScroll() {
  $(document).on('click', 'a[href^="#"]', function (e) {
    const target = $($(this).attr('href'));
    if (!target.length) return;
    e.preventDefault();
    const navH = $('#mainNav').outerHeight();
    $('html,body').animate({ scrollTop: target.offset().top - navH }, 700, 'swing');
    // Close mobile nav
    $('.navbar-collapse').collapse('hide');
  });
}

// ── AI Recommendations ────────────────────────
function initAIRecommendations() {
  const recs = [
    { tag: 'AI Match · 98%', title: 'Neural Design System', sub: 'Tailored for creative agencies', score: '★ 4.9 · 1.2k users' },
    { tag: 'Trending · Hot', title: 'Smart Analytics Pro', sub: 'Real-time ML-powered insights', score: '★ 4.8 · 3.4k users' },
    { tag: 'New Release', title: 'AutoContent Engine', sub: 'GPT-4 content at scale', score: '★ 4.7 · 890 users' },
    { tag: 'AI Match · 94%', title: 'Conversational UI Kit', sub: 'Build chatbots 10x faster', score: '★ 4.9 · 2.1k users' },
  ];

  const wrap = $('#recGrid');
  if (!wrap.length) return;

  recs.forEach((r, i) => {
    const colors = ['var(--violet)','var(--cyan)','#F59E0B','#10B981'];
    wrap.append(`
      <div class="col-md-6 col-lg-3 reveal reveal-delay-${(i%3)+1}">
        <div class="glass-card rec-card">
          <div class="rec-tag">${r.tag}</div>
          <div class="rec-card-title">${r.title}</div>
          <div class="rec-card-sub">${r.sub}</div>
          <div class="rec-score" style="color:${colors[i]}"><i class="fas fa-robot me-1"></i>${r.score}</div>
        </div>
      </div>
    `);
  });

  // Re-observe new elements
  initScrollReveal();
}

// ── Newsletter Subscription ───────────────────
function initNewsletter() {
  $('#newsletterForm').on('submit', function (e) {
    e.preventDefault();
    const email = $('#nlEmail').val().trim();
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const btn = $('#nlSubmit');

    if (!email || !emailReg.test(email)) {
      $('#nlEmail').css('border-color', '#EF4444');
      return;
    }
    $('#nlEmail').css('border-color', '');
    btn.html('<i class="fas fa-spinner fa-spin"></i>').prop('disabled', true);
    setTimeout(() => {
      btn.html('<i class="fas fa-check"></i> Subscribed!').prop('disabled', false);
      $('#nlEmail').val('');
      setTimeout(() => btn.html('Subscribe'), 3000);
    }, 1400);
  });
}

// ── Page Transition Effect ────────────────────
document.querySelectorAll('a:not([href^="#"])').forEach(link => {
  link.addEventListener('click', function (e) {
    if (this.hostname !== window.location.hostname) return;
    // No multi-page transition needed for SPA
  });
});

// ── Hero typing effect ────────────────────────
(function typeEffect() {
  const el = document.getElementById('hero-type');
  if (!el) return;
  const words = ['AI Experiences', 'Smart Interfaces', 'Neural Products', 'Future Solutions'];
  let wi = 0, ci = 0, deleting = false;

  function tick() {
    const word = words[wi];
    if (!deleting) {
      el.textContent = word.slice(0, ++ci);
      if (ci === word.length) { deleting = true; setTimeout(tick, 1600); return; }
    } else {
      el.textContent = word.slice(0, --ci);
      if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; }
    }
    setTimeout(tick, deleting ? 55 : 95);
  }
  tick();
})();