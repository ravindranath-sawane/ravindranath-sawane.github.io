const root = document.documentElement;
root.classList.add('js-ready');
if ('IntersectionObserver' in window) root.classList.add('js-motion');

const header = document.getElementById('siteHeader');
const progressBar = document.getElementById('readingProgress');
const menuToggle = document.getElementById('menuToggle');
const siteNav = document.getElementById('siteNav');
const navLinks = [...document.querySelectorAll('.nav-link')];

function closeMenu() {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    siteNav.classList.remove('is-open');
}

menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    siteNav.classList.toggle('is-open', isOpen);
});

siteNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        menuToggle.focus();
    }
});
window.matchMedia('(min-width: 701px)').addEventListener('change', closeMenu);

let scrollQueued = false;
function updateScrollUI() {
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
    progressBar.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;
    header.classList.toggle('is-scrolled', window.scrollY > 24);
    scrollQueued = false;
}
window.addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(updateScrollUI);
}, { passive: true });
window.addEventListener('resize', updateScrollUI, { passive: true });
updateScrollUI();

if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });
    document.querySelectorAll('[data-reveal]').forEach((element) => revealObserver.observe(element));

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            navLinks.forEach((link) => {
                const active = link.hash === `#${entry.target.id}`;
                link.classList.toggle('active', active);
                if (active) link.setAttribute('aria-current', 'location');
                else link.removeAttribute('aria-current');
            });
        });
    }, { rootMargin: '-28% 0px -62% 0px' });
    document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));
}

const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');
contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = contactForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    formStatus.textContent = 'Sending your note…';
    formStatus.className = 'form-status is-pending';

    try {
        const response = await fetch('https://formsubmit.co/ajax/ravisawane9@gmail.com', {
            method: 'POST',
            body: new FormData(contactForm),
            headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error('Message service unavailable');
        const result = await response.json();
        if (result.success === false || result.success === 'false') throw new Error('Message was not accepted');
        contactForm.reset();
        formStatus.textContent = 'Message sent. Thanks for reaching out.';
        formStatus.className = 'form-status is-success';
    } catch (error) {
        formStatus.textContent = 'Could not send just now. Please email ravisawane9@gmail.com instead.';
        formStatus.className = 'form-status is-error';
    } finally {
        submitButton.disabled = false;
    }
});
