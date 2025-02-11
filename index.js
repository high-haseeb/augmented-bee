import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const canvas = document.getElementById("game");

const delta = 0.04;
const update = () => {
    if (mixers) {
        mixers.forEach((mixer) => { mixer.update(delta) });
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
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(update);
renderer.xr.enabled = true;

document.body.appendChild(ARButton.createButton(renderer));
const mixers = [];
const loader = new GLTFLoader();
let beeHeadMixer;
let beeIsTalking = true;
let bee; // Store bee globally

const loadBeeModel = () => {
    bee = new THREE.Group();
    let beeSpeakAction = null;
    beeHeadMixer = new THREE.AnimationMixer(bee);

    loader.load("beeedark.glb", (glb) => {
        bee.add(glb.scene);
        bee.scale.set(0.2, 0.2, 0.2);
        bee.position.set(0, 0, -5);
        bee.lookAt(0, 0, 0);
        scene.add(bee);
        const mixer = new THREE.AnimationMixer(bee);
        glb.animations.forEach((clip) => {
            if (clip.name == "ArmatureAction") {
                beeSpeakAction = beeHeadMixer.clipAction(clip);
                beeSpeakAction.setLoop(THREE.LoopRepeat);
                beeSpeakAction.timeScale = 1.4;
                beeSpeakAction.play();
            }
            else if (clip.name == "Blink") {
                const action = mixer.clipAction(clip);
                action.setLoop(THREE.LoopRepeat);
                action.timeScale = 1.0;
                action.play();
            } else {
                const action = mixer.clipAction(clip);
                action.setLoop(THREE.LoopRepeat);
                action.timeScale = 4.5;
                action.play();
            }
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

const moveSpeed = 0.1;

document.body.insertAdjacentHTML("beforeend", `
    <div style="position: fixed; bottom: 20px; left: 20px; display: flex; flex-direction: column;">
        <button id="up" style="width: 50px; height: 50px;">⬆</button>
        <div style="display: flex;">
            <button id="left" style="width: 50px; height: 50px;">⬅</button>
            <button id="right" style="width: 50px; height: 50px;">➡</button>
        </div>
        <button id="down" style="width: 50px; height: 50px;">⬇</button>
    </div>
`);

const moveBee = (dx, dy) => {
    if (bee) {
        bee.position.x += dx;
        bee.position.y += dy;
    }
};

document.getElementById("up").addEventListener("touchstart", () => moveBee(0, moveSpeed));
document.getElementById("down").addEventListener("touchstart", () => moveBee(0, -moveSpeed));
document.getElementById("left").addEventListener("touchstart", () => moveBee(-moveSpeed, 0));
document.getElementById("right").addEventListener("touchstart", () => moveBee(moveSpeed, 0));
