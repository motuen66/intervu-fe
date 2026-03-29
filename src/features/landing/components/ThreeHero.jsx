import { useEffect, useRef } from 'react';
import * as THREE from 'three';

function ThreeHero({ pointer, onUpdate }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0, 7.2);

    const rootGroup = new THREE.Group();
    const orbGroup = new THREE.Group();
    rootGroup.add(orbGroup);
    scene.add(rootGroup);

    const ambient = new THREE.AmbientLight(0xffffff, 1.08);
    const key = new THREE.PointLight(0x10b981, 18, 20, 2);
    key.position.set(3.2, 2.4, 4.5);
    const fill = new THREE.PointLight(0x10b981, 10, 18, 2);
    fill.position.set(-3, -1.6, 3.5);
    const rim = new THREE.PointLight(0x10b981, 12, 18, 2);
    rim.position.set(0, 3.4, -1.5);
    scene.add(ambient, key, fill, rim);

    const coreGeometry = new THREE.IcosahedronGeometry(1.35, 1);
    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x10b981, // xanh lá theme
      emissive: 0x10b981,
      emissiveIntensity: 0.45,
      roughness: 0.18,
      metalness: 0.15,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      transmission: 0.08
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    orbGroup.add(core);

    const wireGeometry = new THREE.IcosahedronGeometry(1.72, 1);
    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(wireGeometry),
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.22
      })
    );
    orbGroup.add(wire);

    const haloOne = new THREE.Mesh(
      new THREE.TorusGeometry(2.28, 0.02, 16, 160),
      new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.16
      })
    );
    haloOne.rotation.x = Math.PI * 0.38;
    haloOne.rotation.y = Math.PI * 0.16;
    rootGroup.add(haloOne);

    const haloTwo = new THREE.Mesh(
      new THREE.TorusGeometry(2.72, 0.015, 16, 160),
      new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.18
      })
    );
    haloTwo.rotation.x = Math.PI * 0.67;
    haloTwo.rotation.y = Math.PI * 0.28;
    rootGroup.add(haloTwo);

    const particleCount = 70;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      const radius = 3.2 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
      particlesGeometry,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.035,
        transparent: true,
        opacity: 0.75
      })
    );
    scene.add(particles);

    const glowSprite = new THREE.Mesh(
      new THREE.SphereGeometry(2.1, 48, 48),
      new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.10
      })
    );
    rootGroup.add(glowSprite);

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', resize);
    resize();

    let drag = false;
    let lastPointerX = 0;
    let lastPointerY = 0;

    const onPointerMoveLocal = event => {
      if (drag) {
        const deltaX = event.clientX - lastPointerX;
        const deltaY = event.clientY - lastPointerY;
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
        targetRotationY += deltaX * 0.008;
        targetRotationX += deltaY * 0.008;
      }
    };

    const onPointerDown = event => {
      drag = true;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
    };

    const onPointerUp = () => {
      drag = false;
    };

    canvas.addEventListener('pointermove', onPointerMoveLocal);
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    const clock = new THREE.Clock();
    let animationId = 0;
    let targetRotationX = 0.38;
    let targetRotationY = 0.56;

    // Use the passed pointer values directly
    const animate = () => {
      const elapsed = clock.getElapsedTime();

      // Sensitivity matching
      const pX = pointer.x * 2;
      const pY = pointer.y * 2;

      targetRotationX += (pY * 0.18 - targetRotationX) * 0.012;
      targetRotationY += (pX * 0.18 - targetRotationY) * 0.012;

      rootGroup.rotation.x += (targetRotationX - rootGroup.rotation.x) * 0.08;
      rootGroup.rotation.y += (targetRotationY - rootGroup.rotation.y) * 0.08;
      const floatingY = Math.sin(elapsed * 1.2) * 0.14;
      rootGroup.position.y = floatingY;

      // Report back for card sync
      if (onUpdate) {
        onUpdate({
          rotation: { x: rootGroup.rotation.x, y: rootGroup.rotation.y },
          floatingY
        });
      }

      core.rotation.x = elapsed * 0.52;
      core.rotation.y = elapsed * 0.68;
      wire.rotation.x = -elapsed * 0.25;
      wire.rotation.y = elapsed * 0.32;
      haloOne.rotation.z = elapsed * 0.26;
      haloTwo.rotation.z = -elapsed * 0.18;
      particles.rotation.y = elapsed * 0.04;
      particles.rotation.x = elapsed * 0.025;

      renderer.render(scene, camera);
      animationId = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', onPointerMoveLocal);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      particlesGeometry.dispose();
      coreGeometry.dispose();
      wireGeometry.dispose();
      renderer.dispose();
      scene.clear();
    };
  }, [pointer, onUpdate]);

  return <canvas ref={canvasRef} className="three-hero-canvas" aria-hidden="true" />;
}

export default ThreeHero;
