import * as THREE from "three";
import React, { useState, useEffect } from "react";
import { Canvas } from "react-three-fiber";
import { Physics, usePlane, useBox } from "use-cannon";
import * as CANNON from "cannon";

import "./App.css";

const diceProperty = {}; //global variable improper but works
function BoundPlanes({ ...props }) {
  const [ref] = usePlane(() => ({ ...props }));
  const material = new THREE.MeshPhongMaterial({
    opacity: 0, // change to one for visible plane
    transparent: true,
  });
  return (
    <mesh ref={ref} receiveShadow material={material}>
      <planeBufferGeometry attach="geometry" args={[120, 120]} />
    </mesh>
  );
}

function Floor(props) {
  const [ref] = usePlane(() => ({ ...props }));

  return (
    <mesh ref={ref} receiveShadow>
      <planeBufferGeometry attach="geometry" args={[1000, 1000]} />
      <meshPhongMaterial
        attach="material"
        color={0x65ff05} //complementary  with red?
      />
    </mesh>
  );
}

function Dice({ pos, velocity, angle, axis, setInstructionMessage }) {
  const [ref, api] = useBox(() => ({
    mass: 30,
    args: [10, 10, 10],
    position: [pos.x, pos.y, pos.z],
    angularVelocity: [angle.x, angle.y, angle.z],
    velocity: [velocity.x, velocity.y, velocity.z],
    rotation: [axis.x, axis.y, axis.z],
  }));
  const loader = new THREE.TextureLoader();
  //load dice face images
  const materials = [
    new THREE.MeshBasicMaterial({
      map: loader.load("images/120px-Dicey-1x.png"),
    }),
    new THREE.MeshBasicMaterial({
      map: loader.load("images/120px-Dicey-2x.png"),
    }),
    new THREE.MeshBasicMaterial({
      map: loader.load("images/120px-Dicey-3x.png"),
    }),
    new THREE.MeshBasicMaterial({
      map: loader.load("images/120px-Dicey-4x.png"),
    }),
    new THREE.MeshBasicMaterial({
      map: loader.load("images/120px-Dicey-5x.png"),
    }),
    new THREE.MeshBasicMaterial({
      map: loader.load("images/120px-Dicey-6x.png"),
    }),
  ];
  useEffect(
    () =>
      api.velocity.subscribe((v) =>
        Math.abs(v[0]) < 0.01 && Math.abs(v[1]) < 0.01 && Math.abs(v[2]) < 0.01
          ? setInstructionMessage(true)
          : setInstructionMessage(false)
      ),
    [api.velocity, setInstructionMessage, velocity]
  );

  return (
    <mesh ref={ref} material={materials} castShadow>
      <boxGeometry args={[10, 10, 10]} attach="geometry" receiveShadow />
    </mesh>
  );
}

function App() {
  const physicsMaterial = new CANNON.Material();
  const physicsContactMaterial = new CANNON.ContactMaterial(
    physicsMaterial,
    physicsMaterial,
    0.0, // friction
    0.01 // restitution
  );
  const [instructionMessage, setInstructionMessage] = useState(true);
  const [diceState, setDiceState] = useState(true);

  function makeRandomVector(vector) {
    const randAngle = (Math.random() * Math.PI) / 5 - Math.PI / 5 / 2;
    const vec = {
      x: vector.x * Math.cos(randAngle) - vector.y * Math.sin(randAngle),
      y: vector.x * Math.sin(randAngle) + vector.y * Math.cos(randAngle),
    };
    if (vec.x === 0) vec.x = 0.01;
    if (vec.y === 0) vec.y = 0.01;
    return vec;
  }

  function makeDiceProperties() {
    let vector = diceProperty.out;
    let distance = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    let magnitude = (Math.random() + 3) * distance;
    let vec = makeRandomVector(vector);
    let pos = {
      x: 100 * (vec.x > 0 ? -1 : 1) * 0.9, //change 100
      y: 100 * (vec.y > 0 ? -1 : 1) * 0.9, //change 100
      z: Math.random() * 20 + 20,
    };
    let velVec = makeRandomVector(vector);
    let velocity = { x: velVec.x * magnitude, y: velVec.y * magnitude, z: -10 };
    let inertia = 13;
    let angle = {
      x: -(Math.random() * vec.y * 5 + inertia * vec.y),
      y: Math.random() * vec.x * 5 + inertia * vec.x,
      z: 0,
    };
    let axis = {
      x: Math.random(),
      y: Math.random(),
      z: Math.random(),
      a: Math.random(),
    };
    diceProperty.pos = pos;
    diceProperty.velocity = velocity;
    diceProperty.angle = angle;
    diceProperty.axis = axis;
  }

  const getMousePos = function (ev) {
    const touches = ev.changedTouches;
    if (touches) return { x: touches[0].clientX, y: touches[0].clientY };
    return { x: ev.clientX, y: ev.clientY };
  };
  const handleMouseDown = (e) => {
    setDiceState(true);
    diceProperty.mouseTime = new Date().getTime();
    diceProperty.mouseStart = getMousePos(e);
  };
  const handleMouseUp = (e) => {
    const m = getMousePos(e);

    diceProperty.out = {
      x: (m.x - diceProperty.mouseStart.x) / 5000,
      y: -(m.y - diceProperty.mouseStart.y) / 5000,
    };

    diceProperty.mouseStart = undefined;
    if (diceProperty.out) {
      //if mouse drag is detected
      makeDiceProperties(); //create a dice with properties
    }
    setDiceState(false);
  };
  return (
    <>
      <Canvas
        shadowMap
        camera={{ position: [0, -12, 150] }}
        onTouchEnd={handleMouseUp}
        onTouchStart={handleMouseDown}
        onPointerUp={handleMouseUp}
        onPointerDown={handleMouseDown}
      >
        <hemisphereLight intensity={0.35} />
        <spotLight
          position={[200, 0, 200]}
          angle={0.3}
          penumbra={1}
          intensity={0.5}
          castShadow
          shadow-mapSize-width={256}
          shadow-mapSize-height={256}
        />
        <pointLight position={[-30, 0, -30]} intensity={0.5} />
        <Physics
          gravity={[0, 0, -9.8 * 3]}
          defaultContactMaterial={physicsContactMaterial}
          step={1 / 60}
          iterations={10}
        >
          <Floor />
          <BoundPlanes position={[-60, 0, 0]} rotation={[0, 1.570796, 0]} />
          <BoundPlanes position={[60, 0, 0]} rotation={[0, -1.570796, 0]} />
          <BoundPlanes position={[0, 60, 0]} rotation={[1.570796, 0, 0]} />
          <BoundPlanes position={[0, -60, 0]} rotation={[-1.570796, 0, 0]} />
          {!diceState && (
            <Dice
              pos={diceProperty.pos}
              velocity={diceProperty.velocity}
              angle={diceProperty.angle}
              axis={diceProperty.axis}
              setInstructionMessage={setInstructionMessage}
            />
          )}
        </Physics>
      </Canvas>
      <div
        className="startup"
        style={{ display: instructionMessage ? "block" : "none" }}
      >
        Instruction - drag to throw dice
      </div>
    </>
  );
}

export default App;
