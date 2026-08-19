// Skulls321 portfolio JS
// most effects are gated by the EFFECTS flags below so i can toggle them off without hunting for code

const EFFECTS = {
  cursorLight: true,
  interactiveLetters: true, // css-driven, js adds proximity
  terminalCursor: true,
  scramble: false, // disabled, was too much
  reactiveStars: true,
  subtitleHighlights: true, // css only
  ctaDropdown: true,
  status: true, // css only
};

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// shared mouse — several effects read from this
const mouse = { x: -9999, y: -9999, has: false };
window.addEventListener('mousemove', e => {
  mouse.x = e.clientX; mouse.y = e.clientY; mouse.has = true;
}, { passive: true });
window.addEventListener('mouseleave', () => { mouse.has = false; });

// brand blue, hardcoded — accent is #2563EB everywhere in css, no point parsing it live
const ACCENT_RGB = '37, 99, 235';

// particle network — adapted from zDR34M's thing
// TODO: the O(n^2) line pass gets heavy on wide screens, should spatial-grid it
(function () {
  const canvas = document.getElementById('ambient');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (reduced) return;

  let w, h, dpr;
  let pts = [];
  const maxDist = 130;
  const mouseR = 160;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth = window.innerWidth;
    h = canvas.clientHeight = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn() {
    const count = Math.min(110, Math.max(40, Math.floor((w * h) / 14000)));
    pts = [];
    for (let i = 0; i < count; i++) {
      pts.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 1.8 + 0.8,
      });
    }
  }

  function step() {
    ctx.clearRect(0, 0, w, h);

    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx = -p.vx;
      if (p.y < 0 || p.y > h) p.vy = -p.vy;

      if (mouse.has) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < mouseR) { p.x -= dx * 0.015; p.y -= dy * 0.015; }
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${ACCENT_RGB}, 0.6)`;
      ctx.fill();
    }

    // connect close ones
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const d = Math.hypot(dx, dy);
        if (d < maxDist) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${ACCENT_RGB}, ${(1 - d / maxDist) * 0.25})`;
          ctx.lineWidth = 0.6;
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(step);
  }

  resize(); spawn(); step();

  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { resize(); spawn(); }, 200);
  });
})();

// cursor light + letter proximity
// reads mouse, sets --prox on each letter so css can brighten the near one
if (EFFECTS.cursorLight && !reduced) {
  const wm = document.getElementById('wordmark');
  if (wm) {
    const letters = Array.from(wm.querySelectorAll('.wm-letter'));
    if (letters.length) {
      const RADIUS = 160;
      let raf = null;

      const tick = () => {
        if (!mouse.has) {
          letters.forEach(l => l.style.setProperty('--prox', 0));
          raf = null;
          return;
        }
        for (const l of letters) {
          const r = l.getBoundingClientRect();
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          const dist = Math.hypot(mouse.x - cx, mouse.y - cy);
          l.style.setProperty('--prox', Math.max(0, 1 - dist / RADIUS).toFixed(3));
        }
        raf = requestAnimationFrame(tick);
      };

      window.addEventListener('mousemove', () => {
        if (!raf) raf = requestAnimationFrame(tick);
      }, { passive: true });
    }
  }
}

// scramble effect — off by default, keeping the code in case
(function () {
  if (!EFFECTS.scramble || reduced) return;
  const wm = document.getElementById('wordmark');
  if (!wm) return;
  const letters = Array.from(wm.querySelectorAll('.wm-letter'));
  if (!letters.length) return;

  const GLYPHS = "!@#$%&*?<>{}[]+-=_~^/\\|";
  const originals = letters.map(l => l.textContent);
  let scrambling = false, cooldown = false;

  function scramble() {
    scrambling = true;
    const count = 2 + Math.floor(Math.random() * 2);
    const indices = new Set();
    while (indices.size < count) indices.add(Math.floor(Math.random() * letters.length));
    const idx = [...indices];
    let ticks = 0;
    const iv = setInterval(() => {
      ticks++;
      for (const i of idx) {
        letters[i].textContent = ticks < 5 ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : originals[i];
      }
      if (ticks >= 5) {
        clearInterval(iv);
        scrambling = false;
        cooldown = true;
        setTimeout(() => { cooldown = false; }, 1400);
      }
    }, 70);
  }

  wm.addEventListener('mouseenter', () => {
    if (cooldown || scrambling) return;
    scramble();
  });
})();

