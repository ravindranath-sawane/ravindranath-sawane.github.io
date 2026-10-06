const canvas = document.getElementById('scene-canvas');
const hero = document.querySelector('.hero');

if (canvas && hero) {
    const context = canvas.getContext('2d', { alpha: true });
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let visible = true;
    let frame = null;
    let startTime = performance.now();

    const colors = ['#d9f27b', '#f27b62', '#a5d7df', '#eff2dc'];
    const routes = [
        { radius: 0.31, squash: 0.33, tilt: -0.52, speed: 0.12, color: colors[0], phase: 0.09 },
        { radius: 0.4, squash: 0.22, tilt: 0.39, speed: -0.083, color: colors[1], phase: 0.43 },
        { radius: 0.49, squash: 0.13, tilt: -0.15, speed: 0.055, color: colors[2], phase: 0.74 },
        { radius: 0.24, squash: 0.52, tilt: 0.95, speed: -0.16, color: colors[3], phase: 0.61 }
    ];

    function resize() {
        const bounds = hero.getBoundingClientRect();
        width = bounds.width;
        height = bounds.height;
        pixelRatio = Math.min(window.devicePixelRatio || 1, 1.7);
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        draw(performance.now());
    }

    function pointOnRoute(route, angle, cx, cy, rx, ry, tilt) {
        const x = Math.cos(angle) * rx;
        const y = Math.sin(angle) * ry;
        const cosine = Math.cos(tilt);
        const sine = Math.sin(tilt);
        return { x: cx + x * cosine - y * sine, y: cy + x * sine + y * cosine };
    }

    function draw(timestamp) {
        if (!width || !height) return;
        context.clearRect(0, 0, width, height);
        const compact = width < 700;
        const cx = width * (compact ? 0.72 : 0.735) + pointer.x * 19;
        const cy = height * 0.51 + pointer.y * 13;
        const unit = Math.min(width, height) * (compact ? 0.78 : 0.66);
        const seconds = reducedMotion ? 0 : (timestamp - startTime) / 1000;

        // A quiet coordinate field gives the orbit artwork a technical, drawn quality.
        context.save();
        context.strokeStyle = 'rgba(217,242,123,.055)';
        context.lineWidth = 1;
        const spacing = compact ? 46 : 58;
        for (let x = (cx % spacing + spacing) % spacing; x < width; x += spacing) {
            context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke();
        }
        for (let y = (cy % spacing + spacing) % spacing; y < height; y += spacing) {
            context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
        }
        context.restore();

        routes.forEach((route, routeIndex) => {
            const rx = unit * route.radius;
            const ry = unit * route.radius * route.squash;
            const rotation = route.tilt + pointer.x * 0.045;
            context.save();
            context.translate(cx, cy);
            context.rotate(rotation);
            context.beginPath();
            context.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
            context.strokeStyle = routeIndex === 0 ? 'rgba(217,242,123,.55)' : 'rgba(229,238,218,.17)';
            context.lineWidth = routeIndex === 0 ? 1.2 : 0.8;
            context.setLineDash(routeIndex === 2 ? [2, 9] : []);
            context.stroke();
            context.restore();

            const angle = seconds * route.speed + route.phase * Math.PI * 2;
            const position = pointOnRoute(route, angle, cx, cy, rx, ry, rotation);
            const trail = pointOnRoute(route, angle - Math.sign(route.speed) * 0.14, cx, cy, rx, ry, rotation);
            const gradient = context.createLinearGradient(trail.x, trail.y, position.x, position.y);
            gradient.addColorStop(0, 'rgba(255,255,255,0)');
            gradient.addColorStop(1, route.color);
            context.beginPath();
            context.moveTo(trail.x, trail.y);
            context.lineTo(position.x, position.y);
            context.strokeStyle = gradient;
            context.lineWidth = 2;
            context.stroke();
            context.beginPath();
            context.arc(position.x, position.y, routeIndex === 0 ? 4 : 3, 0, Math.PI * 2);
            context.fillStyle = route.color;
            context.shadowColor = route.color;
            context.shadowBlur = 18;
            context.fill();
            context.shadowBlur = 0;
        });

        // The central decision point breathes while small satellites relay signals.
        const pulse = 1 + (reducedMotion ? 0 : Math.sin(seconds * 1.2) * 0.08);
        const halo = context.createRadialGradient(cx, cy, 2, cx, cy, unit * 0.16 * pulse);
        halo.addColorStop(0, 'rgba(217,242,123,.2)');
        halo.addColorStop(1, 'rgba(217,242,123,0)');
        context.fillStyle = halo;
        context.beginPath(); context.arc(cx, cy, unit * 0.16 * pulse, 0, Math.PI * 2); context.fill();
        context.beginPath(); context.arc(cx, cy, 16 * pulse, 0, Math.PI * 2);
        context.fillStyle = '#d9f27b'; context.shadowColor = '#d9f27b'; context.shadowBlur = 34; context.fill(); context.shadowBlur = 0;
        context.beginPath(); context.arc(cx, cy, 5, 0, Math.PI * 2); context.fillStyle = '#101e1c'; context.fill();

        const satellites = [
            { x: cx - unit * 0.27, y: cy - unit * 0.14, c: colors[1], t: 'CONTEXT' },
            { x: cx + unit * 0.29, y: cy - unit * 0.08, c: colors[2], t: 'TOOLS' },
            { x: cx + unit * 0.03, y: cy + unit * 0.23, c: colors[0], t: 'HUMAN IN LOOP' }
        ];
        satellites.forEach((satellite, index) => {
            const wobble = reducedMotion ? 0 : Math.sin(seconds * 0.8 + index * 2) * 5;
            const x = satellite.x + pointer.x * (index + 1) * 3;
            const y = satellite.y + wobble + pointer.y * (index + 1) * 3;
            context.beginPath(); context.moveTo(cx, cy); context.lineTo(x, y);
            context.strokeStyle = 'rgba(217,242,123,.18)'; context.setLineDash([2, 5]); context.stroke(); context.setLineDash([]);
            context.beginPath(); context.arc(x, y, 6, 0, Math.PI * 2);
            context.fillStyle = satellite.c; context.shadowColor = satellite.c; context.shadowBlur = 14; context.fill(); context.shadowBlur = 0;
            if (!compact) {
                context.fillStyle = 'rgba(250,249,244,.55)';
                context.font = '10px "DM Mono", monospace';
                context.fillText(satellite.t, x + 13, y + 4);
            }
        });

        if (!reducedMotion && visible && !document.hidden) frame = requestAnimationFrame(draw);
    }

    function pause() {
        if (frame !== null) cancelAnimationFrame(frame);
        frame = null;
    }
    function resume() {
        if (visible && !document.hidden && !reducedMotion && frame === null) frame = requestAnimationFrame(draw);
        else if (reducedMotion) draw(performance.now());
    }

    const onPointerMove = (event) => {
        if (event.pointerType === 'touch') return;
        const bounds = hero.getBoundingClientRect();
        pointer.targetX = ((event.clientX - bounds.left) / bounds.width - 0.73) * 2;
        pointer.targetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
        pointer.x += (pointer.targetX - pointer.x) * 0.18;
        pointer.y += (pointer.targetY - pointer.y) * 0.18;
        if (reducedMotion) draw(performance.now());
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => document.hidden ? pause() : resume());
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            visible ? resume() : pause();
        }).observe(hero);
    }
    resize();
    resume();
}
