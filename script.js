(() => {
  const tabs = [...document.querySelectorAll('[role="tab"][data-project]')];
  const panels = [...document.querySelectorAll('[role="tabpanel"]')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) document.querySelectorAll('svg').forEach((svg) => svg.pauseAnimations?.());

  function selectProject(tab, moveFocus = false) {
    const panel = document.getElementById(tab.getAttribute('aria-controls'));
    if (!panel || tab.getAttribute('aria-selected') === 'true') {
      if (moveFocus) tab.focus();
      return;
    }

    tabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      item.classList.toggle('is-active', selected);
    });
    panels.forEach((item) => {
      const selected = item === panel;
      item.hidden = !selected;
      item.classList.toggle('is-active', selected);
    });

    if (moveFocus) tab.focus();
    if (!reducedMotion && window.gsap) {
      window.gsap.fromTo(panel.querySelector('.project-visual'),
        { clipPath: 'inset(0 0 0 8%)', opacity: .45 },
        { clipPath: 'inset(0 0 0 0)', opacity: 1, duration: .55, ease: 'power3.out' });
      window.gsap.fromTo(panel.querySelector('.project-copy'),
        { y: 12, opacity: .4 },
        { y: 0, opacity: 1, duration: .45, delay: .06, ease: 'power2.out' });
    }
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectProject(tab));
    tab.addEventListener('keydown', (event) => {
      const nextKeys = ['ArrowDown', 'ArrowRight'];
      const previousKeys = ['ArrowUp', 'ArrowLeft'];
      let targetIndex = index;
      if (nextKeys.includes(event.key)) targetIndex = (index + 1) % tabs.length;
      else if (previousKeys.includes(event.key)) targetIndex = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') targetIndex = 0;
      else if (event.key === 'End') targetIndex = tabs.length - 1;
      else return;
      event.preventDefault();
      selectProject(tabs[targetIndex], true);
    });
  });

  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');
  function setMenu(open) {
    if (!menuToggle || !mobileNav) return;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    mobileNav.hidden = !open;
    document.body.classList.toggle('menu-open', open);
  }
  menuToggle?.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
  mobileNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setMenu(false); });

  document.getElementById('year').textContent = String(new Date().getFullYear());
  const progress = document.getElementById('readProgress');
  let scheduled = false;
  function updateProgress() {
    scheduled = false;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const amount = scrollable > 0 ? window.scrollY / scrollable : 0;
    progress.style.transform = `scaleX(${Math.max(0, Math.min(1, amount))})`;
  }
  window.addEventListener('scroll', () => {
    if (!scheduled) {
      scheduled = true;
      window.requestAnimationFrame(updateProgress);
    }
  }, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  if (window.gsap && !reducedMotion) {
    if (window.ScrollTrigger) window.gsap.registerPlugin(window.ScrollTrigger);
    window.gsap.from('.hero-copy > *', { y: 24, opacity: 0, duration: .75, stagger: .1, ease: 'power3.out', delay: .12 });
    window.gsap.from('.hero-art', { y: 18, opacity: 0, rotate: 2.2, duration: .95, ease: 'power3.out', delay: .28 });

    if (window.ScrollTrigger) {
      const revealTargets = document.querySelectorAll('.section-heading, .workbench, .approach-head, .approach-main > *, .about-label, .about-copy, .contact-body');
      revealTargets.forEach((element) => {
        window.gsap.from(element, {
          y: 24,
          opacity: 0,
          duration: .8,
          ease: 'power2.out',
          scrollTrigger: { trigger: element, start: 'top 88%', once: true }
        });
      });
      window.ScrollTrigger.refresh();
    }
  }
})();
