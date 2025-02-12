import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { lerp } from "three/src/math/MathUtils";

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

document.body.appendChild(
    ARButton.createButton(renderer, {
        requiredFeatures: ["hit-test"],
        optionalFeatures: ["dom-overlay"],
        domOverlay: { root: document.body }
    })
);

const loader = new GLTFLoader();
const model = new THREE.Group();
let generalMixer: THREE.AnimationMixer;
let speakMixer: THREE.AnimationMixer;
let isSpeaking = false;

const LoadModel = () => {
    loader.load("beeedark.glb", (glb) => {
        model.add(glb.scene);
        model.scale.set(0.2, 0.2, 0.2);
        scene.add(model);

        speakMixer = new THREE.AnimationMixer(model);
        generalMixer = new THREE.AnimationMixer(model);
        glb.animations.forEach((clip) => {
            if (clip.name === "ArmatureAction") {
                const action = speakMixer.clipAction(clip);
                action.setLoop(THREE.LoopRepeat, Infinity).play();
            } else {
                const action = generalMixer.clipAction(clip);
                action.setLoop(THREE.LoopRepeat, Infinity).play();
            }
        });
    });
};
LoadModel();

function UpdateAnimations(delta: number) {
    if (speakMixer && isSpeaking) {
        speakMixer.update(delta);
    }
    if (generalMixer) {
        generalMixer.update(delta);
    }
}


const moveDelta = 0.5;
const upB = document.getElementById("up");
const downB = document.getElementById("down");
const leftB = document.getElementById("left");
const rightB = document.getElementById("right");

upB?.addEventListener("click", () => setTargetPosition(0, moveDelta));
downB?.addEventListener("click", () => setTargetPosition(0, -moveDelta));
leftB?.addEventListener("click", () => setTargetPosition(-moveDelta, 0));
rightB?.addEventListener("click", () => setTargetPosition(moveDelta, 0));

const targetPosition = new THREE.Vector3(0, -0.5, -2);
const setTargetPosition = (dx: number, dy: number) => {
    targetPosition.copy(model.position).add({ x: dx, y: dy, z: 0.0 });
}
const updateModelPosition = () => {
    if (model) {
        model.position.lerp(targetPosition, 0.1);
    }
};

window.addEventListener("mousedown", () => isSpeaking = true);
window.addEventListener("mouseup", () => isSpeaking = false);

const clock = new THREE.Clock();
const update = () => {
    const delta = clock.getDelta();
    UpdateAnimations(delta);
    updateModelPosition();
    renderer.render(scene, camera);
};

renderer.setAnimationLoop(update);

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
