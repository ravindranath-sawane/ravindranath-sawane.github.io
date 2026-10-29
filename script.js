(() => {
  const root = document.documentElement;
  const themeMeta = document.getElementById('themeColorMeta');
  const themeButtons = [
    document.getElementById('themeToggle'),
    ...document.querySelectorAll('[data-theme-toggle]')
  ].filter(Boolean);
  const themeLabel = document.querySelector('[data-theme-label]');
  const darkMedia = window.matchMedia('(prefers-color-scheme: dark)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion) {
    document.querySelectorAll('svg').forEach((svg) => svg.pauseAnimations?.());
  }

  /* 1. Editorial Theme System (Paper <-> Night Study) */
  function applyTheme(mode, { persist = false, atomic = true } = {}) {
    const isDark = mode === 'dark';
    let lockStyle = null;
    if (atomic && document.head) {
      lockStyle = document.createElement('style');
      lockStyle.textContent = '*,*::before,*::after{transition:none!important}';
      document.head.appendChild(lockStyle);
    }

    if (isDark) root.dataset.theme = 'dark';
    else delete root.dataset.theme;

    if (themeMeta) {
      themeMeta.setAttribute('content', isDark ? '#121512' : '#f1eee6');
    }
    if (themeLabel) {
      themeLabel.textContent = isDark ? 'PAPER' : 'NIGHT';
    }
    themeButtons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(isDark));
      btn.setAttribute(
        'aria-label',
        isDark ? 'Switch to Paper light theme' : 'Switch to Night Study dark theme'
      );
    });
    if (persist) {
      try {
        localStorage.setItem('rs-theme', isDark ? 'dark' : 'light');
      } catch {}
    }
    if (lockStyle) {
      void root.offsetHeight;
      lockStyle.remove();
    }
  }

  applyTheme(root.dataset.theme === 'dark' ? 'dark' : 'light', { persist: false, atomic: false });
  themeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next, { persist: true, atomic: true });
    });
  });
  darkMedia.addEventListener?.('change', (event) => {
    try {
      if (!localStorage.getItem('rs-theme')) {
        applyTheme(event.matches ? 'dark' : 'light', { persist: false, atomic: true });
      }
    } catch {}
  });

  /* 2. Live Toronto Local Clock */
  const clockEl = document.getElementById('torontoClock');
  function updateClock() {
    if (!clockEl) return;
    try {
      const formatted = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Toronto',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZoneName: 'short'
      }).format(new Date());
      clockEl.textContent = formatted.toUpperCase();
    } catch {}
  }
  updateClock();
  window.setInterval(updateClock, 30000);

  /* 3. Interactive Workbench Tabs & Deep-Linking */
  const tabs = [...document.querySelectorAll('[role="tab"][data-project]')];
  const panels = [...document.querySelectorAll('[role="tabpanel"]')];

  function selectProject(tab, { moveFocus = false, updateHash = false, animate = true } = {}) {
    if (!tab) return;
    const panel = document.getElementById(tab.getAttribute('aria-controls'));
    const alreadySelected = tab.getAttribute('aria-selected') === 'true';

    if (!panel) return;
    if (!alreadySelected) {
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

      const visual = panel.querySelector('.project-visual');
      const copy = panel.querySelector('.project-copy');
      if (window.gsap) {
        window.gsap.killTweensOf([visual, copy].filter(Boolean));
      }

      if (animate && !reducedMotion && document.visibilityState === 'visible' && window.gsap) {
        if (visual) {
          window.gsap.fromTo(
            visual,
            { clipPath: 'inset(0 0 0 8%)', opacity: 0.45 },
            {
              clipPath: 'inset(0 0 0 0)',
              opacity: 1,
              duration: 0.55,
              ease: 'power3.out',
              clearProps: 'clipPath,opacity,transform'
            }
          );
        }
        if (copy) {
          window.gsap.fromTo(
            copy,
            { y: 12, opacity: 0.4 },
            {
              y: 0,
              opacity: 1,
              duration: 0.45,
              delay: 0.06,
              ease: 'power2.out',
              clearProps: 'opacity,transform'
            }
          );
        }
      } else {
        if (visual) {
          visual.style.clipPath = '';
          visual.style.opacity = '';
          visual.style.transform = '';
        }
        if (copy) {
          copy.style.opacity = '';
          copy.style.transform = '';
        }
      }
    }

    if (moveFocus) tab.focus();
    if (updateHash && tab.dataset.project) {
      history.replaceState(null, '', `#work-${tab.dataset.project}`);
    }
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectProject(tab, { updateHash: true }));
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
      selectProject(tabs[targetIndex], { moveFocus: true, updateHash: true });
    });
  });

  function syncProjectFromHash(scrollIfMatched = false) {
    const raw = window.location.hash.replace(/^#/, '').toLowerCase();
    if (!raw) return;
    const slug = raw.startsWith('work-') ? raw.slice(5) : raw;
    const match = tabs.find((t) => t.dataset.project === slug);
    if (match) {
      selectProject(match, { animate: false });
      if (scrollIfMatched) {
        document.getElementById('work')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
      }
    }
  }
  syncProjectFromHash(true);
  window.addEventListener('hashchange', () => syncProjectFromHash(true));

  /* Clipboard helper */
  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }

  /* Case-study deep-link share buttons */
  document.querySelectorAll('[data-share-project]').forEach((btn) => {
    const original = btn.textContent;
    btn.addEventListener('click', async () => {
      const slug = btn.getAttribute('data-share-project');
      const url = new URL(window.location.href);
      url.hash = `work-${slug}`;
      history.replaceState(null, '', `#work-${slug}`);
      try {
        await copyText(url.toString());
        btn.textContent = '✓ LINK COPIED';
        window.setTimeout(() => { btn.textContent = original; }, 2000);
      } catch {}
    });
  });

  /* One-click Copy Email */
  const copyEmailBtn = document.getElementById('copyEmailBtn');
  if (copyEmailBtn) {
    const defaultLabel = copyEmailBtn.textContent;
    copyEmailBtn.addEventListener('click', async () => {
      const email = copyEmailBtn.getAttribute('data-email') || 'ravisawane9@gmail.com';
      try {
        await copyText(email);
        copyEmailBtn.textContent = '✓ COPIED TO CLIPBOARD';
        copyEmailBtn.classList.add('is-copied');
        window.setTimeout(() => {
          copyEmailBtn.textContent = defaultLabel;
          copyEmailBtn.classList.remove('is-copied');
        }, 2200);
      } catch {}
    });
  }

  /* 4. Mobile Navigation */
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

  /* 5. Sticky Header, Scroll Progress & Active Section Spy */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const progress = document.getElementById('readProgress');
  const siteHeader = document.getElementById('siteHeader');
  let scheduled = false;

  const navLinks = new Map(
    [...document.querySelectorAll('.main-nav a[data-nav]')].map((a) => [a.dataset.nav, a])
  );
  function setCurrentNav(navKey) {
    navLinks.forEach((link, key) => {
      const active = Boolean(navKey) && key === navKey;
      link.classList.toggle('is-current', active);
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  function updateScrollState() {
    scheduled = false;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const amount = scrollable > 0 ? window.scrollY / scrollable : 0;
    if (progress) {
      progress.style.transform = `scaleX(${Math.max(0, Math.min(1, amount))})`;
    }
    if (siteHeader) {
      siteHeader.classList.toggle('is-scrolled', window.scrollY > 14);
    }
    if (window.scrollY < 160 || (scrollable > 0 && scrollable - window.scrollY < 120)) {
      setCurrentNav('');
    }
    if (window.innerWidth > 820 && menuToggle?.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
    }
  }
  window.addEventListener('scroll', () => {
    if (document.visibilityState !== 'visible') {
      updateScrollState();
      return;
    }
    if (!scheduled) {
      scheduled = true;
      window.requestAnimationFrame(updateScrollState);
    }
  }, { passive: true });
  window.addEventListener('resize', updateScrollState);
  updateScrollState();

  const sectionToNav = {
    top: '',
    experience: 'experience',
    history: 'experience',
    work: 'work',
    approach: 'approach',
    about: 'about',
    contact: ''
  };
  if ('IntersectionObserver' in window && navLinks.size > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (window.scrollY < 160) return;
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollable > 0 && scrollable - window.scrollY < 120) return;
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (!(entry.target.id in sectionToNav)) return;
          setCurrentNav(sectionToNav[entry.target.id]);
        });
      },
      { rootMargin: '-32% 0px -55% 0px', threshold: 0 }
    );
    Object.keys(sectionToNav).forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }

  /* 6. GSAP Entrance & ScrollTrigger Choreography */
  if (window.gsap && !reducedMotion && document.visibilityState === 'visible') {
    if (window.ScrollTrigger) window.gsap.registerPlugin(window.ScrollTrigger);
    window.gsap.from('.hero-copy > *', {
      y: 22,
      opacity: 0,
      duration: 0.72,
      stagger: 0.09,
      ease: 'power3.out',
      delay: 0.08,
      clearProps: 'opacity,transform'
    });
    window.gsap.from('.hero-art', {
      y: 16,
      opacity: 0,
      rotate: 2.0,
      duration: 0.9,
      ease: 'power3.out',
      delay: 0.2,
      clearProps: 'opacity,transform'
    });

    if (window.ScrollTrigger) {
      const revealTargets = document.querySelectorAll(
        '.experience-grid, .history-heading, .history-entries, .section-heading, .workbench, .field-ledger, .approach-head, .approach-main > *, .about-label, .about-copy, .contact-body'
      );
      revealTargets.forEach((element) => {
        if (element.getBoundingClientRect().top < window.innerHeight * 0.92) return;
        window.gsap.from(element, {
          y: 20,
          opacity: 0,
          duration: 0.7,
          ease: 'power2.out',
          clearProps: 'opacity,transform',
          scrollTrigger: { trigger: element, start: 'top 90%', once: true }
        });
      });
      window.ScrollTrigger.refresh();
    }
  }
})();
