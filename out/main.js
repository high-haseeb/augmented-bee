import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
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
document.body.appendChild(ARButton.createButton(renderer, {
    requiredFeatures: ["hit-test"],
    optionalFeatures: ["dom-overlay"],
    domOverlay: { root: document.body }
}));
var mixers;
const loader = new GLTFLoader();
let bee;
let headMixer;
const loadBeeModel = () => {
    loader.load("beeedark.glb", (glb) => {
        bee = new THREE.Group();
        bee.add(glb.scene);
        bee.scale.set(0.2, 0.2, 0.2);
        bee.position.set(0, 1.5, -2);
        scene.add(bee);
        headMixer = new THREE.AnimationMixer(bee);
        glb.animations.forEach((clip) => {
            const action = headMixer.clipAction(clip);
            action.setLoop(THREE.LoopRepeat, -1);
            action.play();
        });
        mixers.push(headMixer);
    });
};
loadBeeModel();
const clock = new THREE.Clock();
const update = () => {
    const delta = clock.getDelta();
    mixers.forEach((mixer) => mixer.update(delta));
    renderer.render(scene, camera);
};
renderer.setAnimationLoop(update);
const moveBee = (dx, dy, dz) => {
    if (bee) {
        bee.position.x += dx;
        bee.position.y += dy;
        bee.position.z += dz;
    }
};
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
