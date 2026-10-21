/* Scroll progress seeks the video's own duration without capturing input. */
(() => {
  const section = document.querySelector('.hero-scroll');
  const hero = document.getElementById('hero');
  const film = document.getElementById('hero-film');
  const toggle = document.querySelector('.film-toggle');
  const identity = document.querySelector('.hero-identity');
  const visual = document.querySelector('.film-visual');
  if (!section || !hero || !film || !toggle || !identity) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 800px)');
  let requested = 0, queued = false, playing = false, ready = false;
  let progress = 0, titleX = 0, titleY = 0, playbackFrame = 0;

  function present(value) {
    if (compact.matches) value = 0;
    progress = value;
    hero.style.setProperty('--progress', String(value));
    // Resolve the club identity into the space left by the final fade to black.
    const t = motion.matches ? 0 : Math.min(1, Math.max(0, (value - .82) / .16));
    const eased = t * t * (3 - 2 * t);
    const fade = motion.matches ? 0 : Math.min(1, Math.max(0, (value - .72) / .1));
    hero.style.setProperty('--title-x', `${titleX * eased}px`);
    hero.style.setProperty('--title-y', `${titleY * eased}px`);
    hero.style.setProperty('--support-opacity', String(1 - fade * fade * (3 - 2 * fade)));
    hero.classList.toggle('is-copy-hidden', fade === 1);
    hero.classList.toggle('is-title-centered', t === 1);
  }
  function playback() {
    if (compact.matches) { stop(); return; }
    if (!playing) return;
    present(film.currentTime / (film.duration || 10));
    playbackFrame = requestAnimationFrame(playback);
  }

  function load() {
    if (compact.matches) return;
    if (!film.hasAttribute('src')) { film.src = film.dataset.src; film.load(); }
  }
  function label() {
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', playing ? 'Pause the animation' : 'Play the animation');
    toggle.firstChild.textContent = playing ? 'Pause film ' : 'Play film ';
  }
  function seek() {
    if (!ready || playing || motion.matches || compact.matches || film.seeking) return;
    if (Math.abs(film.currentTime - requested) > .035) film.currentTime = requested;
  }
  function update() {
    queued = false;
    if (compact.matches) { present(0); return; }
    if (motion.matches || playing) return;
    const rect = section.getBoundingClientRect();
    const distance = section.classList.contains('is-enhanced') && !compact.matches
      ? Math.max(1, section.offsetHeight - hero.offsetHeight)
      : Math.max(1, section.offsetHeight * .7);
    const next = Math.min(1, Math.max(0, ((compact.matches ? 0 : 16) - rect.top) / distance));
    requested = next * Math.max(0, (Number.isFinite(film.duration) ? film.duration : 10) - .04);
    present(next);
    seek();
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  function size() {
    section.classList.toggle('is-enhanced', !motion.matches && !compact.matches && hero.offsetHeight < innerHeight - 32);
    hero.style.setProperty('--title-x', '0px');
    hero.style.setProperty('--title-y', '0px');
    const bounds = hero.getBoundingClientRect();
    const title = identity.getBoundingClientRect();
    titleX = bounds.left + bounds.width / 2 - (title.left + title.width / 2);
    titleY = bounds.top + bounds.height / 2 - (title.top + title.height / 2);
    present(progress);
    schedule();
  }
  function stop() { if (playing) { film.pause(); playing = false; cancelAnimationFrame(playbackFrame); label(); } }
  function configure() {
    stop();
    if (visual) visual.setAttribute('aria-hidden', String(compact.matches));
    if (compact.matches) {
      // Mobile has no media area, poster request, or video source.
      ready = false;
      requested = 0;
      film.pause();
      film.removeAttribute('poster');
      if (film.hasAttribute('src')) { film.removeAttribute('src'); film.load(); }
      present(0);
    } else {
      if (film.dataset.poster) film.poster = film.dataset.poster;
      if (!motion.matches) load();
    }
    size();
  }
  film.addEventListener('loadeddata', () => { ready = true; toggle.disabled = false; size(); });
  film.addEventListener('seeked', seek);
  film.addEventListener('ended', () => { playing = false; cancelAnimationFrame(playbackFrame); present(1); label(); });
  film.addEventListener('error', () => {
    ready = false;
    playing = false;
    cancelAnimationFrame(playbackFrame);
    present(0);
    section.classList.remove('is-enhanced');
    toggle.disabled = true;
    toggle.firstChild.textContent = 'Film unavailable ';
    toggle.setAttribute('aria-label', 'Animation unavailable; the static artwork is shown');
  });
  toggle.addEventListener('click', async () => {
    if (compact.matches) return;
    if (playing) { stop(); return; }
    load();
    playing = true;
    label();
    // Manual playback is available on desktop; mobile omits the media area.
    film.currentTime = 0;
    present(0);
    try { await film.play(); if (compact.matches) { film.pause(); stop(); } else playback(); }
    catch { playing = false; label(); }
  });
  window.addEventListener('scroll', () => { stop(); schedule(); }, {passive: true});
  window.addEventListener('resize', size, {passive: true});
  motion.addEventListener('change', configure);
  compact.addEventListener('change', configure);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  new ResizeObserver(size).observe(hero);
  document.fonts.ready.then(size);
  configure();
})();
