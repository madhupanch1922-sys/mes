/* Bundle: header.js */

window.MES = window.MES || {};
window.MES.initHeader = function () {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  menu.querySelectorAll('.sub-toggle').forEach(b => b.addEventListener('click', () => b.parentElement.classList.toggle('open')));
  menu.addEventListener('click', e => { if (e.target.closest('a')) { menu.classList.remove('open'); toggle.setAttribute('aria-expanded', false); } });
  // active link
  const page = (location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index';
  const key = page === '' ? 'index' : page;
  const link = menu.querySelector('[data-nav="' + key + '"]');
  if (link) link.classList.add('active');
  // shadow on scroll + logo docks into navbar
  const nav = document.getElementById('navbar');
  const brand = document.querySelector('.brand');
  const onScroll = () => {
    nav.style.boxShadow = window.scrollY > 120 ? '0 8px 26px rgba(0,0,0,.28)' : '';
    const docked = window.scrollY > (brand ? brand.offsetHeight * 0.6 : 80);
    nav.classList.toggle('navbar--scrolled', docked);
    document.body.classList.toggle('logo-docked', docked);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
};

/* Bundle: hero.js */

window.MES = window.MES || {};
window.MES.initHero = function () {
  const hero = document.getElementById('hero'); if (!hero) return;
  const slides = [...hero.querySelectorAll('.hero__slide')];
  const dotsBox = hero.querySelector('.hero__dots');
  const bar = hero.querySelector('.hero__progress');
  const DUR = 6000; let i = 0, timer, paused = false;
  hero.style.setProperty('--dur', DUR + 'ms');
  slides.forEach((_, n) => { const b = document.createElement('button'); b.setAttribute('aria-label', 'Slide ' + (n + 1)); b.addEventListener('click', () => { go(n); restart(); }); dotsBox.appendChild(b); });
  const dots = [...dotsBox.children];
  function go(n) {
    slides[i].classList.remove('is-active'); dots[i].classList.remove('on');
    i = (n + slides.length) % slides.length;
    slides[i].classList.add('is-active'); dots[i].classList.add('on');
    bar.classList.remove('run'); void bar.offsetWidth; if (!paused) bar.classList.add('run');
  }
  function restart() { clearInterval(timer); timer = setInterval(() => { if (!paused) go(i + 1); }, DUR); }
  hero.querySelector('.hero__arrow--prev').addEventListener('click', () => { go(i - 1); restart(); });
  hero.querySelector('.hero__arrow--next').addEventListener('click', () => { go(i + 1); restart(); });
  hero.addEventListener('mouseenter', () => { paused = true; bar.classList.remove('run'); });
  hero.addEventListener('mouseleave', () => { paused = false; go(i); restart(); });
  let sx = 0;
  hero.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
  hero.addEventListener('touchend', e => { const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 50) { go(d < 0 ? i + 1 : i - 1); restart(); } });
  const start = () => { hero.classList.add('ready'); go(0); restart(); };
  if (document.body.classList.contains('intro-active')) window.addEventListener('intro:done', start, { once: true }); else start();
};


/* Bundle: intro.js */

/* Entry animation: letter reveal -> loading bar -> curtain opens. "Skip" ends it instantly. */
window.MES = window.MES || {};
window.MES.initIntro = function () {
  const body = document.body;
  const intro = document.getElementById('intro');
  const boot = document.querySelector('.boot');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!intro) {
    if (boot) boot.remove();
    body.classList.remove('intro-active');
    body.classList.add('ready');
    window.dispatchEvent(new Event('intro:done'));
    return;
  }

  const stage = document.getElementById('introStage');
  const logo = document.getElementById('introLogo');
  const sketch = document.getElementById('introSketch');
  const headerLogo = document.getElementById('headerLogo');
  const skipBtn = document.getElementById('skipIntro');
  let finished = false;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function finishIntro(instant) {
    if (finished) return;
    finished = true;

    if (instant) intro.style.transition = 'none';
    intro.classList.add('done');
    body.classList.remove('intro-active');
    body.classList.add('ready');
    setTimeout(() => {
      intro.remove();
      window.dispatchEvent(new Event('intro:done'));
    }, instant ? 50 : 1000);
  }

  function buildSketch() {
    try {
      const scale = Math.min(1, 600 / logo.naturalWidth);
      const w = Math.round(logo.naturalWidth * scale), h = Math.round(logo.naturalHeight * scale);
      const tmp = document.createElement('canvas');
      tmp.width = w; tmp.height = h;
      const tctx = tmp.getContext('2d', { willReadFrequently: true });
      tctx.drawImage(logo, 0, 0, w, h);
      const src = tctx.getImageData(0, 0, w, h);
      const gray = new Float32Array(w * h);
      for (let i = 0; i < w * h; i++) {
        const a = src.data[i * 4 + 3] / 255;
        gray[i] = (0.299 * src.data[i * 4] + 0.587 * src.data[i * 4 + 1] + 0.114 * src.data[i * 4 + 2]) * a + 255 * (1 - a);
      }
      sketch.width = w; sketch.height = h;
      const ctx = sketch.getContext('2d');
      const out = ctx.createImageData(w, h);
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const i = y * w + x;
          const gx = -gray[i - w - 1] - 2 * gray[i - 1] - gray[i + w - 1] + gray[i - w + 1] + 2 * gray[i + 1] + gray[i + w + 1];
          const gy = -gray[i - w - 1] - 2 * gray[i - w] - gray[i - w + 1] + gray[i + w - 1] + 2 * gray[i + w] + gray[i + w + 1];
          const mag = Math.min(255, Math.sqrt(gx * gx + gy * gy));
          out.data[i * 4] = out.data[i * 4 + 1] = out.data[i * 4 + 2] = 255;
          out.data[i * 4 + 3] = mag > 40 ? Math.min(255, mag * 1.6) : 0;
        }
      }
      ctx.putImageData(out, 0, 0);
      return true;
    } catch (e) {
      return false;
    }
  }

  function flyToHeader() {
    const from = stage.getBoundingClientRect();
    const to = headerLogo.getBoundingClientRect();
    const s = to.width / stage.offsetWidth;
    const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
    const dy = (to.top + to.height / 2) - (from.top + from.height / 2);
    stage.style.transform = `translate(${dx}px, ${dy}px) scale(${s})`;
  }

  async function runIntro() {
    if (reduceMotion) { finishIntro(true); return; }
    const ok = buildSketch();
    if (!ok) {
      sketch.classList.add('fallback');
      logo.classList.add('fallback-sketch');
    }
    await wait(180); if (finished) return;
    (ok ? sketch : logo).classList.add('drawing');
    await wait(1500); if (finished) return;
    if (!ok) logo.classList.remove('fallback-sketch', 'drawing');
    logo.classList.add('show');
    sketch.classList.add('hide');
    await wait(420); if (finished) return;
    stage.classList.add('fly');
    requestAnimationFrame(flyToHeader);
    await wait(900); if (finished) return;
    finishIntro();
  }

  let seen = false;
  try {
    const nav = performance.getEntriesByType('navigation')[0];
    const fromOwnSite = document.referrer && new URL(document.referrer).origin === location.origin;
    seen = !!(fromOwnSite && nav && nav.type === 'navigate');
  } catch (e) {}

  if (boot) boot.remove();
  if (seen) finishIntro(true);
  else {
    if (logo.complete && logo.naturalWidth) runIntro();
    else { logo.addEventListener('load', runIntro); logo.addEventListener('error', () => finishIntro(true)); }
    setTimeout(() => finishIntro(), 9000);
    skipBtn.addEventListener('click', () => finishIntro());
  }
};


