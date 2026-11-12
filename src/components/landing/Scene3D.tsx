'use client'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Interactive 3D "deal stack": agreement, delivery and payment layers around a
 * verification core, with orbiting milestones. Pointer parallax + scroll rotation.
 */
export default function Scene3D() {
  const host = useRef<HTMLDivElement>(null)
  const [unsupported, setUnsupported] = useState(false)

  useEffect(() => {
    const el = host.current
    if (!el) return
    gsap.registerPlugin(ScrollTrigger)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    } catch {
      setUnsupported(true)
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearAlpha(0)
    el.appendChild(renderer.domElement)
    renderer.domElement.setAttribute('aria-hidden', 'true')
    renderer.domElement.className = 'h-full w-full'

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50)
    camera.position.set(0, 0.4, 9)

    scene.add(new THREE.AmbientLight(0xffffff, 1.4))
    const key = new THREE.DirectionalLight(0xffffff, 2.2)
    key.position.set(4, 5, 6)
    scene.add(key)
    const rim = new THREE.PointLight(0x009cde, 40, 20)
    rim.position.set(-4, -2, 3)
    scene.add(rim)

    const rig = new THREE.Group()
    scene.add(rig)
    const disposables: { dispose(): void }[] = []
    const track = <T extends { dispose(): void }>(o: T) => (disposables.push(o), o)

    // Glass layers
    const layerColors = [0x003087, 0x009cde, 0x0070e0]
    const layers: THREE.Group[] = layerColors.map((color, i) => {
      const g = new THREE.Group()
      const geo = track(new THREE.BoxGeometry(4.2, 2.6, 0.08))
      const mat = track(new THREE.MeshPhysicalMaterial({
        color, transparent: true, opacity: 0.28 - i * 0.04, roughness: 0.15, metalness: 0.1,
        clearcoat: 1, clearcoatRoughness: 0.1, side: THREE.DoubleSide,
      }))
      g.add(new THREE.Mesh(geo, mat))
      const edges = track(new THREE.EdgesGeometry(geo))
      const lineMat = track(new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 }))
      g.add(new THREE.LineSegments(edges, lineMat))
      // content bars to suggest a document
      const barMat = track(new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55 }))
      for (let b = 0; b < 4; b++) {
        const w = [2.4, 3.2, 1.8, 2.8][b]!
        const bar = new THREE.Mesh(track(new THREE.PlaneGeometry(w, 0.13)), barMat)
        bar.position.set(-2.1 + w / 2 + 0.3, 0.75 - b * 0.32, 0.06)
        g.add(bar)
      }
      g.position.set(i * 0.35 - 0.35, 0.9 - i * 0.9, -i * 1.1 + 0.6)
      g.rotation.set(-0.35, 0.5, 0.05)
      rig.add(g)
      return g
    })

    // Verification core
    const core = new THREE.Mesh(
      track(new THREE.IcosahedronGeometry(0.75, 1)),
      track(new THREE.MeshPhysicalMaterial({ color: 0x009cde, emissive: 0x003087, emissiveIntensity: 0.6, roughness: 0.2, metalness: 0.6, flatShading: true })),
    )
    core.position.set(1.0, 0.3, 1.4)
    rig.add(core)
    const shell = new THREE.Mesh(
      track(new THREE.IcosahedronGeometry(1.05, 1)),
      track(new THREE.MeshBasicMaterial({ color: 0x0070e0, wireframe: true, transparent: true, opacity: 0.35 })),
    )
    shell.position.copy(core.position)
    rig.add(shell)

    // Orbiting milestones
    const orbit = new THREE.Group()
    orbit.position.copy(core.position)
    rig.add(orbit)
    const cubes = [0, 1, 2, 3].map((i) => {
      const done = i < 3
      const m = new THREE.Mesh(
        track(new THREE.BoxGeometry(0.28, 0.28, 0.28)),
        track(new THREE.MeshStandardMaterial({ color: done ? 0x16865c : 0xffc439, roughness: 0.3, metalness: 0.2 })),
      )
      const a = (i / 4) * Math.PI * 2
      m.position.set(Math.cos(a) * 1.5, Math.sin(a) * 0.35, Math.sin(a) * 1.5)
      orbit.add(m)
      return m
    })
    const ring = new THREE.Mesh(
      track(new THREE.TorusGeometry(1.5, 0.012, 8, 120)),
      track(new THREE.MeshBasicMaterial({ color: 0x003087, transparent: true, opacity: 0.4 })),
    )
    ring.rotation.x = Math.PI / 2
    orbit.add(ring)

    // Particles
    const pCount = 120
    const pos = new Float32Array(pCount * 3)
    for (let i = 0; i < pCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1
    }
    const pGeo = track(new THREE.BufferGeometry())
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const dust = new THREE.Points(pGeo, track(new THREE.PointsMaterial({ color: 0x009cde, size: 0.05, transparent: true, opacity: 0.6 })))
    scene.add(dust)

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = el
      if (!w || !h) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.position.z = w < 520 ? 13 : 10.5
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    // Interaction
    const rotY = gsap.quickTo(rig.rotation, 'y', { duration: 1.1, ease: 'power3.out' })
    const rotX = gsap.quickTo(rig.rotation, 'x', { duration: 1.1, ease: 'power3.out' })
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const nx = ((e.clientX - r.left) / r.width - 0.5) * 2
      const ny = ((e.clientY - r.top) / r.height - 0.5) * 2
      rotY(nx * 0.45)
      rotX(ny * 0.25)
    }
    const onLeave = () => { rotY(0); rotX(0) }
    if (!reduce) {
      window.addEventListener('pointermove', onMove)
      el.addEventListener('pointerleave', onLeave)
    }
    // Click: pulse core and spin the orbit
    const onClick = () => {
      gsap.fromTo(core.scale, { x: 1, y: 1, z: 1 }, { x: 1.5, y: 1.5, z: 1.5, duration: 0.3, yoyo: true, repeat: 1, ease: 'power2.out' })
      gsap.to(orbit.rotation, { y: '+=6.283', duration: 1.6, ease: 'power3.inOut' })
      cubes[3]!.material = new THREE.MeshStandardMaterial({ color: 0x16865c })
    }
    el.addEventListener('click', onClick)

    // Intro + scroll
    const ctx = gsap.context(() => {
      if (!reduce) {
        gsap.from(layers.map((l) => l.position), { z: '-=6', y: '+=2', duration: 1.6, ease: 'expo.out', stagger: 0.15 })
        gsap.from([core.scale, shell.scale], { x: 0, y: 0, z: 0, duration: 1.4, ease: 'elastic.out(1,0.6)', delay: 0.5 })
        gsap.to(rig.position, { y: -0.6, ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true } })
        gsap.to(rig.scale, { x: 0.85, y: 0.85, z: 0.85, ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true } })
      }
    })

    let raf = 0
    let visible = true
    const io = new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting }, { threshold: 0 })
    io.observe(el)
    const clock = new THREE.Clock()
    const render = () => {
      raf = requestAnimationFrame(render)
      if (!visible || document.hidden) return
      const t = clock.getElapsedTime()
      if (!reduce) {
        layers.forEach((l, i) => { l.position.y += Math.sin(t * 0.9 + i) * 0.0014 })
        core.rotation.x = t * 0.5
        core.rotation.y = t * 0.7
        shell.rotation.x = -t * 0.3
        shell.rotation.y = t * 0.2
        orbit.rotation.y += 0.004
        dust.rotation.y = t * 0.02
      }
      renderer.render(scene, camera)
    }
    render()

    return () => {
      cancelAnimationFrame(raf)
      ctx.revert()
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      el.removeEventListener('click', onClick)
      disposables.forEach((d) => d.dispose())
      cubes.forEach((c) => (c.material as THREE.Material).dispose())
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return (
    <div ref={host} className="relative h-full w-full cursor-pointer" role="img" aria-label="Interactive 3D illustration of agreement, delivery and payment layers around a verification core. Click to spin the milestones.">
      {unsupported && (
        <div className="grid h-full place-items-center rounded-3xl border border-line bg-white/60 p-6 text-center text-sm text-muted backdrop-blur">
          3D preview is unavailable on this device. The product works the same.
        </div>
      )}
    </div>
  )
}
