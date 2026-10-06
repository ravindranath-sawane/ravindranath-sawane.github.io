const root = document.documentElement;
const header = document.getElementById('siteHeader');
const menuToggle = document.getElementById('menuToggle');
const siteNav = document.getElementById('siteNav');
const progress = document.getElementById('scrollProgress');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGSAP = Boolean(window.gsap && window.ScrollTrigger && window.MotionPathPlugin);

root.classList.toggle('no-gsap', !hasGSAP);
root.classList.toggle('reduced-motion', reduceMotion);

function closeMenu() {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    siteNav.classList.remove('is-open');
}

menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    siteNav.classList.toggle('is-open', open);
});
siteNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        menuToggle.focus();
    }
});
window.matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);

let queued = false;
function updateHeader() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const amount = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    progress.style.width = `${Math.max(0, Math.min(1, amount)) * 100}%`;
    header.classList.toggle('is-scrolled', window.scrollY > 24);
    queued = false;
}
window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(updateHeader);
}, { passive: true });
window.addEventListener('resize', updateHeader, { passive: true });
updateHeader();

if (!hasGSAP || reduceMotion) {
    // Native scroll and the complete project stack remain available without motion.
} else {
    const { gsap } = window;
    const { ScrollTrigger, MotionPathPlugin } = window;
    gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
    root.classList.add('motion-ready');

    const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
    intro.from('.hero-eyebrow', { y: 16, autoAlpha: 0, duration: .7 })
        .from('.title-word', { yPercent: 115, rotate: 4, duration: 1.15, stagger: .15 }, '-=.38')
        .from('.hero-intro', { y: 20, autoAlpha: 0, duration: .7 }, '-=.48')
        .from('.hero-cta', { y: 15, autoAlpha: 0, duration: .55 }, '-=.38')
        .from('.art-label, .art-caption, .art-coordinates', { autoAlpha: 0, duration: .6, stagger: .1 }, '-=.7');

    gsap.to('.art-orbit--a', { rotate: 360, transformOrigin: '50% 50%', duration: 80, repeat: -1, ease: 'none' });
    gsap.to('.art-orbit--b', { rotate: -360, transformOrigin: '50% 50%', duration: 105, repeat: -1, ease: 'none' });
    gsap.to('.art-orbit--dots', { rotate: 360, transformOrigin: '50% 50%', duration: 22, repeat: -1, ease: 'none' });
    gsap.to('.data-packet--one', { motionPath: { path: '.art-wire path:first-child', align: '.art-wire path:first-child', alignOrigin: [.5,.5], autoRotate: true }, duration: 5, repeat: -1, ease: 'none' });
    gsap.to('.data-packet--two', { motionPath: { path: '.art-wire path:last-child', align: '.art-wire path:last-child', alignOrigin: [.5,.5], autoRotate: true }, duration: 7, repeat: -1, ease: 'none', delay: -3 });
    gsap.to('.art-core', { scale: 1.045, transformOrigin: '50% 50%', duration: 2.8, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('.ticker-track', { xPercent: -50, repeat: -1, duration: 27, ease: 'none' });
    gsap.to('.contact-orbit', { rotate: 360, duration: 44, repeat: -1, ease: 'none' });
    gsap.to('.jira-spark', { rotate: 90, scale: 1.25, duration: 1.8, repeat: -1, yoyo: true, stagger: .7, ease: 'sine.inOut' });
    gsap.to('.rag-particle', { x: 45, duration: 1.6, repeat: -1, yoyo: true, stagger: .6, ease: 'sine.inOut' });
    gsap.to('.flow-dot', { x: 48, duration: 1.8, repeat: -1, yoyo: true, stagger: .9, ease: 'sine.inOut' });
    gsap.to('.gaze-target', { scale: 1.13, duration: 1.5, repeat: -1, yoyo: true, ease: 'sine.inOut' });

    gsap.utils.toArray('[data-reveal]').forEach((element) => {
        gsap.fromTo(element, { y: 28, autoAlpha: 0 }, {
            y: 0, autoAlpha: 1, duration: .8, ease: 'power2.out',
            scrollTrigger: { trigger: element, start: 'top 88%', once: true }
        });
    });

    gsap.matchMedia().add('(min-width: 1100px)', () => {
        const stage = document.getElementById('projectStage');
        const track = document.getElementById('projectTrack');
        const panels = gsap.utils.toArray('.project-panel');
        const active = document.getElementById('activeProject');
        const trackDistance = () => Math.max(0, track.scrollWidth - stage.clientWidth);

        gsap.to(track, {
            x: () => -trackDistance(),
            ease: 'none',
            scrollTrigger: {
                trigger: stage,
                start: 'top top',
                end: () => `+=${trackDistance()}`,
                pin: true,
                scrub: .8,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                    const viewportCenter = window.innerWidth / 2;
                    let index = 0;
                    let closestDistance = Infinity;
                    panels.forEach((panel, candidateIndex) => {
                        const bounds = panel.getBoundingClientRect();
                        const distance = Math.abs(bounds.left + bounds.width / 2 - viewportCenter);
                        if (distance < closestDistance) {
                            closestDistance = distance;
                            index = candidateIndex;
                        }
                    });
                    active.textContent = String(index + 1).padStart(2, '0');
                }
            }
        });
        panels.forEach((panel, index) => {
            gsap.from(panel.querySelector('.panel-art'), {
                clipPath: 'inset(8% 5% 8% 5%)',
                scale: .94,
                duration: .32,
                ease: 'none',
                scrollTrigger: {
                    trigger: stage,
                    start: () => `top+=${index * trackDistance() / panels.length} top`,
                    end: () => `top+=${(index + 1) * trackDistance() / panels.length} top`,
                    scrub: .5
                }
            });
        });
    });

    const heroArt = document.getElementById('heroArt');
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    if (!coarsePointer) {
        const moveArt = gsap.quickTo(heroArt, 'rotationY', { duration: .7, ease: 'power3.out' });
        const moveTilt = gsap.quickTo(heroArt, 'rotationX', { duration: .7, ease: 'power3.out' });
        document.querySelector('.hero').addEventListener('pointermove', (event) => {
            const bounds = heroArt.getBoundingClientRect();
            moveArt(((event.clientX - bounds.left) / bounds.width - .5) * 9);
            moveTilt(-((event.clientY - bounds.top) / bounds.height - .5) * 7);
        }, { passive: true });
        document.querySelector('.hero').addEventListener('pointerleave', () => {
            moveArt(0);
            moveTilt(0);
        });
    }

    document.querySelectorAll('.project-panel').forEach((panel) => {
        panel.addEventListener('pointermove', (event) => {
            if (window.matchMedia('(pointer: coarse)').matches) return;
            const box = panel.getBoundingClientRect();
            const x = (event.clientX - box.left) / box.width - .5;
            const y = (event.clientY - box.top) / box.height - .5;
            gsap.to(panel.querySelector('.panel-art'), { x: x * 9, y: y * 7, duration: .5, overwrite: true, ease: 'power2.out' });
        });
        panel.addEventListener('pointerleave', () => {
            gsap.to(panel.querySelector('.panel-art'), { x: 0, y: 0, duration: .65, ease: 'elastic.out(1,.7)' });
        });
    });
}
