document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initFaq();
  initSmoothScroll();
  initReveal();
  initCounters();
  initFeatureCursor();
  initTilt();
  initScrollProgress();
  initParticles();
  if (window.lucide) window.lucide.createIcons();
});

function initMobileMenu() {
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!burger || !mobileMenu) return;
  burger.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
  mobileMenu.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => mobileMenu.classList.add('hidden'))
  );
}

function initFaq() {
  document.querySelectorAll('.faq-item').forEach((item, idx) => {
    const head = item.querySelector('.faq-head');
    if (idx === 0) item.classList.add('open');
    head.addEventListener('click', () => item.classList.toggle('open'));
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length > 1) {
        const el = document.querySelector(id);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
}

function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => io.observe(el));
}

function initCounters() {
  const els = document.querySelectorAll('[data-counter]');
  if (!els.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.counter);
      const suffix = el.dataset.suffix || '';
      const duration = parseInt(el.dataset.duration || '1400', 10);
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = target * eased;
        el.textContent = (Number.isInteger(target) ? Math.round(val) : val.toFixed(1)) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  els.forEach(el => io.observe(el));
}

function initFeatureCursor() {
  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });
}

function initTilt() {
  if (window.matchMedia('(hover: none)').matches) return;
  document.querySelectorAll('.tilt').forEach(el => {
    const max = 6;
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'perspective(900px) rotateX(0) rotateY(0)';
    });
  });
}

function initScrollProgress() {
  const bar = document.querySelector('.scroll-progress');
  if (!bar) return;
  const update = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const p = max > 0 ? (h.scrollTop / max) * 100 : 0;
    bar.style.width = p + '%';
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
}

function initParticles() {
  if (!window.tsParticles) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  window.tsParticles.load({
    id: 'tsparticles',
    options: {
      fullScreen: { enable: false },
      background: { color: 'transparent' },
      fpsLimit: 60,
      particles: {
        number: { value: 55, density: { enable: true, area: 900 } },
        color: { value: ['#a78bfa', '#818cf8', '#c4b5fd'] },
        opacity: { value: { min: 0.15, max: 0.55 }, animation: { enable: true, speed: 0.6, sync: false } },
        size: { value: { min: 0.6, max: 2.2 } },
        move: { enable: true, speed: 0.35, outModes: { default: 'out' }, random: true },
        links: {
          enable: true,
          distance: 140,
          color: '#7c3aed',
          opacity: 0.22,
          width: 1
        }
      },
      interactivity: {
        events: {
          onHover: { enable: true, mode: 'grab' },
          resize: true
        },
        modes: {
          grab: { distance: 160, links: { opacity: 0.5 } }
        }
      },
      detectRetina: true
    }
  });
}
