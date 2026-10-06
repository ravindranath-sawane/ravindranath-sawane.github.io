import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js';

const canvas = document.getElementById('scene-canvas');

if (canvas) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b15);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(7, 7, 11);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const world = new THREE.Group();
    scene.add(world);

    scene.add(new THREE.HemisphereLight(0x8cecff, 0x11152b, 2.1));
    const keyLight = new THREE.DirectionalLight(0xd9f6ff, 3.2);
    keyLight.position.set(4, 9, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const grid = new THREE.GridHelper(30, 30, 0x27eaff, 0x163653);
    grid.position.y = -0.05;
    grid.material.opacity = 0.38;
    grid.material.transparent = true;
    world.add(grid);

    const floor = new THREE.Mesh(
        new THREE.CircleGeometry(15, 48),
        new THREE.MeshStandardMaterial({ color: 0x0a1321, roughness: 0.84, metalness: 0.18 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.08;
    floor.receiveShadow = true;
    world.add(floor);

    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x111d31, roughness: 0.72, metalness: 0.24 });
    const roadMarkMaterial = new THREE.MeshBasicMaterial({ color: 0x37eaff });
    const road = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.04, 22), roadMaterial);
    road.position.y = -0.02;
    world.add(road);
    const crossRoad = new THREE.Mesh(new THREE.BoxGeometry(22, 0.04, 2.2), roadMaterial);
    crossRoad.position.y = -0.015;
    world.add(crossRoad);

    for (let position = -9; position <= 9; position += 2) {
        const mark = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.045, 0.75), roadMarkMaterial);
        mark.position.set(0, 0.01, position);
        world.add(mark);
        const crossMark = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.045, 0.1), roadMarkMaterial);
        crossMark.position.set(position, 0.01, 0);
        world.add(crossMark);
    }

    const buildingMaterials = [
        new THREE.MeshStandardMaterial({ color: 0x14253b, roughness: 0.62, metalness: 0.3 }),
        new THREE.MeshStandardMaterial({ color: 0x332451, roughness: 0.58, metalness: 0.34 }),
        new THREE.MeshStandardMaterial({ color: 0x0f3545, roughness: 0.52, metalness: 0.38 })
    ];
    const buildings = [
        [-5.6, 0.9, -4.2, 2.2, 1.8, 2.2, 0],
        [5.6, 1.3, -4.2, 2.2, 2.6, 2.2, 1],
        [-5.3, 1.1, 4.2, 2.5, 2.2, 2.4, 2],
        [5.4, 0.8, 4.5, 2.4, 1.6, 2.4, 0],
        [-8, 0.65, -0.4, 1.5, 1.3, 1.7, 1],
        [8, 0.75, 0.8, 1.5, 1.5, 1.7, 2]
    ];
    buildings.forEach(([x, y, z, width, height, depth, materialIndex]) => {
        const building = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            buildingMaterials[materialIndex]
        );
        building.position.set(x, y, z);
        building.castShadow = true;
        building.receiveShadow = true;
        world.add(building);
        const roof = new THREE.Mesh(
            new THREE.BoxGeometry(width + 0.12, 0.12, depth + 0.12),
            new THREE.MeshStandardMaterial({ color: 0x080d19, roughness: 0.72, metalness: 0.24 })
        );
        roof.position.set(x, height + 0.06, z);
        roof.castShadow = true;
        world.add(roof);
    });

    const ramp = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.5, 3.2),
        new THREE.MeshStandardMaterial({ color: 0xb47716, roughness: 0.65 })
    );
    ramp.position.set(-3.5, 0.25, 4.3);
    ramp.rotation.x = -0.16;
    ramp.castShadow = true;
    world.add(ramp);

    const nodeColors = [0x34f4ff, 0xff4fd8, 0x9b8cff];
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 128;
    glowCanvas.height = 128;
    const glowContext = glowCanvas.getContext('2d');
    const glowGradient = glowContext.createRadialGradient(64, 64, 2, 64, 64, 64);
    glowGradient.addColorStop(0, 'rgba(255,255,255,1)');
    glowGradient.addColorStop(0.18, 'rgba(255,255,255,.76)');
    glowGradient.addColorStop(0.48, 'rgba(255,255,255,.18)');
    glowGradient.addColorStop(1, 'rgba(255,255,255,0)');
    glowContext.fillStyle = glowGradient;
    glowContext.fillRect(0, 0, 128, 128);
    const glowTexture = new THREE.CanvasTexture(glowCanvas);

    function makeGlow(color, opacity, scale) {
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({
            map: glowTexture,
            color,
            transparent: true,
            opacity,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        }));
        glow.scale.setScalar(scale);
        glow.renderOrder = -1;
        return glow;
    }

    const nodes = [];
    const nodePositions = [
        new THREE.Vector3(-3.4, 0.55, -1.5),
        new THREE.Vector3(2.8, 0.55, -2.4),
        new THREE.Vector3(3.8, 0.55, 1.8),
        new THREE.Vector3(-2.6, 0.55, 2.2)
    ];

    const nodeGeometry = new THREE.IcosahedronGeometry(0.55, 0);
    nodePositions.forEach((position, index) => {
        const node = new THREE.Mesh(
            nodeGeometry,
            new THREE.MeshStandardMaterial({
                color: nodeColors[index % nodeColors.length],
                emissive: nodeColors[index % nodeColors.length],
                emissiveIntensity: 0.28,
                roughness: 0.3,
                metalness: 0.25
            })
        );
        const glow = makeGlow(nodeColors[index % nodeColors.length], 0.62, 3.1);
        glow.position.y = -0.1;
        node.add(glow);
        node.userData.glow = glow;
        node.position.copy(position);
        node.castShadow = true;
        node.userData.baseY = position.y;
        node.userData.phase = index * 1.4;
        const orbit = new THREE.Mesh(
            new THREE.TorusGeometry(0.78, 0.012, 6, 48),
            new THREE.MeshBasicMaterial({ color: nodeColors[index % nodeColors.length], transparent: true, opacity: 0.48 })
        );
        orbit.rotation.x = Math.PI / 2;
        orbit.position.y = 0.12;
        node.add(orbit);
        node.userData.orbit = orbit;
        world.add(node);
        nodes.push(node);
    });

    const connections = nodePositions.map((position, index) => {
        const nextPosition = nodePositions[(index + 1) % nodePositions.length];
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(position.x, 0.55, position.z),
            new THREE.Vector3(nextPosition.x, 0.55, nextPosition.z)
        ]);
        const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x39e9ff, transparent: true, opacity: 0.78 }));
        world.add(line);
        return line;
    });

    // A continuous route carries visible data packets between each supply node.
    const supplyRoute = new THREE.CatmullRomCurve3(nodePositions, true, 'centripetal');
    const routeGlow = new THREE.Mesh(
        new THREE.TubeGeometry(supplyRoute, 160, 0.018, 5, true),
        new THREE.MeshBasicMaterial({ color: 0x49efff, transparent: true, opacity: 0.35 })
    );
    world.add(routeGlow);

    const dataPackets = [0x62f5ff, 0xff65dc, 0xb19aff].map((color, index) => {
        const packet = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.12, 1),
            new THREE.MeshBasicMaterial({ color })
        );
        const glow = makeGlow(color, 0.9, 1.25);
        packet.add(glow);
        const halo = new THREE.Mesh(
            new THREE.TorusGeometry(0.2, 0.012, 5, 24),
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 })
        );
        halo.rotation.x = Math.PI / 2;
        packet.add(halo);

        const trailGeometry = new THREE.BufferGeometry();
        const trailPositions = new Float32Array(18 * 3);
        trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3).setUsage(THREE.DynamicDrawUsage));
        const trail = new THREE.Line(
            trailGeometry,
            new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.52 })
        );
        world.add(packet, trail);
        return { packet, trail, phase: index / 3, glow };
    });

    const sparkGeometry = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(180 * 3);
    for (let index = 0; index < 180; index += 1) {
        const angle = index * 2.399;
        const radius = 1.8 + ((index * 17) % 100) / 55;
        sparkPositions[index * 3] = Math.cos(angle) * radius;
        sparkPositions[index * 3 + 1] = ((index * 29) % 100) / 35 - 1.2;
        sparkPositions[index * 3 + 2] = Math.sin(angle) * radius;
    }
    sparkGeometry.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparkField = new THREE.Points(
        sparkGeometry,
        new THREE.PointsMaterial({ color: 0x75dfff, size: 0.035, transparent: true, opacity: 0.58, sizeAttenuation: true })
    );
    sparkField.position.y = 0.9;
    world.add(sparkField);

    const core = new THREE.Group();
    core.position.set(0, 0.9, 0);
    const coreMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.9, 0),
        new THREE.MeshStandardMaterial({ color: 0x14213a, emissive: 0x17245a, emissiveIntensity: 0.48, roughness: 0.2, metalness: 0.55, flatShading: true })
    );
    coreMesh.castShadow = true;
    core.add(makeGlow(0x5e8dff, 0.66, 5.2));
    core.add(coreMesh);

    const coreRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.25, 0.025, 8, 48),
        new THREE.MeshBasicMaterial({ color: 0xff4fd8, transparent: true, opacity: 0.9 })
    );
    coreRing.rotation.x = Math.PI / 2;
    core.add(coreRing);
    world.add(core);

    const beacon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x48f5ff, emissive: 0x17bde8, emissiveIntensity: 0.75 })
    );
    beacon.position.set(0, 2.2, 0);
    beacon.castShadow = true;
    world.add(beacon);

    const agent = new THREE.Group();
    const agentBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.35, 1.15),
        new THREE.MeshStandardMaterial({ color: 0xff4fd8, emissive: 0x54124f, emissiveIntensity: 0.24, roughness: 0.28, metalness: 0.35 })
    );
    agentBody.position.y = 0.3;
    agentBody.castShadow = true;
    agent.add(agentBody);

    const agentTop = new THREE.Mesh(
        new THREE.ConeGeometry(0.27, 0.4, 4),
        new THREE.MeshStandardMaterial({ color: 0x54f5ff, emissive: 0x18849d, emissiveIntensity: 0.45, roughness: 0.24 })
    );
    agentTop.rotation.y = Math.PI / 4;
    agentTop.position.set(0, 0.66, 0);
    agentTop.castShadow = true;
    agent.add(agentTop);

    const wheelGeometry = new THREE.CylinderGeometry(0.14, 0.14, 0.12, 12);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x080d19, roughness: 0.7 });
    [-0.42, 0.42].forEach((xPosition) => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(xPosition, 0.15, 0.32);
        agent.add(wheel);
        const rearWheel = wheel.clone();
        rearWheel.position.z = -0.32;
        agent.add(rearWheel);
    });
    agent.position.set(0, 0, 3.5);
    world.add(agent);

    const keys = new Set();
    let pointerX = 0;
    let pointerY = 0;
    let targetRotationY = 0;
    let targetRotationX = 0;

    window.addEventListener('keydown', (event) => {
        if (document.activeElement === canvas && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(event.key.toLowerCase())) {
            event.preventDefault();
            keys.add(event.key.toLowerCase());
            if (reducedMotion) {
                moveAgent();
                renderer.render(scene, camera);
                keys.delete(event.key.toLowerCase());
            }
        }
    });

    window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));

    canvas.addEventListener('pointermove', (event) => {
        const bounds = canvas.getBoundingClientRect();
        pointerX = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        pointerY = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
        targetRotationY = pointerX * 0.2;
        targetRotationX = pointerY * 0.09;
        if (reducedMotion) {
            world.rotation.y = targetRotationY;
            world.rotation.x = targetRotationX;
            renderer.render(scene, camera);
        }
    });

    canvas.addEventListener('pointerleave', () => {
        targetRotationX = 0;
        targetRotationY = 0;
    });

    function resize() {
        const bounds = canvas.getBoundingClientRect();
        camera.aspect = bounds.width / bounds.height;
        camera.updateProjectionMatrix();
        renderer.setSize(bounds.width, bounds.height, false);
    }

    function moveAgent() {
        const speed = 0.055;
        const horizontal = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
        const depth = (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0);
        agent.position.x = THREE.MathUtils.clamp(agent.position.x + horizontal * speed, -5.5, 5.5);
        agent.position.z = THREE.MathUtils.clamp(agent.position.z + depth * speed, -4.5, 5.5);
        if (horizontal || depth) {
            agent.rotation.y = Math.atan2(horizontal, depth || 0.001);
        }
    }

    const trailPoint = new THREE.Vector3();
    function updateDataPackets(elapsed) {
        dataPackets.forEach(({ packet, trail, phase, glow }) => {
            const progress = (elapsed * 0.075 + phase) % 1;
            supplyRoute.getPointAt(progress, packet.position);
            packet.rotation.y = elapsed * 1.7;
            glow.scale.setScalar(1.2 + Math.sin(elapsed * 4 + phase * 8) * 0.12);
            const positions = trail.geometry.attributes.position.array;
            for (let point = 0; point < 18; point += 1) {
                const trailProgress = (progress - point * 0.0045 + 1) % 1;
                supplyRoute.getPointAt(trailProgress, trailPoint);
                positions[point * 3] = trailPoint.x;
                positions[point * 3 + 1] = trailPoint.y;
                positions[point * 3 + 2] = trailPoint.z;
            }
            trail.geometry.attributes.position.needsUpdate = true;
            trail.geometry.computeBoundingSphere();
        });
    }

    const clock = new THREE.Clock();
    let sceneInView = true;
    let animationFrameId = null;

    function animate() {
        animationFrameId = null;
        if (document.hidden || !sceneInView) return;
        const elapsed = clock.getElapsedTime();
        updateDataPackets(elapsed);
        if (reducedMotion) {
            renderer.render(scene, camera);
            return;
        }
        animationFrameId = requestAnimationFrame(animate);
        moveAgent();
        world.rotation.y += (targetRotationY - world.rotation.y) * 0.025;
        world.rotation.x += (targetRotationX - world.rotation.x) * 0.025;
        core.rotation.y = elapsed * 0.45;
        coreRing.rotation.z = elapsed * 0.7;
        nodes.forEach((node) => {
            node.rotation.x = elapsed * 0.35 + node.userData.phase;
            node.rotation.y = elapsed * 0.55 + node.userData.phase;
            node.position.y = node.userData.baseY + Math.sin(elapsed * 1.4 + node.userData.phase) * 0.12;
            node.userData.orbit.rotation.z = -elapsed * 0.7 - node.userData.phase;
            node.userData.orbit.scale.setScalar(1 + Math.sin(elapsed * 2 + node.userData.phase) * 0.08);
            node.material.emissiveIntensity = 0.22 + (Math.sin(elapsed * 2.2 + node.userData.phase) + 1) * 0.12;
            node.userData.glow.scale.setScalar(3.1 + Math.sin(elapsed * 1.7 + node.userData.phase) * 0.22);
        });
        connections.forEach((line, index) => {
            line.material.opacity = 0.58 + Math.sin(elapsed * 1.2 + index) * 0.12;
        });
        sparkField.rotation.y = elapsed * 0.035;
        sparkField.rotation.x = Math.sin(elapsed * 0.12) * 0.035;
        renderer.render(scene, camera);
    }

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        } else if (!document.hidden && sceneInView && animationFrameId === null) {
            animate();
        }
    });
    const sceneObserver = new IntersectionObserver(([entry]) => {
        sceneInView = entry.isIntersecting;
        if (sceneInView && !document.hidden && animationFrameId === null) {
            animate();
        } else if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    });
    sceneObserver.observe(canvas);
    animate();
}