/* Bundle: popup.js */

/* Admission popup: matches the admissions mock-up and auto-opens once per session. */
window.MES = window.MES || {};
window.MES.initPopup = function () {
  const modal = document.getElementById('admModal');
  if (!modal) return;

  const form = document.getElementById('admForm');
  const ok = document.getElementById('admOk');
  const err = document.getElementById('admErr');
  const KEY = 'mes_adm_seen';
  let lastFocus = null;

  const seen = () => {
    try { return sessionStorage.getItem(KEY) === '1'; } catch (e) { return false; }
  };

  const mark = () => {
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
  };

  function open() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const firstField = form && form.querySelector('input[name="parent_name"]');
      if (firstField && !form.hidden) firstField.focus();
    }, 220);
  }

  function close() {
    modal.hidden = true;
    document.body.style.overflow = '';
    mark();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  window.MES.openAdmission = open;
  window.MES.autoOpenAdmission = function (delay) {
    if (!seen()) {
      setTimeout(() => {
        if (modal.hidden) open();
      }, delay || 800);
    }
  };

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-admission]')) {
      e.preventDefault();
      if (form) form.hidden = false;
      if (ok) ok.hidden = true;
      err.textContent = '';
      open();
      return;
    }

    if (e.target.closest('[data-close-admission]')) {
      close();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!modal.hidden && e.key === 'Escape') close();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.textContent = '';

    const fields = form.querySelectorAll('.adm__field');
    fields.forEach((field) => field.classList.remove('adm__field--bad'));

    const d = new FormData(form);
    const required = ['parent_name', 'mobile', 'city', 'branch'];
    let bad = false;

    required.forEach((name) => {
      const input = form.elements[name];
      const value = String(d.get(name) || '').trim();
      if (!value) {
        if (input) input.closest('.adm__field')?.classList.add('adm__field--bad');
        bad = true;
      }
    });

    if (bad) {
      err.textContent = 'Please fill all required fields marked *';
      return;
    }

    const mobile = String(d.get('mobile') || '').replace(/\D/g, '');
    if (mobile.length < 8 || mobile.length > 15) {
      form.elements.mobile.closest('.adm__field')?.classList.add('adm__field--bad');
      err.textContent = 'Please enter a valid mobile number.';
      return;
    }

    const email = String(d.get('email') || '').trim();
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      form.elements.email.closest('.adm__field')?.classList.add('adm__field--bad');
      err.textContent = 'Please enter a valid email address.';
      return;
    }

    const submitBtn = form.querySelector('.adm__submit');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Requesting…';
    }

    try {
      form.hidden = true;
      if (ok) ok.hidden = false;
      form.reset();
      mark();
    } catch (x) {
      err.textContent = 'Could not send right now. Please call the school office or try again.';
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Request a Call Back';
      }
    }
  });
};