// CTA cursor highlight — feeds --mx/--my into the css radial
const ctaBtn = document.getElementById('ctaBtn');
if (ctaBtn && !reduced) {
  ctaBtn.addEventListener('mousemove', e => {
    const r = ctaBtn.getBoundingClientRect();
    ctaBtn.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    ctaBtn.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
}

const scrollBar = document.getElementById('scrollProgress');
if (scrollBar && !reduced) {
  const updateBar = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    scrollBar.style.transform = 'scaleX(' + (max > 0 ? h.scrollTop / max : 0) + ')';
  };
  window.addEventListener('scroll', updateBar, { passive: true });
  updateBar();
}

// scrollspy — highlights the nav link for whichever section is centered
const navLinks = document.querySelectorAll('.nav-links a');
if (navLinks.length) {
  const navMap = {};
  navLinks.forEach(a => {
    const id = a.getAttribute('href').slice(1);
    const sec = document.getElementById(id);
    if (sec) navMap[id] = { link: a, section: sec };
  });
  const navIds = Object.keys(navMap);

  if (navIds.length) {
    const syncNav = () => {
      const center = window.innerHeight / 2;
      let active = null;
      for (const id of navIds) {
        const r = navMap[id].section.getBoundingClientRect();
        if (r.top <= center && r.bottom >= center) { active = id; break; }
      }
      if (!active) {
        // nothing centered — pick the closest one above the viewport mid
        let best = Infinity;
        for (const id of navIds) {
          const r = navMap[id].section.getBoundingClientRect();
          const d = center - r.top;
          if (d > 0 && d < best) { best = d; active = id; }
        }
      }
      // hack: snap to last at the very bottom so contact isn't stuck unlit
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        active = navIds[navIds.length - 1];
      }
      for (const id of navIds) {
        navMap[id].link.classList.toggle('active', id === active);
      }
    };
    window.addEventListener('scroll', syncNav, { passive: true });
    window.addEventListener('resize', syncNav, { passive: true });
    syncNav();
  }
}

// reveal on scroll — pop in, fade out when leaving
(function () {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;

  if (reduced || !('IntersectionObserver' in window)) {
    els.forEach(e => e.classList.add('revealed'));
    return;
  }

  const obs = new IntersectionObserver(entries => {
    for (const en of entries) {
      if (en.isIntersecting) {
        en.target.classList.add('revealed');
        en.target.classList.remove('faded-out');
      } else if (en.target.classList.contains('revealed')) {
        en.target.classList.add('faded-out');
      }
    }
  }, { threshold: 0, rootMargin: '0px 0px -15% 0px' });

  els.forEach(e => obs.observe(e));
})();

// hero parallax
(function () {
  const hero = document.querySelector('.hero');
  const wordmark = hero && hero.querySelector('.wordmark');
  const projects = document.getElementById('projects');
  if (!hero || !wordmark) return;

  const layers = {
    mark: hero.querySelector('.hero-mark'),
    wordmark,
    subtitle: hero.querySelector('.subtitle'),
    tagline: hero.querySelector('.tagline'),
    cta: hero.querySelector('.cta-wrap'),
    status: hero.querySelector('.status'),
  };

  // stagger index for model cards
  const cards = projects ? projects.querySelectorAll('.model-card') : [];
  cards.forEach((c, i) => c.style.setProperty('--i', i));

  let raf = null;

  function update() {
    raf = null;
    const r = hero.getBoundingClientRect();
    const h = r.height || 1;
    const p = Math.min(1, Math.max(0, -r.top / h));

    const scale = 1 - p * 0.55;
    wordmark.style.transform = `translateY(${(-p * 100).toFixed(1)}px) scale(${scale.toFixed(3)})`;
    wordmark.style.opacity = (1 - p * 0.6).toFixed(3);

    if (layers.mark) { layers.mark.style.opacity = (1 - p * 0.7).toFixed(3); layers.mark.style.transform = `translateY(${(-p * 20).toFixed(1)}px)`; }
    if (layers.subtitle) { layers.subtitle.style.opacity = (1 - p * 1.0).toFixed(3); layers.subtitle.style.transform = `translateY(${(-p * 50).toFixed(1)}px)`; }
    if (layers.tagline) { layers.tagline.style.opacity = (1 - p * 1.2).toFixed(3); layers.tagline.style.transform = `translateY(${(-p * 65).toFixed(1)}px)`; }
    if (layers.cta) { layers.cta.style.opacity = (1 - p * 1.5).toFixed(3); layers.cta.style.transform = `translateY(${(-p * 80).toFixed(1)}px)`; }
    if (layers.status) { layers.status.style.opacity = (1 - p * 1.6).toFixed(3); layers.status.style.transform = `translateY(${(-p * 90).toFixed(1)}px)`; }
  }

  if (!reduced) {
    window.addEventListener('scroll', () => {
      if (!raf) raf = requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  // CTA smooth scroll
  if (ctaBtn) {
    ctaBtn.addEventListener('click', e => {
      e.preventDefault();
      const target = projects || document.getElementById('about');
      if (!target) return;
      if (reduced) { target.scrollIntoView(); return; }

      const start = window.scrollY;
      const dist = target.getBoundingClientRect().top + window.scrollY - start;
      const duration = Math.min(1000, Math.max(600, Math.abs(dist) / 2.5));
      const t_start = performance.now();
      const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const html = document.documentElement;
      const prev = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';

      function frame(now) {
        const t = Math.min(1, (now - t_start) / duration);
        window.scrollTo(0, start + dist * ease(t));
        if (!raf) raf = requestAnimationFrame(update);
        if (t < 1) requestAnimationFrame(frame);
        else html.style.scrollBehavior = prev;
      }
      requestAnimationFrame(frame);
    });
  }
})();

// model card click → modal
const modelModal = document.getElementById('modelModal');
if (modelModal) {
  const mImg = document.getElementById('modelModalImg');
  const mName = document.getElementById('modelModalName');
  const closeBtn = modelModal.querySelector('.model-modal-close');
  const bg = modelModal.querySelector('.model-modal-bg');

  function openModal(card) {
    const img = card.querySelector('img');
    if (img) mImg.src = img.src;
    mName.textContent = card.dataset.name || (img && img.alt) || '';
    modelModal.classList.add('open');
    modelModal.setAttribute('aria-hidden', 'false');
  }
  function closeModal() {
    modelModal.classList.remove('open');
    modelModal.setAttribute('aria-hidden', 'true');
    mImg.src = '';
  }

  document.querySelectorAll('.model-card').forEach(card => {
    card.addEventListener('click', () => openModal(card));
  });
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (bg) bg.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modelModal.classList.contains('open')) closeModal();
  });
}

