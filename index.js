import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const canvas = document.getElementById("game");

const delta = 0.04;
const update = () => {
    if (mixers) {
        mixers.forEach((mixer) => mixer.update(delta));
    }
    if (beeHeadMixer && beeIsTalking) {
        beeHeadMixer.update(delta);
    }
    renderer.render(scene, camera);
};

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight());
scene.add(new THREE.DirectionalLight("white", 2.0));

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 3);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;

// Enable AR with dom-overlay
document.body.appendChild(
    ARButton.createButton(renderer, {
        requiredFeatures: ["hit-test"],
        optionalFeatures: ["dom-overlay"],
        domOverlay: { root: document.body }
    })
);

const mixers = [];
const loader = new GLTFLoader();
let beeHeadMixer;
let beeIsTalking = true;
let bee;

// --- Load Bee Model ---
const loadBeeModel = () => {
    bee = new THREE.Group();
    beeHeadMixer = new THREE.AnimationMixer(bee);

    loader.load("beeedark.glb", (glb) => {
        bee.add(glb.scene);
        bee.scale.set(0.2, 0.2, 0.2);
        bee.position.set(0, 1, -2); // Place in front of camera
        bee.lookAt(0, 1, 0);
        scene.add(bee);

        const mixer = new THREE.AnimationMixer(bee);
        glb.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            action.setLoop(THREE.LoopRepeat);
            action.timeScale = clip.name === "ArmatureAction" ? 1.4 : 1.0;
            action.play();
        });

        mixers.push(mixer);
    });
};
loadBeeModel();

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

// --- Create AR UI Buttons ---
const moveSpeed = 0.2;

const controlPanel = document.createElement("div");
controlPanel.style.position = "fixed";
controlPanel.style.bottom = "10px";
controlPanel.style.left = "50%";
controlPanel.style.transform = "translateX(-50%)";
controlPanel.style.display = "flex";
controlPanel.style.flexDirection = "column";
controlPanel.style.alignItems = "center";
controlPanel.style.zIndex = "999"; // Ensure it's above AR view
document.body.appendChild(controlPanel);

const buttonStyle = `
    width: 60px; height: 60px; font-size: 20px; margin: 5px;
    border-radius: 50%; border: none; background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(5px); cursor: pointer;
`;

const createButton = (text, onClick) => {
    const btn = document.createElement("button");
    btn.innerText = text;
    btn.style.cssText = buttonStyle;
    btn.addEventListener("pointerdown", onClick);
    controlPanel.appendChild(btn);
    return btn;
};

createButton("⬆", () => moveBee(0, moveSpeed, 0));
const row = document.createElement("div");
row.style.display = "flex";
createButton("⬅", () => moveBee(-moveSpeed, 0, 0)).style.marginRight = "10px";
createButton("➡", () => moveBee(moveSpeed, 0, 0)).style.marginLeft = "10px";
createButton("⬇", () => moveBee(0, -moveSpeed, 0));

// --- Move Bee in AR ---
const moveBee = (dx, dy, dz) => {
    if (bee) {
        bee.position.x += dx;
        bee.position.y += dy;
        bee.position.z += dz;
    }
};