/* Bundle: gallery.js */

/* Simple lightbox for any <a class="g-item" href="big-image.jpg"> */
window.MES = window.MES || {};
window.MES.initGallery = function () {
  const items = [...document.querySelectorAll('.g-item')]; if (!items.length) return;
  const lb = document.createElement('div'); lb.className = 'lb'; lb.hidden = true;
  lb.innerHTML = '<button class="lb__x" aria-label="Close">×</button><button class="lb__n lb__n--p" aria-label="Previous">‹</button><img alt=""><button class="lb__n lb__n--n" aria-label="Next">›</button>';
  document.body.appendChild(lb);
  const img = lb.querySelector('img'); let i = 0;
  const show = n => { i = (n + items.length) % items.length; img.src = items[i].getAttribute('href'); img.alt = items[i].querySelector('img')?.alt || ''; };
  const open = n => { show(n); lb.hidden = false; document.body.style.overflow = 'hidden'; };
  const close = () => { lb.hidden = true; document.body.style.overflow = ''; };
  items.forEach((a, n) => a.addEventListener('click', e => { e.preventDefault(); open(n); }));
  lb.querySelector('.lb__x').onclick = close;
  lb.querySelector('.lb__n--p').onclick = () => show(i - 1);
  lb.querySelector('.lb__n--n').onclick = () => show(i + 1);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => { if (lb.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(i - 1); if (e.key === 'ArrowRight') show(i + 1); });
};


/* Bundle: reveal.js */

window.MES = window.MES || {};
window.MES.initReveal = function () {
  const els = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .14, rootMargin: '0px 0px -40px 0px' });
  els.forEach(e => io.observe(e));
};


/* Bundle: events.js */

/* Events wheel: hover / tap / keyboard a circle -> show its description in the centre.
   When nobody is interacting, it highlights the circles one by one automatically. */