// filter pills
const pills = document.querySelectorAll('.model-filters .filter-pill');
const cards = document.querySelectorAll('.model-card');
if (pills.length && cards.length) {
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const f = pill.dataset.filter;
      pills.forEach(p => p.classList.toggle('active', p === pill));
      cards.forEach(card => {
        card.style.display = (f === 'all' || card.dataset.category === f) ? '' : 'none';
      });
    });
  });
}

// showcase video modal — youtube embeds, lazy-loaded thumbnails
(function () {
  const cards = document.querySelectorAll('.showcase-card');
  if (!cards.length) return;

  const modal = document.getElementById('videoModal');
  const frame = document.getElementById('videoModalFrame');
  const vname = document.getElementById('videoModalName');
  const vbg = modal && modal.querySelector('.model-modal-bg');
  const vclose = modal && modal.querySelector('.model-modal-close');

  cards.forEach(card => {
    const ytid = card.dataset.ytid;
    const media = card.querySelector('.showcase-media');
    if (!media) return;

    if (!ytid) {
      media.style.background = '#03060C';
      media.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#485468;font-size:0.8rem;font-family:monospace">no video</div>';
      return;
    }

    const thumb = `https://img.youtube.com/vi/${ytid}/hqdefault.jpg`;
    media.innerHTML = `<img src="${thumb}" style="width:100%;height:100%;object-fit:cover" alt="${card.dataset.name || ''}" /><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="rgba(0,0,0,0.5)"/><path d="M19 16l14 8-14 8z" fill="rgba(255,255,255,0.9)"/></svg></div>`;
    media.style.cursor = 'pointer';

    media.addEventListener('click', () => {
      if (!modal) return;
      frame.src = `https://www.youtube.com/embed/${ytid}?autoplay=1&rel=0`;
      vname.textContent = card.dataset.name || '';
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeVid() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    frame.src = '';
    document.body.style.overflow = '';
  }

  if (vclose) vclose.addEventListener('click', closeVid);
  if (vbg) vbg.addEventListener('click', closeVid);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) closeVid();
  });
})();

// music player — autoplay is a nightmare across browsers, hence the retry dance
const musicAudio = document.getElementById('musicAudio');
const musicBtn = document.getElementById('musicBtn');
const musicTitle = document.getElementById('musicTitle');
if (musicAudio && musicBtn) {
  musicAudio.volume = 0.3;

  // chrome/safari block autoplay until the user interacts, so retry on first gesture
  musicAudio.play().catch(() => {
    const retry = () => musicAudio.play().catch(() => {});
    document.addEventListener('click', retry, { once: true });
    document.addEventListener('keydown', retry, { once: true });
    document.addEventListener('touchstart', retry, { once: true });
  });

  musicBtn.addEventListener('click', () => {
    if (musicAudio.paused) musicAudio.play().catch(() => {});
    else musicAudio.pause();
  });

  musicAudio.addEventListener('play', () => {
    musicBtn.classList.add('playing');
    musicBtn.setAttribute('aria-label', 'Pause music');
    if (musicTitle) musicTitle.textContent = 'Biting Bullets';
  });
  musicAudio.addEventListener('pause', () => {
    musicBtn.classList.remove('playing');
    musicBtn.setAttribute('aria-label', 'Play music');
  });
  musicAudio.addEventListener('error', () => {
    if (musicTitle) musicTitle.textContent = 'No track';
  });
}

// mobile nav
const navToggle = document.querySelector('.nav-toggle');
const navLinksEl = document.querySelector('.nav-links');
if (navToggle && navLinksEl) {
  navToggle.addEventListener('click', () => {
    const open = navLinksEl.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open);
  });
  navLinksEl.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinksEl.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

document.getElementById('year').textContent = new Date().getFullYear();
