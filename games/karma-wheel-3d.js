/* Casino NYC — Rueda 3D de KARMA (Three.js).
 * Matemática de giro y geometría portadas de ROBERRTRSP/karma
 * (src/domain/roulette + src/components/roulette/wheel-stage.tsx).
 * Sin POS, fondos, API ni autenticación. Solo demo local.
 */
(() => {
  'use strict';
  if (!window.THREE) {
    console.error('Three.js no está cargado. Incluye three.min.js antes de karma-wheel-3d.js');
    return;
  }
  const THREE = window.THREE;

  const WHEEL_POCKETS = Object.freeze([
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
  ]);
  const POCKET_COUNT = WHEEL_POCKETS.length;
  const TAU = Math.PI * 2;
  const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  const SPIN_MS = 10000;
  const SPIN_DROP = 0.56;
  const WHEEL_TURNS = 5.5;
  const BALL_TURNS = 10.5;
  const WHEEL_DECAY = 2.25;
  const BALL_DECAY = 1.55;
  const CATCH_TURNS = 1.25;
  const END_DRIFT = 0.16;

  const NEST = 0.87;
  const TRACK = 1.49;
  const POCKET_INNER = 0.76;
  const POCKET_OUTER = 0.99;
  const NUM_OUTER = 1.2;
  const POCKET_Y = 0.04;
  const POCKET_H = 0.036;
  const NUM_H = 0.088;
  const BALL_R = 0.038;

  const pocketColor = (n) => (n === 0 ? 'green' : REDS.has(n) ? 'red' : 'black');
  const wheelIndex = (n) => {
    const i = WHEEL_POCKETS.indexOf(n);
    if (i < 0) throw new Error('Casilla inválida');
    return i;
  };
  const pocketCenter = (index) => (index + 0.5) * (TAU / POCKET_COUNT);
  const normalizeAngle = (a) => {
    let v = a % TAU;
    if (v < 0) v += TAU;
    return v;
  };
  const pocketIndexAt = (wheelAngle, ballAngle) => {
    const relative = normalizeAngle(ballAngle - wheelAngle);
    const sector = TAU / POCKET_COUNT;
    const raw = Math.round(relative / sector - 0.5);
    return ((raw % POCKET_COUNT) + POCKET_COUNT) % POCKET_COUNT;
  };
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const decay = (t, k) => (1 - Math.exp(-k * t)) / (1 - Math.exp(-k));
  const decayRate = (t, k) => (k * Math.exp(-k * t)) / (1 - Math.exp(-k));
  const hermite = (u, p0, p1, m0, m1) => {
    const u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * m1;
  };
  function wheelProgress(t, durationMs) {
    const total = WHEEL_TURNS * TAU;
    const endVel = END_DRIFT * (durationMs / 1000);
    const curved = total - endVel;
    return { angle: curved * decay(t, WHEEL_DECAY) + endVel * t, vel: curved * decayRate(t, WHEEL_DECAY) + endVel };
  }
  function cruiseBallAngle(u) { return -BALL_TURNS * TAU * decay(u, BALL_DECAY); }
  function cruiseBallRate(u) { return -BALL_TURNS * TAU * decayRate(u, BALL_DECAY); }

  function sampleSpin(pocket, elapsedMs, durationMs = SPIN_MS, dropAt = SPIN_DROP) {
    const index = wheelIndex(pocket);
    const duration = durationMs > 0 ? durationMs : SPIN_MS;
    const drop = Math.min(0.85, Math.max(0.25, dropAt));
    const t = clamp01(elapsedMs / duration);
    const wheel = wheelProgress(t, duration);
    const center = pocketCenter(index);
    if (t <= drop) {
      const u = drop === 0 ? 1 : t / drop;
      const wobble = u > 0.72 ? ((u - 0.72) / 0.28) ** 2 * 0.035 : 0;
      return { wheelAngle: wheel.angle, ballAngle: cruiseBallAngle(u), radial: 1 - wobble, hop: 0, settled: false, energy: 1 - u * 0.48 };
    }
    const span = 1 - drop;
    const u = (t - drop) / span;
    const cruiseEnd = cruiseBallAngle(1);
    const wheelEnd = wheelProgress(1, duration);
    let aim = wheelEnd.angle + center;
    while (aim > cruiseEnd - CATCH_TURNS * TAU) aim -= TAU;
    const m0 = (cruiseBallRate(1) / drop) * span;
    const m1 = wheelEnd.vel * span;
    const baseAngle = hermite(u, cruiseEnd, aim, m0, m1);
    const impact = Math.sin(Math.PI * u) * (1 - u) ** 1.6;
    const fretJostle = Math.sin(u * Math.PI * 6.5) * impact * 0.11;
    const radialSpiral = (1 - u) ** 1.85 * (1 - 0.035);
    const hopWave = Math.abs(Math.sin(u * Math.PI * 3.5)) * (1 - u) ** 1.75 * Math.sin(Math.PI * Math.min(1, u * 1.4));
    const radialBounce = hopWave * 0.09 * (u < 0.75 ? 1 : 0.35);
    return {
      wheelAngle: wheel.angle,
      ballAngle: baseAngle + fretJostle,
      radial: clamp01(radialSpiral + radialBounce),
      hop: hopWave * 0.14,
      settled: t >= 1,
      energy: (1 - u) ** 1.4 * 0.52 + hopWave * 0.2,
    };
  }
  function poseAt(pocket, elapsedMs, durationMs = SPIN_MS, dropAt = SPIN_DROP) {
    if (elapsedMs < durationMs) return sampleSpin(pocket, elapsedMs, durationMs, dropAt);
    const end = sampleSpin(pocket, durationMs, durationMs, dropAt);
    const drift = ((elapsedMs - durationMs) / 1000) * END_DRIFT;
    const wheelAngle = end.wheelAngle + drift;
    return { wheelAngle, ballAngle: wheelAngle + pocketCenter(wheelIndex(pocket)), radial: 0, hop: 0, settled: true, energy: 0.03 };
  }
  function bowlSurfaceY(radius) {
    if (radius <= POCKET_OUTER) return POCKET_Y + POCKET_H;
    if (radius <= NUM_OUTER) {
      const u = (radius - POCKET_OUTER) / (NUM_OUTER - POCKET_OUTER);
      return POCKET_Y + POCKET_H + u * (NUM_H - (POCKET_Y + POCKET_H));
    }
    const u = Math.min(1, (radius - NUM_OUTER) / (TRACK - NUM_OUTER));
    return NUM_H + u * (0.2 - NUM_H);
  }
  function idlePose(now) {
    const wheelAngle = (now / 1000) * 0.18;
    return { wheelAngle, ballAngle: -wheelAngle * 1.65, radial: 1, hop: 0, settled: false, energy: 0.07 };
  }

  function woodTexture() {
    const width = 512, height = 256;
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const image = ctx.createImageData(width, height);
    const data = image.data;
    for (let py = 0; py < height; py++) {
      const v = 1 - py / height;
      const r = 0.25 + (1 - v) * 1.6;
      const groove = Math.exp(-((v - 0.56) ** 2) / 0.008) * 0.42 + Math.exp(-((v - 0.82) ** 2) / 0.006) * 0.35;
      const crown = Math.exp(-((v - 0.22) ** 2) / 0.012) * 0.22;
      const shade = Math.max(0.32, Math.min(1.18, 0.92 - groove + crown));
      for (let px = 0; px < width; px++) {
        const theta = (px / width) * TAU;
        const wx = Math.cos(theta) * r, wz = Math.sin(theta) * r;
        const along = wx * 0.85 + wz * 0.52;
        const across = -wx * 0.52 + wz * 0.85;
        const ring = across * 14 + Math.sin(along * 3.2) * 1.8 + Math.sin(along * 7.5 + across * 4) * 0.55;
        const grain = 0.5 + 0.5 * Math.sin(ring);
        const pore = 0.5 + 0.5 * Math.sin(along * 38 + across * 9);
        const tone = (0.62 + grain * 0.32 - pore * 0.06) * shade;
        const o = (py * width + px) * 4;
        data[o] = Math.min(255, Math.round(138 * tone));
        data[o + 1] = Math.min(255, Math.round(54 * tone));
        data[o + 2] = Math.min(255, Math.round(24 * tone));
        data[o + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  function numberTexture(label) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.clearRect(0, 0, 128, 128);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = "800 96px Georgia, 'Times New Roman', serif";
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(8,5,3,0.55)';
    ctx.strokeText(label, 64, 70);
    ctx.fillStyle = '#fbf6ec';
    ctx.fillText(label, 64, 70);
    const texture = new THREE.CanvasTexture(canvas);
    if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  function boxSectorGeometry(index, r0, r1, y0, yInner, yOuter, gap = 0.008) {
    const sector = TAU / POCKET_COUNT;
    const a0 = index * sector + gap;
    const a1 = (index + 1) * sector - gap;
    const point = (angle, radius, y) => new THREE.Vector3(Math.sin(angle) * radius, y, Math.cos(angle) * radius);
    const verts = [
      point(a0, r0, y0), point(a1, r0, y0), point(a1, r1, y0), point(a0, r1, y0),
      point(a0, r0, yInner), point(a1, r0, yInner), point(a1, r1, yOuter), point(a0, r1, yOuter),
    ];
    const faces = [[4,6,5],[4,7,6],[0,2,1],[0,3,2],[7,6,2],[7,2,3],[4,0,1],[4,1,5],[4,7,3],[4,3,0],[5,1,2],[5,2,6]];
    const positions = [];
    for (const face of faces) for (const v of face) positions.push(verts[v].x, verts[v].y, verts[v].z);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    return geometry;
  }

  class KarmaWheel {
    constructor(canvas) {
      this.canvas = canvas;
      this.spin = null;
      this.restPocket = 0;
      this.onEnd = null;
      this.alive = true;
      this._announced = false;
      this._seenStart = 0;
      this._spinBase = 0;
      this._restBase = 0;
      this._restSince = 0;
      this._lastBallAngle = 0;
      this._rollAxis = new THREE.Vector3();
      this._bin = [];
      this._keep = (item) => { this._bin.push(item); return item; };
      try {
        this._mount();
        requestAnimationFrame(() => this._resize?.());
      } catch (err) {
        console.error('No se pudo montar la rueda 3D de KARMA:', err);
        throw err;
      }
    }

    _mount() {
      const canvas = this.canvas;
      const parent = canvas.parentElement || canvas;
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      if (renderer.outputColorSpace !== undefined && THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
      if (THREE.ACESFilmicToneMapping) {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.16;
      }
      renderer.shadowMap.enabled = true;
      if (THREE.PCFShadowMap) renderer.shadowMap.type = THREE.PCFShadowMap;
      this.renderer = renderer;

      const scene = new THREE.Scene();
      this.scene = scene;
      const camera = new THREE.PerspectiveCamera(32, 1, 0.08, 40);
      this.camera = camera;
      this._look = new THREE.Vector3(0, 0.05, 0);
      this._camOrbit = -0.32;
      this._camPitch = 0.50;
      /* Más cerca = números del aro más legibles en móvil */
      this._camSubject = 1.52;

      scene.add(new THREE.AmbientLight(0xfff3e2, 0.42));
      scene.add(new THREE.HemisphereLight(0xfff1d4, 0x1b120c, 0.65));
      const key = new THREE.SpotLight(0xfff3df, 32, 18, 0.46, 0.5, 1);
      key.position.set(2.1, 6.2, 2.9);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xfff0dc, 0.72);
      fill.position.set(-3.8, 3.6, 1.6);
      scene.add(fill);
      const rim = new THREE.DirectionalLight(0xffd7a2, 1.25);
      rim.position.set(-1.2, 4.2, -3.8);
      scene.add(rim);
      const pocketLight = new THREE.SpotLight(0xffe7bf, 0, 5, 0.42, 0.55, 1);
      const pocketTarget = new THREE.Object3D();
      pocketLight.target = pocketTarget;
      scene.add(pocketLight, pocketTarget);
      this._pocketLight = pocketLight;
      this._pocketTarget = pocketTarget;

      const woodMap = woodTexture();
      if (woodMap) this._keep(woodMap);
      const wood = new THREE.MeshPhysicalMaterial({
        color: woodMap ? 0xffffff : 0x6b361b,
        map: woodMap,
        roughness: 0.28, metalness: 0.04, clearcoat: 0.85, clearcoatRoughness: 0.14,
      });
      const coneWood = new THREE.MeshPhysicalMaterial({
        color: woodMap ? 0xf3d7c0 : 0x7c3f20,
        map: woodMap,
        roughness: 0.24, metalness: 0.05, clearcoat: 0.9, clearcoatRoughness: 0.12,
      });
      const gold = new THREE.MeshPhysicalMaterial({ color: 0xd9b166, roughness: 0.24, metalness: 0.94, clearcoat: 0.4, clearcoatRoughness: 0.16 });
      const darkMetal = new THREE.MeshPhysicalMaterial({ color: 0x1d1a17, roughness: 0.36, metalness: 0.85 });
      const silver = new THREE.MeshPhysicalMaterial({ color: 0xd8dce2, roughness: 0.2, metalness: 0.95, clearcoat: 0.3 });
      this._keep(wood); this._keep(coneWood); this._keep(gold); this._keep(darkMetal); this._keep(silver);

      const tableShadow = new THREE.Mesh(
        this._keep(new THREE.RingGeometry(1.74, 1.98, 96)),
        this._keep(new THREE.MeshBasicMaterial({ color: 0x05110b, transparent: true, opacity: 0.42, depthWrite: false })),
      );
      tableShadow.rotation.x = -Math.PI / 2;
      tableShadow.position.y = -0.028;
      scene.add(tableShadow);

      const bowl = new THREE.Mesh(
        this._keep(new THREE.LatheGeometry([
          new THREE.Vector2(1.82, -0.03), new THREE.Vector2(1.86, 0.36), new THREE.Vector2(1.83, 0.48),
          new THREE.Vector2(1.76, 0.51), new THREE.Vector2(1.68, 0.47), new THREE.Vector2(1.62, 0.36),
          new THREE.Vector2(1.56, 0.25), new THREE.Vector2(1.52, 0.205), new THREE.Vector2(1.46, 0.195),
          new THREE.Vector2(1.4, 0.16), new THREE.Vector2(1.3, 0.105), new THREE.Vector2(1.21, 0.065),
          new THREE.Vector2(1.2, -0.04), new THREE.Vector2(0.01, -0.04),
        ], 96)),
        wood,
      );
      bowl.castShadow = true; bowl.receiveShadow = true; scene.add(bowl);

      const outerBrass = new THREE.Mesh(this._keep(new THREE.TorusGeometry(1.83, 0.016, 12, 96)), gold);
      outerBrass.rotation.x = Math.PI / 2; outerBrass.position.y = 0.47; scene.add(outerBrass);
      const innerLip = new THREE.Mesh(this._keep(new THREE.TorusGeometry(1.56, 0.012, 12, 96)), gold);
      innerLip.rotation.x = Math.PI / 2; innerLip.position.y = 0.255; scene.add(innerLip);
      const wellRim = new THREE.Mesh(this._keep(new THREE.TorusGeometry(1.215, 0.012, 12, 96)), silver);
      wellRim.rotation.x = Math.PI / 2; wellRim.position.y = 0.09; scene.add(wellRim);

      const diamondGeo = this._keep(new THREE.OctahedronGeometry(0.052, 0));
      diamondGeo.scale(1.55, 0.32, 0.52);
      for (let i = 0; i < 8; i++) {
        const diamond = new THREE.Mesh(diamondGeo, gold);
        const angle = i * (TAU / 8) + 0.18;
        const vertical = i % 2 === 0;
        diamond.position.set(Math.sin(angle) * 1.35, 0.142, Math.cos(angle) * 1.35);
        diamond.rotation.order = 'YXZ';
        diamond.rotation.y = angle + (vertical ? Math.PI / 2 : 0);
        diamond.rotation.x = vertical ? -0.36 : 0;
        diamond.rotation.z = vertical ? 0 : 0.36;
        diamond.castShadow = true;
        scene.add(diamond);
      }

      const wheel = new THREE.Group();
      scene.add(wheel);
      this.wheel = wheel;

      const rotorBase = new THREE.Mesh(this._keep(new THREE.CylinderGeometry(1.21, 1.21, 0.05, 96)), darkMetal);
      rotorBase.position.y = 0.018; rotorBase.receiveShadow = true; wheel.add(rotorBase);

      const cone = new THREE.Mesh(
        this._keep(new THREE.LatheGeometry([
          new THREE.Vector2(0.76, 0.04), new THREE.Vector2(0.755, 0.072), new THREE.Vector2(0.64, 0.082),
          new THREE.Vector2(0.44, 0.115), new THREE.Vector2(0.24, 0.165), new THREE.Vector2(0.11, 0.205), new THREE.Vector2(0.01, 0.21),
        ], 72)),
        coneWood,
      );
      cone.castShadow = true; cone.receiveShadow = true; wheel.add(cone);

      for (const radius of [0.755, 0.52, 0.22]) {
        const ring = new THREE.Mesh(this._keep(new THREE.TorusGeometry(radius, 0.009, 10, 64)), gold);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = radius > 0.7 ? 0.074 : radius > 0.4 ? 0.102 : 0.172;
        wheel.add(ring);
      }

      const pillar = new THREE.Mesh(
        this._keep(new THREE.LatheGeometry([
          new THREE.Vector2(0.11, 0.195), new THREE.Vector2(0.095, 0.215), new THREE.Vector2(0.05, 0.25),
          new THREE.Vector2(0.062, 0.31), new THREE.Vector2(0.036, 0.36), new THREE.Vector2(0.055, 0.405), new THREE.Vector2(0.001, 0.42),
        ], 36)),
        gold,
      );
      pillar.castShadow = true; wheel.add(pillar);

      const armGeo = this._keep(new THREE.CylinderGeometry(0.014, 0.022, 0.34, 16));
      armGeo.rotateZ(Math.PI / 2);
      const tipGeo = this._keep(new THREE.SphereGeometry(0.032, 16, 12));
      for (let i = 0; i < 4; i++) {
        const branch = new THREE.Group();
        branch.rotation.y = i * (Math.PI / 2);
        const arm = new THREE.Mesh(armGeo, gold);
        arm.position.set(0.19, 0.285, 0); arm.castShadow = true; branch.add(arm);
        const tip = new THREE.Mesh(tipGeo, gold);
        tip.position.set(0.37, 0.285, 0); tip.castShadow = true; branch.add(tip);
        wheel.add(branch);
      }

      const palette = { red: new THREE.Color('#a31c13'), black: new THREE.Color('#100f0d'), green: new THREE.Color('#147a38') };
      this._pocketMaterials = new Map();
      this._pocketBases = new Map();
      const numberSlope = Math.atan2(NUM_H - (POCKET_Y + POCKET_H), NUM_OUTER - POCKET_OUTER);

      WHEEL_POCKETS.forEach((pocket, index) => {
        const base = palette[pocketColor(pocket)].clone();
        this._pocketBases.set(pocket, base);
        const material = new THREE.MeshLambertMaterial({
          color: base, emissive: base,
          emissiveIntensity: pocketColor(pocket) === 'black' ? 0.05 : 0.35,
        });
        this._keep(material);
        this._pocketMaterials.set(pocket, material);

        const floor = new THREE.Mesh(
          this._keep(boxSectorGeometry(index, POCKET_INNER, POCKET_OUTER, POCKET_Y, POCKET_Y + POCKET_H, POCKET_Y + POCKET_H, 0.008)),
          material,
        );
        floor.receiveShadow = true; wheel.add(floor);

        const numBand = new THREE.Mesh(
          this._keep(boxSectorGeometry(index, POCKET_OUTER, NUM_OUTER, POCKET_Y, POCKET_Y + POCKET_H + 0.004, NUM_H, 0.004)),
          material,
        );
        numBand.receiveShadow = true; wheel.add(numBand);

        const texture = numberTexture(String(pocket));
        if (texture) {
          this._keep(texture);
          const plane = new THREE.Mesh(
            this._keep(new THREE.PlaneGeometry(0.148, 0.118)),
            this._keep(new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide })),
          );
          plane.renderOrder = 3;
          const angle = pocketCenter(index);
          const radius = (POCKET_OUTER + NUM_OUTER) * 0.5;
          const y = (POCKET_Y + POCKET_H + NUM_H) * 0.5 + 0.008;
          const outward = new THREE.Vector3(Math.sin(angle) * Math.cos(numberSlope), Math.sin(numberSlope), Math.cos(angle) * Math.cos(numberSlope)).normalize();
          const right = new THREE.Vector3(-Math.cos(angle), 0, Math.sin(angle));
          const normal = new THREE.Vector3().crossVectors(right, outward).normalize();
          plane.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, outward, normal));
          plane.position.set(Math.sin(angle) * radius, y, Math.cos(angle) * radius);
          wheel.add(plane);
        }

        const fretAngle = index * (TAU / POCKET_COUNT);
        const pocketFret = new THREE.Mesh(this._keep(new THREE.BoxGeometry(0.012, 0.036, POCKET_OUTER - POCKET_INNER)), silver);
        const pocketMid = (POCKET_INNER + POCKET_OUTER) * 0.5;
        pocketFret.position.set(Math.sin(fretAngle) * pocketMid, POCKET_Y + POCKET_H + 0.012, Math.cos(fretAngle) * pocketMid);
        pocketFret.rotation.y = fretAngle; pocketFret.castShadow = true; wheel.add(pocketFret);
      });

      const dividerRing = new THREE.Mesh(this._keep(new THREE.TorusGeometry(POCKET_OUTER, 0.008, 10, 96)), silver);
      dividerRing.rotation.x = Math.PI / 2;
      dividerRing.position.y = POCKET_Y + POCKET_H + 0.008;
      wheel.add(dividerRing);

      const ball = new THREE.Mesh(
        this._keep(new THREE.SphereGeometry(BALL_R, 32, 24)),
        this._keep(new THREE.MeshPhysicalMaterial({ color: 0xfbf8f0, roughness: 0.1, metalness: 0.03, clearcoat: 1, clearcoatRoughness: 0.06 })),
      );
      ball.castShadow = true; scene.add(ball); this.ball = ball;

      const shadow = new THREE.Mesh(
        this._keep(new THREE.CircleGeometry(0.05, 24)),
        this._keep(new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false })),
      );
      shadow.rotation.x = -Math.PI / 2; scene.add(shadow); this.shadow = shadow;

      this._resize = () => {
        const width = parent.clientWidth || 640;
        const height = parent.clientHeight || 360;
        renderer.setSize(width, height, false);
        camera.aspect = width / Math.max(1, height);
        camera.updateProjectionMatrix();
        this._placeCamera();
      };
      this._resize();
      this._observer = new ResizeObserver(this._resize);
      this._observer.observe(parent);
      this._loop = this._loop.bind(this);
      this._raf = requestAnimationFrame(this._loop);
    }

    _placeCamera() {
      const camera = this.camera;
      const aspect = Math.max(0.35, camera.aspect);
      const vertical = THREE.MathUtils.degToRad(camera.fov * 0.5);
      const horizontal = Math.atan(Math.tan(vertical) * aspect);
      const dist = (this._camSubject * 1.12) / Math.min(Math.sin(vertical), Math.sin(horizontal));
      const look = this._look;
      camera.position.set(
        look.x + Math.sin(this._camOrbit) * Math.sin(this._camPitch) * dist,
        look.y + Math.cos(this._camPitch) * dist,
        look.z + Math.cos(this._camOrbit) * Math.sin(this._camPitch) * dist,
      );
      camera.lookAt(look);
    }

    start(pocket, onEnd) {
      if (!Number.isInteger(pocket) || pocket < 0 || pocket > 36 || this.spin) return false;
      this.spin = { pocket, startedAt: Date.now(), durationMs: SPIN_MS, dropAt: SPIN_DROP };
      this.onEnd = onEnd;
      this._announced = false;
      this._seenStart = 0;
      return true;
    }

    _loop() {
      if (!this.alive) return;
      this._raf = requestAnimationFrame(this._loop);
      const now = Date.now();
      let pose;
      let glow = null;
      const current = this.spin;

      if (current) {
        const elapsed = now - current.startedAt;
        if (current.startedAt !== this._seenStart) {
          this._seenStart = current.startedAt;
          this._spinBase = (((current.startedAt * 2654435761) >>> 0) / 4294967296) * TAU;
          this._announced = false;
        }
        const raw = poseAt(current.pocket, elapsed, current.durationMs, current.dropAt);
        pose = { ...raw, wheelAngle: raw.wheelAngle + this._spinBase, ballAngle: raw.ballAngle + this._spinBase };
        this._restBase = pose.wheelAngle;
        this._restSince = now;
        if (pose.settled && !this._announced) {
          this._announced = true;
          this.restPocket = current.pocket;
          const cb = this.onEnd;
          this.onEnd = null;
          this.spin = null;
          queueMicrotask(() => cb?.(current.pocket));
        }
        glow = pose.settled ? current.pocket : null;
      } else if (this.restPocket != null) {
        if (!this._restSince) this._restSince = now;
        const wheelAngle = this._restBase + ((now - this._restSince) / 1000) * 0.08;
        pose = {
          wheelAngle,
          ballAngle: wheelAngle + pocketCenter(wheelIndex(this.restPocket)),
          radial: 0, hop: 0, settled: true, energy: 0.02,
        };
        glow = this.restPocket;
      } else {
        pose = idlePose(now);
      }

      this.wheel.rotation.y = pose.wheelAngle;
      const radius = NEST + (TRACK - NEST) * pose.radial;
      const surfaceY = bowlSurfaceY(radius);
      const y = surfaceY + BALL_R * 0.88 + pose.hop * 0.65;
      this.ball.position.set(Math.sin(pose.ballAngle) * radius, y, Math.cos(pose.ballAngle) * radius);
      const dAngle = pose.ballAngle - this._lastBallAngle;
      this._lastBallAngle = pose.ballAngle;
      if (Math.abs(dAngle) < 1.2) {
        this._rollAxis.set(Math.cos(pose.ballAngle), 0, -Math.sin(pose.ballAngle));
        this.ball.rotateOnWorldAxis(this._rollAxis, (dAngle * radius) / BALL_R);
      }
      this.shadow.position.set(this.ball.position.x, surfaceY + 0.004, this.ball.position.z);
      this.shadow.scale.setScalar(1 + pose.hop * 1.4);
      this.shadow.material.opacity = Math.max(0.12, 0.46 - pose.hop * 1.1);

      const showPocket = glow != null;
      this._pocketLight.intensity = showPocket ? 4 : 0;
      if (showPocket) {
        const angle = pose.ballAngle;
        this._pocketTarget.position.set(Math.sin(angle) * 0.96, 0.1, Math.cos(angle) * 0.96);
        this._pocketLight.position.set(Math.sin(angle) * 0.2, 2.3, Math.cos(angle) * 0.2);
      }
      for (const [pocket, material] of this._pocketMaterials) {
        const base = this._pocketBases.get(pocket);
        if (!base) continue;
        const on = glow === pocket;
        material.color.copy(base);
        material.emissiveIntensity = on ? 0.55 : pocketColor(pocket) === 'black' ? 0.05 : 0.35;
      }
      this.renderer.render(this.scene, this.camera);
    }

    destroy() {
      this.alive = false;
      cancelAnimationFrame(this._raf);
      this._observer?.disconnect();
      for (const item of this._bin) {
        try { item.dispose?.(); } catch {}
      }
      this.renderer?.dispose();
    }
  }

  const api = {
    KarmaWheel,
    POCKETS: WHEEL_POCKETS,
    REDS,
    color: pocketColor,
    spinPose: poseAt,
    sampleSpin,
    SPIN_MS,
    mode: 'three',
  };
  window.__KarmaWheel3D = api;
  window.CasinoKarmaWheel = api;
})();
