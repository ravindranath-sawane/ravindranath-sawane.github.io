const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');
const navbar = document.getElementById('navbar');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function closeMenu() {
    navMenu.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open navigation menu');
}

navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('active');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
});

navLinks.forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navMenu.classList.contains('active')) {
        closeMenu();
        navToggle.focus();
    }
});

let scrollTicking = false;
window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(() => {
        navbar.classList.toggle('is-scrolled', window.scrollY > 16);
        const currentSection = [...document.querySelectorAll('main section[id]')]
            .filter((section) => section.getBoundingClientRect().top <= 140)
            .pop();
        navLinks.forEach((link) => {
            const active = currentSection && link.getAttribute('href') === `#${currentSection.id}`;
            link.classList.toggle('active', Boolean(active));
            if (active) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
        scrollTicking = false;
    });
}, { passive: true });

// Reveal content only when motion is allowed and the observer is available.
if (!reducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

    document.querySelectorAll('.section, .skill-card, .project-card, .timeline-item, .publication-item')
        .forEach((element) => {
            element.classList.add('will-reveal');
            revealObserver.observe(element);
        });
}

const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');
contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = contactForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    formStatus.textContent = 'Sending your message…';
    formStatus.className = 'form-status is-pending';

    try {
        const response = await fetch('https://formsubmit.co/ajax/ravisawane9@gmail.com', {
            method: 'POST',
            body: new FormData(contactForm),
            headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error('Message service unavailable');
        const result = await response.json();
        if (result.success === 'false' || result.success === false) throw new Error('Message was not accepted');
        contactForm.reset();
        formStatus.textContent = 'Thanks, your message was sent. I’ll be in touch soon.';
        formStatus.className = 'form-status is-success';
    } catch (error) {
        formStatus.textContent = 'I couldn’t send that just now. Please email ravisawane9@gmail.com instead.';
        formStatus.className = 'form-status is-error';
    } finally {
        submitButton.disabled = false;
    }
});