window.MES = window.MES || {};
window.MES.initEvents = function () {
  const root = document.querySelector('.evt');
  if (!root) return;
  const nodes = [...root.querySelectorAll('.evt__node')];
  const center = root.querySelector('.evt__center');
  const h = center.querySelector('.evt__info h3');
  const p = center.querySelector('.evt__info p');
  const cap = root.querySelector('.evt__cap');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let idx = -1, timer = null, paused = false, visible = false;

  function show(node) {
    nodes.forEach(n => n.classList.toggle('is-active', n === node));
    if (!node) { center.classList.remove('showing'); cap.textContent = ''; return; }
    h.textContent = node.dataset.title;
    p.textContent = node.dataset.desc;
    cap.textContent = node.dataset.desc;
    center.classList.add('showing');
    idx = nodes.indexOf(node);
  }
  function tick() {
    if (paused || !visible) return;
    show(nodes[(idx + 1) % nodes.length]);
  }
  function start() { if (reduce || timer) return; timer = setInterval(tick, 3200); }
  function stop() { clearInterval(timer); timer = null; }

  nodes.forEach(n => {
    n.addEventListener('mouseenter', () => { paused = true; show(n); });
    n.addEventListener('focus', () => { paused = true; show(n); });
    n.addEventListener('click', () => { paused = true; show(n); });
    n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); paused = true; show(n); } });
  });
  root.addEventListener('mouseleave', () => { paused = false; });
  document.addEventListener('click', e => { if (!root.contains(e.target)) { paused = false; } });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => es.forEach(en => {
      visible = en.isIntersecting;
      if (visible) { setTimeout(() => { if (visible && !paused && idx < 0) show(nodes[0]); }, 2200); start(); }
      else { stop(); }
    }), { threshold: .4 }).observe(root);
  } else { visible = true; start(); }
};


/* Bundle: stats.js */

