/* Site behaviour: nav menu, staged reveals, card spotlight and tilt, magnetic buttons, hero parallax. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Nav menu (small screens)
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  if (nav && toggle) {
    const setOpen = (open) => {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Close' : 'Menu';
    };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    nav.querySelectorAll('.nav-links a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  }

  // Staged reveal
  const items = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach((el) => io.observe(el));
  }

  if (reduce || !fine) return;

  // Card spotlight and tilt
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty('--mx', x + 'px');
      card.style.setProperty('--my', y + 'px');
      if (card.classList.contains('static')) return;
      const rx = ((y / r.height) - 0.5) * -5, ry = ((x / r.width) - 0.5) * 5;
      card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-3px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });

  // Magnetic buttons
  document.querySelectorAll('.btn, .nav-resume').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      b.style.transform = `translate(${(dx * 8).toFixed(1)}px, ${(dy * 6).toFixed(1)}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });

  // Hero parallax
  const img = document.querySelector('.hero-photo img');
  if (img) {
    let ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        img.style.transform = `translateY(${Math.min(scrollY, 600) * 0.08}px)`;
        ticking = false;
      });
    }, { passive: true });
  }
})();
