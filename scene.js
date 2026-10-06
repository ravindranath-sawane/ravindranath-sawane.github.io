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
            new THREE.MeshStandardMaterial({ color: nodeColors[index % nodeColors.length], roughness: 0.34, metalness: 0.2 })
        );
        node.position.copy(position);
        node.castShadow = true;
        node.userData.baseY = position.y;
        node.userData.phase = index * 1.4;
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

    const core = new THREE.Group();
    core.position.set(0, 0.9, 0);
    const coreMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.9, 0),
        new THREE.MeshStandardMaterial({ color: 0x14213a, emissive: 0x17245a, emissiveIntensity: 0.48, roughness: 0.2, metalness: 0.55, flatShading: true })
    );
    coreMesh.castShadow = true;
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
        }
    });

    window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));

    canvas.addEventListener('pointermove', (event) => {
        const bounds = canvas.getBoundingClientRect();
        pointerX = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        pointerY = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
        targetRotationY = pointerX * 0.08;
        targetRotationX = pointerY * 0.035;
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

    const clock = new THREE.Clock();
    let sceneInView = true;
    let animationFrameId = null;

    function animate() {
        animationFrameId = null;
        if (document.hidden || !sceneInView) return;
        const elapsed = clock.getElapsedTime();
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
        });
        connections.forEach((line, index) => {
            line.material.opacity = 0.58 + Math.sin(elapsed * 1.2 + index) * 0.12;
        });
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