/* Home page statistics: count-up animation, starts when the strip scrolls into view. */
window.MES = window.MES || {};
window.MES.initStats = function () {
  const section = document.getElementById('mes-stats');
  if (!section) return;
  const values = [...section.querySelectorAll('.mes-stat__value')];
  const fmt = n => String(n);
  const render = (el, n) => { el.textContent = fmt(n) + (el.dataset.suffix || ''); };
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const showFinal = () => values.forEach(el => render(el, +el.dataset.count));
  if (reduce || !('IntersectionObserver' in window)) { showFinal(); return; }

  const easeOut = t => 1 - Math.pow(1 - t, 4);
  const run = (el, delay) => {
    const target = +el.dataset.count, dur = 2200;
    setTimeout(() => {
      const t0 = performance.now();
      (function tick(now) {
        const p = Math.min((now - t0) / dur, 1);
        render(el, Math.round(target * easeOut(p)));
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }, delay);
  };

  const io = new IntersectionObserver(entries => {
    if (!entries.some(e => e.isIntersecting)) return;
    values.forEach((el, i) => run(el, i * 180));
    io.disconnect();
  }, { threshold: .35 });
  io.observe(section);
};

/* Bundle: testimonials.js */

/* Parent testimonials: slow auto-moving slider */
window.MES = window.MES || {};
window.MES.initTestimonials = function () {
  var track = document.getElementById('ptTrack');
  if (!track || track.dataset.ready) return;
  track.dataset.ready = '1';

  var SPEED = 30;   // pixels per second  (bigger = faster, smaller = slower)
  var GAP = 24;

  // copy the cards once so the loop never shows an empty gap
  var count = track.children.length;
  for (var i = 0; i < count; i++) {
    var copy = track.children[i].cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    track.appendChild(copy);
  }
  var loopWidth = function () { return track.children[count].offsetLeft - track.children[0].offsetLeft; };
  var cardStep = function () { return track.children[0].offsetWidth + GAP; };

  track.style.scrollSnapType = 'none';
  track.style.scrollBehavior = 'auto';

  var pos = 0, paused = false, last = 0, resumeTimer;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function pause() { paused = true; clearTimeout(resumeTimer); }
  function resumeLater(ms) { clearTimeout(resumeTimer); resumeTimer = setTimeout(resume, ms || 0); }
  function resume() { pos = track.scrollLeft; paused = false; }

  function tick(now) {
    if (!last) last = now;
    var dt = Math.min(now - last, 100) / 1000;
    last = now;
    if (!paused && !reduce) {
      pos += SPEED * dt;
      var w = loopWidth();
      if (pos >= w) pos -= w;
      track.scrollLeft = pos;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // arrow buttons
  document.querySelector('.pt-next').addEventListener('click', function () {
    pause();
    if (track.scrollLeft >= loopWidth()) track.scrollLeft -= loopWidth();
    track.scrollBy({ left: cardStep(), behavior: 'smooth' });
    resumeLater(2500);
  });
  document.querySelector('.pt-prev').addEventListener('click', function () {
    pause();
    if (track.scrollLeft < cardStep()) track.scrollLeft += loopWidth();
    track.scrollBy({ left: -cardStep(), behavior: 'smooth' });
    resumeLater(2500);
  });

  // pause while the parent looks at / touches the cards
  track.addEventListener('mouseenter', pause);
  track.addEventListener('mouseleave', function () { resumeLater(0); });
  track.addEventListener('touchstart', pause, { passive: true });
  track.addEventListener('touchend', function () { resumeLater(2500); });
  track.addEventListener('focusin', pause);
  track.addEventListener('focusout', function () { resumeLater(0); });
};


/* Bundle: academics.js */

/* Academics page: stage tabs, animated counters, card spotlight. Safe no-op on other pages. */
(function () {
  function init() {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---- stage tabs ---- */
    const wrap = document.querySelector('.ac-explorer');
    if (wrap) {
      const tabs = [...wrap.querySelectorAll('.ac-tab')];
      const panels = [...wrap.querySelectorAll('.ac-panel')];
      const bar = wrap.querySelector('.ac-tabs__bar');
      const list = wrap.querySelector('.ac-tabs');

      const moveBar = (tab) => {
        if (!bar) return;
        if (list.scrollWidth > list.clientWidth + 2) {          // mobile: scrollable pill row
          bar.style.width = tab.offsetWidth + 'px';
          bar.style.transform = 'translateX(' + (tab.offsetLeft - 6) + 'px)';
        } else {                                                  // desktop: equal columns
          bar.style.width = '';
          bar.style.transform = 'translateX(' + (tabs.indexOf(tab) * 100) + '%)';
        }
      };
      const select = (tab, focus) => {
        tabs.forEach(t => { const on = t === tab; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
        panels.forEach(p => {
          const on = p.id === tab.getAttribute('aria-controls');
          p.hidden = !on;
          p.classList.remove('is-in');
          if (on) {
            [...p.querySelectorAll('.ac-class')].forEach((c, i) => c.style.setProperty('--i', i));
            void p.offsetWidth;                                   // restart animation
            p.classList.add('is-in');
          }
        });
        moveBar(tab);
        if (focus) tab.focus();
        if (list.scrollWidth > list.clientWidth + 2) tab.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
      };
      tabs.forEach((t, i) => {
        t.addEventListener('click', () => select(t));
        t.addEventListener('keydown', e => {
          const k = e.key; let n = null;
          if (k === 'ArrowRight') n = (i + 1) % tabs.length;
          else if (k === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
          else if (k === 'Home') n = 0;
          else if (k === 'End') n = tabs.length - 1;
          if (n !== null) { e.preventDefault(); select(tabs[n], true); }
        });
      });
      addEventListener('resize', () => moveBar(tabs.find(t => t.getAttribute('aria-selected') === 'true')), { passive: true });
      select(tabs[0]);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveBar(tabs.find(t => t.getAttribute('aria-selected') === 'true')));
    }

    /* ---- count-up numbers ---- */
    const nums = document.querySelectorAll('[data-count]');
    if (nums.length) {
      const run = el => {
        const to = +el.dataset.count;
        if (reduce) { el.textContent = to; return; }
        const t0 = performance.now(), dur = 1400;
        const step = now => {
          const p = Math.min((now - t0) / dur, 1);
          el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        };
        el.textContent = 0;
        requestAnimationFrame(step);
      };
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }), { threshold: .6 });
        nums.forEach(n => io.observe(n));
      }
    }

    /* ---- pointer spotlight on activity cards ---- */
    if (matchMedia('(hover: hover)').matches) {
      document.querySelectorAll('.ac-co').forEach(c => c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }));
    }
  }
  // main.js awaits include loading before starting; wait one frame after DOMContentLoaded-equivalent.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();


/* Contact form: contact-page only */

window.MES = window.MES || {};
window.MES.initContactForm = function () {
  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (form.id !== 'contactForm') return;
    event.preventDefault();
    var message = document.getElementById('contactMsg');
    message.textContent = 'Sending…';
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString()
    }).then(function (response) {
      if (!response.ok) throw new Error('Request failed');
      message.textContent = 'Thank you! We will get back to you shortly.';
      form.reset();
    }).catch(function () {
      message.textContent = 'Could not send right now. Please call the school office.';
    });
  });
};

