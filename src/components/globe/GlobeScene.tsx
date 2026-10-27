import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  RingGeometry,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Vector3,
} from "three";
import { PLACES } from "@/data/places";
import {
  FOCUS_RADIUS,
  HOME_PHI,
  HOME_RADIUS,
  HOME_THETA,
  PHI_MAX,
  PHI_MIN,
  SPIN,
  clamp,
  dampAngle,
  latLonToVector,
  shortestAngle,
} from "@/components/globe/math";
import { useGlobe } from "@/components/globe/store";
import {
  createCloudTexture,
  createEarthTextures,
  createGlowTexture,
} from "@/components/globe/textures";

const ATMO_VERT = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMO_FRAG = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    float intensity = pow(clamp(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 2.5);
    vec3 color = vec3(0.56, 0.70, 0.84);
    gl_FragColor = vec4(color, 1.0) * intensity;
  }
`;

const MARKER_R = 1.028;
const DRAG_SENS = 0.0048;
const _pos = new Vector3();
const _z = new Vector3(0, 0, 1);
const _y = new Vector3(0, 1, 0);
const _up = new Vector3(0, 1, 0);

type MarkerLayout = {
  id: string;
  position: Vector3;
  ring: Quaternion;
  beacon: Quaternion;
  beaconPos: Vector3;
};

function useMarkers() {
  return useMemo<MarkerLayout[]>(() => {
    return PLACES.map((place) => {
      const position = latLonToVector(place.lat, place.lon, MARKER_R, new Vector3());
      const normal = position.clone().normalize();
      return {
        id: place.id,
        position,
        ring: new Quaternion().setFromUnitVectors(_z, normal),
        beacon: new Quaternion().setFromUnitVectors(_y, normal),
        beaconPos: normal.clone().multiplyScalar(0.07),
      };
    });
  }, []);
}

function Stars() {
  const geometry = useMemo(() => {
    const count = 480;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const u = Math.random() * 2 - 1;
      const c = Math.sqrt(1 - u * u);
      const radius = 28 + Math.random() * 36;
      positions[i * 3] = c * Math.cos(theta) * radius;
      positions[i * 3 + 1] = u * radius;
      positions[i * 3 + 2] = c * Math.sin(theta) * radius;
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(positions, 3));
    return geo;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        color="#d7dee8"
        size={0.14}
        sizeAttenuation
        transparent
        opacity={0.72}
        depthWrite={false}
      />
    </points>
  );
}

function Earth() {
  const textures = useMemo(() => createEarthTextures(), []);
  const clouds = useMemo(() => createCloudTexture(), []);
  const cloudRef = useRef<Mesh>(null);

  useEffect(
    () => () => {
      textures.map.dispose();
      textures.roughness.dispose();
      clouds.dispose();
    },
    [textures, clouds],
  );

  useFrame((_, delta) => {
    const mesh = cloudRef.current;
    if (!mesh) return;
    mesh.rotation.y += Math.min(delta, 0.1) * 0.012;
  });

  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 96, 64]} />
        <meshStandardMaterial
          map={textures.map}
          roughnessMap={textures.roughness}
          roughness={0.78}
          metalness={0.03}
          emissive="#102033"
          emissiveIntensity={0.22}
        />
      </mesh>
      <mesh ref={cloudRef}>
        <sphereGeometry args={[1.014, 80, 48]} />
        <meshLambertMaterial
          map={clouds}
          transparent
          opacity={0.22}
          depthWrite={false}
          color="#f7f9fb"
        />
      </mesh>
      <mesh scale={1.16}>
        <sphereGeometry args={[1, 64, 48]} />
        <shaderMaterial
          vertexShader={ATMO_VERT}
          fragmentShader={ATMO_FRAG}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          side={BackSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function Markers() {
  const layouts = useMarkers();
  const assets = useMemo(() => {
    const glow = createGlowTexture();
    return {
      glow,
      core: new SphereGeometry(0.018, 20, 20),
      ring: new RingGeometry(0.028, 0.04, 40),
      hit: new SphereGeometry(0.06, 10, 10),
      beacon: new CylinderGeometry(0.0014, 0.0014, 0.1, 5),
      coreMat: new MeshBasicMaterial({ color: new Color("#f5f8fc") }),
      ringMat: new MeshBasicMaterial({
        color: new Color("#e6eef6"),
        transparent: true,
        opacity: 0.92,
        side: DoubleSide,
        depthWrite: false,
      }),
      hitMat: new MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
      spriteMat: new SpriteMaterial({
        map: glow,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        opacity: 0.9,
        toneMapped: false,
      }),
      beaconMat: new MeshBasicMaterial({
        color: new Color("#f5f8fc"),
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      }),
    };
  }, []);

  useEffect(
    () => () => {
      assets.glow.dispose();
      assets.core.dispose();
      assets.ring.dispose();
      assets.hit.dispose();
      assets.beacon.dispose();
      assets.coreMat.dispose();
      assets.ringMat.dispose();
      assets.hitMat.dispose();
      assets.spriteMat.dispose();
      assets.beaconMat.dispose();
    },
    [assets],
  );

  const rings = useRef<(Mesh | null)[]>([]);
  const sprites = useRef<(Sprite | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const selected = useGlobe.getState().selectedId;
    const hovered = useGlobe.getState().hoveredId;
    for (let i = 0; i < layouts.length; i++) {
      const hot = layouts[i].id === selected || layouts[i].id === hovered;
      const pulse = 1 + Math.sin(t * 1.7 + i * 0.6) * (hot ? 0.08 : 0.045);
      const ring = rings.current[i];
      const sprite = sprites.current[i];
      if (ring) ring.scale.setScalar(pulse);
      if (sprite) sprite.scale.setScalar((hot ? 0.34 : 0.22) * pulse);
    }
  });

  const gl = useThree((s) => s.gl);

  return (
    <group>
      {layouts.map((layout, index) => (
        <Marker
          key={layout.id}
          layout={layout}
          index={index}
          assets={assets}
          rings={rings}
          sprites={sprites}
          dom={gl.domElement}
        />
      ))}
    </group>
  );
}

function Marker({
  layout,
  index,
  assets,
  rings,
  sprites,
  dom,
}: {
  layout: MarkerLayout;
  index: number;
  assets: {
    core: SphereGeometry;
    ring: RingGeometry;
    hit: SphereGeometry;
    beacon: CylinderGeometry;
    coreMat: MeshBasicMaterial;
    ringMat: MeshBasicMaterial;
    hitMat: MeshBasicMaterial;
    spriteMat: SpriteMaterial;
    beaconMat: MeshBasicMaterial;
  };
  rings: RefObject<(Mesh | null)[]>;
  sprites: RefObject<(Sprite | null)[]>;
  dom: HTMLElement;
}) {
  const selected = useGlobe((s) => s.selectedId === layout.id);
  const hovered = useGlobe((s) => s.hoveredId === layout.id);
  const hot = selected || hovered;

  return (
    <group position={layout.position} scale={hot ? 1.28 : 1}>
      <mesh geometry={assets.core} material={assets.coreMat} />
      <mesh
        ref={(node) => {
          rings.current[index] = node;
        }}
        geometry={assets.ring}
        material={assets.ringMat}
        quaternion={layout.ring}
      />
      <sprite
        ref={(node) => {
          sprites.current[index] = node;
        }}
        material={assets.spriteMat}
      />
      {selected ? (
        <mesh
          geometry={assets.beacon}
          material={assets.beaconMat}
          quaternion={layout.beacon}
          position={layout.beaconPos}
        />
      ) : null}
      <mesh
        geometry={assets.hit}
        material={assets.hitMat}
        onClick={(event) => {
          event.stopPropagation();
          useGlobe.getState().select(layout.id);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          useGlobe.getState().hover(layout.id);
          dom.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          if (useGlobe.getState().hoveredId === layout.id) useGlobe.getState().hover(null);
          dom.style.cursor = "grab";
        }}
      />
    </group>
  );
}

function Lights() {
  const sun = useRef<DirectionalLight>(null);
  const fill = useRef<DirectionalLight>(null);
  const { camera } = useThree();
  const zAxis = useMemo(() => new Vector3(), []);
  const xAxis = useMemo(() => new Vector3(), []);
  const yAxis = useMemo(() => new Vector3(), []);
  const sunPos = useMemo(() => new Vector3(), []);
  const fillPos = useMemo(() => new Vector3(), []);

  useFrame(() => {
    zAxis.copy(camera.position).normalize();
    xAxis.crossVectors(_up, zAxis);
    if (xAxis.lengthSq() < 1e-6) xAxis.set(1, 0, 0);
    xAxis.normalize();
    yAxis.crossVectors(zAxis, xAxis);
    sunPos.copy(camera.position).addScaledVector(xAxis, 2.8).addScaledVector(yAxis, 1.7);
    fillPos.copy(camera.position).addScaledVector(xAxis, -2.4).addScaledVector(yAxis, -0.35);
    sun.current?.position.copy(sunPos);
    fill.current?.position.copy(fillPos);
  });

  return (
    <>
      <ambientLight intensity={0.48} color="#d5deea" />
      <hemisphereLight args={["#e4eaf2", "#241c16", 0.55]} />
      <directionalLight ref={sun} intensity={1.15} color="#fff6ec" />
      <directionalLight ref={fill} intensity={0.42} color="#d5e0ec" />
    </>
  );
}

function Rig() {
  const { camera, gl } = useThree();
  const target = useRef({ theta: HOME_THETA, phi: HOME_PHI, radius: HOME_RADIUS });
  const current = useRef({ theta: HOME_THETA, phi: HOME_PHI, radius: HOME_RADIUS });
  const inertia = useRef({ theta: 0, phi: 0 });
  const dragging = useRef(false);
  const moved = useRef(0);
  const last = useRef({ x: 0, y: 0, t: 0, dx: 0, dy: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<number | null>(null);
  const idleUntil = useRef(0);
  const seenFocus = useRef(0);
  const seenReset = useRef(0);
  const reduce = useRef(false);
  const look = useMemo(() => new Vector3(), []);
  const zAxis = useMemo(() => new Vector3(), []);
  const xAxis = useMemo(() => new Vector3(), []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduce.current = media.matches;
    const onChange = () => {
      reduce.current = media.matches;
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = gl.domElement;
    el.style.cursor = "grab";

    const pinchDistance = () => {
      const pts = [...pointers.current.values()];
      if (pts.length < 2) return null;
      return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    };

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.current.size >= 2) {
        pinch.current = pinchDistance();
        dragging.current = false;
        return;
      }
      dragging.current = true;
      moved.current = 0;
      last.current = { x: event.clientX, y: event.clientY, t: performance.now(), dx: 0, dy: 0 };
      inertia.current.theta = 0;
      inertia.current.phi = 0;
      if (useGlobe.getState().mode !== "held") useGlobe.getState().setMode("paused");
      el.setPointerCapture(event.pointerId);
      el.style.cursor = "grabbing";
    };

    const onMove = (event: PointerEvent) => {
      if (!pointers.current.has(event.pointerId) && !dragging.current) return;
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.current.size >= 2) {
        const dist = pinchDistance();
        if (dist && pinch.current) {
          const ratio = pinch.current / dist;
          target.current.radius = clamp(target.current.radius * ratio, 1.68, 6.4);
          pinch.current = dist;
        }
        return;
      }
      if (!dragging.current) return;
      const dx = event.clientX - last.current.x;
      const dy = event.clientY - last.current.y;
      last.current = { x: event.clientX, y: event.clientY, t: performance.now(), dx, dy };
      moved.current += Math.abs(dx) + Math.abs(dy);
      target.current.theta -= dx * DRAG_SENS;
      target.current.phi = clamp(target.current.phi - dy * DRAG_SENS, PHI_MIN, PHI_MAX);
      if (moved.current > 8 && useGlobe.getState().mode === "held") {
        useGlobe.setState({ mode: "paused", selectedId: null });
      }
    };

    const onUp = (event: PointerEvent) => {
      pointers.current.delete(event.pointerId);
      if (pointers.current.size < 2) pinch.current = null;
      if (pointers.current.size > 0) return;
      const wasDrag = moved.current > 8;
      dragging.current = false;
      el.style.cursor = useGlobe.getState().hoveredId ? "pointer" : "grab";
      if (!wasDrag || reduce.current) {
        inertia.current.theta = 0;
        inertia.current.phi = 0;
      } else if (performance.now() - last.current.t < 48) {
        inertia.current.theta = clamp((-last.current.dx * DRAG_SENS) / 0.016, -1.5, 1.5);
        inertia.current.phi = clamp((-last.current.dy * DRAG_SENS) / 0.016, -1.2, 1.2);
      }
      if (useGlobe.getState().mode === "paused") idleUntil.current = performance.now() + 2800;
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      target.current.radius = clamp(
        target.current.radius * Math.exp(event.deltaY * 0.0011),
        1.68,
        6.4,
      );
      if (useGlobe.getState().mode === "drift") {
        useGlobe.getState().setMode("paused");
        idleUntil.current = performance.now() + 2800;
      }
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, [gl]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const state = useGlobe.getState();

    if (state.focusNonce !== seenFocus.current) {
      seenFocus.current = state.focusNonce;
      const place = PLACES.find((item) => item.id === state.selectedId);
      if (place) {
        latLonToVector(place.lat, place.lon, 1, _pos);
        const phi = Math.acos(clamp(_pos.y, -1, 1));
        const theta = Math.atan2(_pos.x, _pos.z);
        target.current.phi = clamp(phi, PHI_MIN, PHI_MAX);
        target.current.theta = shortestAngle(current.current.theta, theta);
        target.current.radius = FOCUS_RADIUS;
        inertia.current.theta = 0;
        inertia.current.phi = 0;
      }
    }

    if (state.resetNonce !== seenReset.current) {
      seenReset.current = state.resetNonce;
      target.current.phi = HOME_PHI;
      target.current.radius = HOME_RADIUS;
      target.current.theta = shortestAngle(current.current.theta, HOME_THETA);
      inertia.current.theta = 0;
      inertia.current.phi = 0;
      idleUntil.current = 0;
    }

    const now = performance.now();
    if (!dragging.current && state.mode === "paused" && now > idleUntil.current) {
      useGlobe.getState().setMode("drift");
    }

    const spinning =
      useGlobe.getState().mode === "drift" &&
      !dragging.current &&
      now > idleUntil.current &&
      !reduce.current;

    if (!dragging.current) {
      if (Math.abs(inertia.current.theta) > 0.0008 || Math.abs(inertia.current.phi) > 0.0008) {
        target.current.theta += inertia.current.theta * delta;
        target.current.phi = clamp(
          target.current.phi + inertia.current.phi * delta,
          PHI_MIN,
          PHI_MAX,
        );
        const decay = Math.exp(-3.1 * delta);
        inertia.current.theta *= decay;
        inertia.current.phi *= decay;
      } else {
        inertia.current.theta = 0;
        inertia.current.phi = 0;
      }
    }

    if (spinning) target.current.theta += SPIN * delta;

    if (dragging.current || pinch.current) {
      current.current.theta = target.current.theta;
      current.current.phi = target.current.phi;
      current.current.radius = target.current.radius;
    } else {
      const speed = reduce.current ? 16 : 3.5;
      const lambda = 1 - Math.exp(-speed * delta);
      current.current.theta = dampAngle(current.current.theta, target.current.theta, lambda);
      current.current.phi += (target.current.phi - current.current.phi) * lambda;
      current.current.radius += (target.current.radius - current.current.radius) * lambda;
    }

    const { theta, phi, radius } = current.current;
    const sinPhi = Math.sin(phi);
    camera.position.set(
      sinPhi * Math.sin(theta) * radius,
      Math.cos(phi) * radius,
      sinPhi * Math.cos(theta) * radius,
    );

    zAxis.copy(camera.position).normalize();
    xAxis.crossVectors(_up, zAxis);
    if (xAxis.lengthSq() < 1e-6) xAxis.set(1, 0, 0);
    else xAxis.normalize();
    const wide = gl.domElement.clientWidth >= 840;
    const shift = (wide ? 0.46 : 0) * (radius / HOME_RADIUS);
    const lift = (wide ? 0 : 0.34) * (radius / HOME_RADIUS);
    look.copy(xAxis).multiplyScalar(shift);
    look.y -= lift;
    camera.lookAt(look);
  });

  return null;
}

function Scene({ onReady }: { onReady: () => void }) {
  const sent = useRef(false);
  useFrame(() => {
    if (sent.current) return;
    sent.current = true;
    onReady();
  });

  return (
    <>
      <Rig />
      <color attach="background" args={["#07080c"]} />
      <Stars />
      <Lights />
      <Earth />
      <Markers />
    </>
  );
}

export function GlobeScene({ onReady }: { onReady: () => void }) {
  return (
    <Canvas
      className="globe-canvas h-full w-full"
      dpr={[1, 1.6]}
      camera={{ fov: 38, near: 0.08, far: 180, position: [0.45, 1.1, 2.7] }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance", stencil: false }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <Scene onReady={onReady} />
    </Canvas>
  );
}
