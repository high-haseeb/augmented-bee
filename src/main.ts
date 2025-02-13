import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import OpenAI from "../node_modules/openai/index";

let recognition: any;
// @ts-ignore
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("No Speech Recognition Found!");
} else {
    recognition = new SpeechRecognition();
    recognition.lang = "tr-TR"; // Set to Turkish
    recognition.interimResults = false;
    
    recognition.onstart = () => {
        console.log("Voice recognition started...");
    };

    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("Recognized Text:", transcript);
        sendToGPT(transcript);
    };

    recognition.onend = () => {
        console.log("Voice recognition stopped.");
    };

    document.addEventListener("click", () => {
        console.log("Starting voice recognition...");
        recognition.start();
    });
}

let OPENAI_API_KEY = ""; // Initially empty

async function fetchOpenAIKey() {
    try {
        const response = await fetch("https://high-haseeb.github.io/api/proxy");
        if (!response.ok) throw new Error("Failed to fetch API key");

        const data = await response.json();
        OPENAI_API_KEY = data.token;
        console.log("OpenAI API Key fetched successfully.");

        initializeOpenAI();
    } catch (error) {
        console.error("Error fetching OpenAI API key:", error);
    }
}

let openai: OpenAI;
function initializeOpenAI() {
    if (!OPENAI_API_KEY) {
        console.error("OpenAI API Key is missing!");
        return;
    }

    openai = new OpenAI({
        baseURL: 'https://api.openai.com/v1',
        apiKey: OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
    });

    console.log("OpenAI initialized.");
}

// Run fetch function on start
fetchOpenAIKey();

const ELEVENLABS_API_KEY = "sk_09c3b27b6df049d17d0149b0fc27485bc7209ad5662263ef";
const ELEVENLABS_VOICE_ID = "P0b83LG1P1Wk1vRGFclI";

async function sendToGPT(input: string) {
    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "Sen tatlı, sevimli ve neşeli bir küçük kızsın. Cevapların kısa, sevimli ve oyunbaz olmalı!",
            },
            { role: "user", content: input }
        ],
        model: "gpt-3.5-turbo"
    });

    const response = completion.choices[0].message.content;
    if (response) {
        await sendToElevenLabs(response);
    }
}

async function sendToElevenLabs(text: string) {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
        method: "POST",
        headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            text: text,
            model_id: "eleven_monolingual_v1",
            voice_settings: { stability: 0.5, similarity_boost: 0.5 },
            language: "tr"
        }),
    });

    if (!response.ok) {
        console.error("Error generating speech:", response.statusText);
        return;
    }

    const audioBlob = await response.blob();
    playAudio(audioBlob);
}

function playAudio(blob: Blob) {
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    audio.play();
    isSpeaking = true;

    audio.addEventListener("ended", () => {
        isSpeaking = false;
        console.log("Audio playback finished.");
    });
}

let isSpeaking = false;

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
