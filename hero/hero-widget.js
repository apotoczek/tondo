/* File: https://assets.example.com/hero/hero-widget.js */
(() => {
  const S = document.currentScript;
  // const cfgURL = S.dataset.config || 'https://assets.example.com/hero/config.json';
  const cfgURL = S.dataset.config || 'hero/config.json';
  const mountSel = S.dataset.target; // e.g. "#hero-slot"
  const place = mountSel ? document.querySelector(mountSel) : S.parentNode;

  // Create mount root right where the script sits if no selector given
  const mountEl = place || S.parentNode;
  // Use Shadow DOM to avoid CSS collisions
  const root = (mountEl.attachShadow ? mountEl.attachShadow({mode:'open'}) : mountEl);

  // Utility: create element
  const el = (tag, attrs={}) => Object.assign(document.createElement(tag), attrs);

  // Basic styles (you can also fetch CSS text from a file instead)
  const baseCss = `
  :host, .hero { display:block; position:relative; overflow:hidden; }
  .track { display:flex; transition:transform 600ms ease; will-change:transform; }
  .slide { min-width:100%; height:var(--hero-height, 60vh); position:relative; }
  .slide img { width:100%; height:100%; object-fit:cover; display:block; }
  .caption { position:absolute; inset:auto 0 0 0; padding:2rem; color:white; 
             background:linear-gradient(transparent, rgba(0,0,0,.55)); font:600 1rem/1.3 system-ui; }
  .nav { position:absolute; inset:0; display:flex; justify-content:space-between; align-items:center; pointer-events:none; }
  .btn { pointer-events:auto; background:rgba(0,0,0,.35); border:none; color:white; padding:.6rem .8rem; margin:.5rem; border-radius:.75rem; cursor:pointer; }
  .dots { position:absolute; inset:auto 0 1rem 0; display:flex; gap:.5rem; justify-content:center; }
  .dot { width:.6rem; height:.6rem; border-radius:50%; background:rgba(255,255,255,.5); border:none; cursor:pointer; }
  .dot[aria-current="true"]{ background:white; }
  `;

  // Fetch config (slides + options)
  fetch(cfgURL, {credentials:'omit'})
    .then(r => r.json())
    .then(cfg => {
      const style = el('style'); style.textContent = baseCss + (cfg.css || '');
      root.appendChild(style);

      const hero = el('section', {className:'hero', role:'region', ariaLabel: cfg.ariaLabel || 'Featured'});
      const track = el('div', {className:'track'}); hero.appendChild(track);

      // Build slides
      (cfg.slides || []).forEach((slide, i) => {
        const s = el('article', {className:'slide'});
        const img = el('img', {alt: slide.alt || '', src: slide.src, loading:'eager', decoding:'async'});
        s.appendChild(img);
        if (slide.title || slide.subtitle || slide.href) {
          const cap = el('div', {className:'caption'});
          if (slide.title) cap.appendChild(el('h2', {textContent: slide.title, style:'margin:0 0 .25rem'}));
          if (slide.subtitle) cap.appendChild(el('p', {textContent: slide.subtitle, style:'margin:0'}));
          if (slide.href) {
            const a = el('a', {href: slide.href, textContent: slide.cta || 'Learn more', style:'display:inline-block;margin-top:.75rem;color:white;text-decoration:underline'});
            cap.appendChild(a);
          }
          s.appendChild(cap);
        }
        track.appendChild(s);
      });

      // Controls
      const nav = el('div', {className:'nav'});
      const prev = el('button', {className:'btn', ariaLabel:'Previous', innerHTML:'&#9664;'});
      const next = el('button', {className:'btn', ariaLabel:'Next', innerHTML:'&#9654;'});
      nav.append(prev, next); hero.appendChild(nav);

      const dots = el('div', {className:'dots'});
      const dotEls = (cfg.slides || []).map((_, i) => {
        const d = el('button', {className:'dot', ariaLabel:`Go to slide ${i+1}`});
        dots.appendChild(d);
        return d;
      });
      hero.appendChild(dots);

      root.appendChild(hero);

      // Slider logic
      let idx = 0, N = (cfg.slides || []).length, timer = 0;
      const go = i => {
        idx = (i + N) % N;
        track.style.transform = `translateX(${-100*idx}%)`;
        dotEls.forEach((d,j)=> d.setAttribute('aria-current', String(j===idx)));
      };
      const nextFn = () => go(idx+1), prevFn = () => go(idx-1);
      next.addEventListener('click', nextFn); prev.addEventListener('click', prevFn);
      dotEls.forEach((d,i)=> d.addEventListener('click', ()=>go(i)));

      const start = () => {
        stop();
        if (cfg.autoplay) timer = setInterval(nextFn, Math.max(1500, cfg.interval || 5000));
      };
      const stop = () => { if (timer) { clearInterval(timer); timer=0; } };

      hero.addEventListener('mouseenter', stop);
      hero.addEventListener('mouseleave', start);
      go(0); start();

      // Responsive height
      if (cfg.height) hero.style.setProperty('--hero-height', cfg.height);
      // Preload next image lightly
      if (cfg.slides?.[1]?.src) { const p = new Image(); p.src = cfg.slides[1].src; }
    })
    .catch(err => {
      const msg = document.createElement('pre');
      msg.textContent = 'Hero failed to load.';
      root.appendChild(msg);
      console.error('[hero-widget]', err);
    });
})();
