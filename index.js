import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 1));
const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(1, 2, 3);
scene.add(light);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

// --- ARButton with immersive mode ---
document.body.appendChild(
    ARButton.createButton(renderer, {
        requiredFeatures: ["hit-test"], // Allows object placement in AR
        optionalFeatures: ["dom-overlay"],
        domOverlay: { root: document.body }
    })
);

const mixers = [];
const loader = new GLTFLoader();
let bee;
let beeHeadMixer;

// --- Load 3D Bee Model ---
const loadBeeModel = () => {
    loader.load("beeedark.glb", (glb) => {
        bee = new THREE.Group();
        bee.add(glb.scene);
        bee.scale.set(0.2, 0.2, 0.2);
        bee.position.set(0, 1.5, -2); // In front of user in AR
        scene.add(bee);

        // Handle animations
        beeHeadMixer = new THREE.AnimationMixer(bee);
        glb.animations.forEach((clip) => {
            const action = beeHeadMixer.clipAction(clip);
            action.setLoop(THREE.LoopRepeat);
            action.play();
        });

        mixers.push(beeHeadMixer);
    });
};
loadBeeModel();

// --- Update Loop ---
const clock = new THREE.Clock();
const update = () => {
    const delta = clock.getDelta();
    mixers.forEach((mixer) => mixer.update(delta));
    renderer.render(scene, camera);
};
renderer.setAnimationLoop(update);

// --- AR Movement Controls ---
const moveBee = (dx, dy, dz) => {
    if (bee) {
        bee.position.x += dx;
        bee.position.y += dy;
        bee.position.z += dz;
    }
};

// --- UI Controls ---
const controlPanel = document.createElement("div");
controlPanel.style.position = "fixed";
controlPanel.style.bottom = "20px";
controlPanel.style.left = "50%";
controlPanel.style.transform = "translateX(-50%)";
controlPanel.style.display = "flex";
controlPanel.style.flexDirection = "column";
controlPanel.style.alignItems = "center";
controlPanel.style.zIndex = "999"; // Above WebGL canvas
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

// UI Buttons for Movement
createButton("⬆", () => moveBee(0, 0.1, 0));
const row = document.createElement("div");
row.style.display = "flex";
controlPanel.appendChild(row);
createButton("⬅", () => moveBee(-0.1, 0, 0)).style.marginRight = "10px";
createButton("➡", () => moveBee(0.1, 0, 0)).style.marginLeft = "10px";
createButton("⬇", () => moveBee(0, -0.1, 0));

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