/* Boot: load all included files, then start each module. */
(function () {
  const M = window.MES;
  const isHome = document.body.dataset.page === 'home';
  // failsafe: never leave the splash stuck
  if (isHome) setTimeout(() => {
    const intro = document.getElementById('intro');
    document.querySelector('.boot')?.remove();
    if (intro && !intro.classList.contains('done')) {
      intro.remove();
      document.body.classList.remove('intro-active');
      document.body.classList.add('ready');
      window.dispatchEvent(new Event('intro:done'));
    }
  }, 9000);
  if (document.body.dataset.page === 'contact') M.initContactForm && M.initContactForm();
  if (isHome) {
    window.addEventListener('intro:done', () => M.autoOpenAdmission(700), { once: true });
    M.initIntro && M.initIntro();
  }
  M.initHeader && M.initHeader();
  M.initHero && M.initHero();
  M.initPopup && M.initPopup();
  M.initGallery && M.initGallery();
  M.initReveal && M.initReveal();
  M.initStats && M.initStats();
  M.initEvents && M.initEvents();
  M.initTestimonials && M.initTestimonials();
    // Quick Links carousel: only targets #mes-quick-links
  const quickLinks = document.getElementById('mes-quick-links');

  if (quickLinks) {
    const cards = [...quickLinks.querySelectorAll('.mes-ql-card')];
    const prev = quickLinks.querySelector('.mes-ql-prev');
    const next = quickLinks.querySelector('.mes-ql-next');
    const dots = [...quickLinks.querySelectorAll('.mes-ql-dots button')];
    let activeIndex = 0;

    function renderQuickLinks() {
      const total = cards.length;

      cards.forEach((card, index) => {
        let offset = (index - activeIndex + total) % total;

        if (offset > total / 2) {
          offset -= total;
        }

        let position = 'far';

        if (offset === 0) position = 'center';
        else if (offset === -1) position = 'right';
        else if (offset === 1) position = 'left';

        card.dataset.position = position;
        
      });

      dots.forEach((dot, index) => {
        dot.setAttribute(
          'aria-current',
          index === activeIndex ? 'true' : 'false'
        );
      });
    }

    function moveQuickLinks(step) {
      activeIndex = (activeIndex + step + cards.length) % cards.length;
      renderQuickLinks();
    }

    prev.addEventListener('click', () => moveQuickLinks(1));
    next.addEventListener('click', () => moveQuickLinks(-1));

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        activeIndex = index;
        renderQuickLinks();
      });
    });

    renderQuickLinks();
  }
  const yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();
  const top = document.getElementById('toTop');
  if (top) { addEventListener('scroll', () => top.classList.toggle('show', scrollY > 500), { passive: true }); top.onclick = () => scrollTo({ top: 0, behavior: 'smooth' }); }
  if (!isHome) M.autoOpenAdmission(2500);
})();
/* ABOUT PHOTO: faster loading + shimmer + zoom-in animation */
(function () {
  function prep(img) {
    if (img.dataset.aboutReady) return;
    img.dataset.aboutReady = '1';
    var frame = img.closest('.about__frame');
    if (!frame) return;
    img.loading = 'eager';
    img.decoding = 'async';
    img.setAttribute('fetchpriority', 'high');
    var done = function () { frame.classList.add('is-loaded'); };
    if (img.complete && img.naturalWidth) done();
    else { img.addEventListener('load', done); img.addEventListener('error', done); }
  }
  function scan() { document.querySelectorAll('.about__frame img').forEach(prep); }
  scan();
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();