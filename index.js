import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Model paths
const modelPaths = [
    './models/NexusHQ_SpaceStationFinal.gltf',
    './models/NexusCode_HQ.gltf',
    './models/Coffee Room.gltf'
];

// Points of Interest (POIs) for each model
const modelPOIs = [
  [ // POIs for model 1
    {position: { x: 100, y: 40, z: -300 }, lookAt: { x: 0, y: 0, z: 0 }}, // Space Station
  ],
  [ // POIs for model 2
    {position: { x: 3, y: 5, z: -3 }, lookAt: { x: 49, y: 5, z: -49 }}, // Start
    {position: { x: 8, y: 3, z: -9 }, lookAt: { x: 49, y: -30, z: -49 }}, // Schreibtisch Tim
    {position: { x: 6, y: 1, z: -17 }, lookAt: { x: 49, y: 0, z: -55 }}, // Schreibtisch Max
    {position: { x: 9, y: 2.5, z: -20.5 }, lookAt: { x: 49, y: -10, z: -40 }}, // Schreibtisch Jasper
    {position: { x: 18, y: 2.5, z: -11 }, lookAt: { x: 49, y: -5, z: -35 }}, // Schreibtisch Alina
    {position: { x: 16, y: 1, z: -8.5}, lookAt: { x: 49, y: 0, z: -5 }}, // Schreibtisch Juliette
    {position: { x: 15, y: 5, z: -15 }, lookAt: { x: 0, y: 5, z: 0 }}, // Teleporter
  ],
  [ // POIs for model 3
    {position: { x: -10, y: 5, z: -6 }, lookAt: { x: -60, y: 5, z: -49 }}, // Start
    {position: { x: -28, y: 4, z: -8 }, lookAt: { x: -15, y: -10, z: 20 }}, // Kaffeküche
    {position: { x: -20, y: 3, z: -15 }, lookAt: { x: 50, y: 5, z: -25 }}, // Gamer Ecker
  ]
];

let currentModelIndex = 0;
let currentPOIIndex = 0;
let isAnimating = false;
let animationDuration = 2000; // Dauer der Animation in Millisekunden
let animationStart = 0;

let startPosition = new THREE.Vector3();
let endPosition = new THREE.Vector3();
let startLookAt = new THREE.Vector3();
let endLookAt = new THREE.Vector3();

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('three-canvas'), antialias: true });
let textureLoader = new THREE.TextureLoader();
renderer.setSize(window.innerWidth, window.innerHeight);
const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Allgemeines Licht: Farbe, Intensität


// Sonnenlicht
const directionalLight = new THREE.DirectionalLight(0xffffff, 10); // Farbe, Intensität
directionalLight.position.set(5, 5550, 7.5); // Position des Lichts
scene.add(directionalLight);

let currentModel;
let currentAnimations;
const bgTexture = textureLoader.load('./erde.png');
const loader = new GLTFLoader();
const clock = new THREE.Clock();
let mixer;

scene.add(ambientLight);
scene.background = bgTexture;

function startAnimations(model, animations) {
  // Erstelle den AnimationMixer
  mixer = new THREE.AnimationMixer(model);

  // Wähle einen Animationsclip aus (hier verwenden wir den ersten)
  const action = mixer.clipAction(animations[0]);

  // Animation starten
  action.play();
}


// Function to load the current model
function loadModel(index) {
  console.log("Loading model", modelPaths[index]);
  loader.load(modelPaths[index], function (gltf) {
    if (currentModel) scene.remove(currentModel); // Remove the previous model
    currentModel = gltf.scene;
    currentAnimations = gltf.animations;
    scene.add(currentModel);
    currentModel.rotation.z = (index === 0) ? 0.5 : 0;
    startAnimations(currentModel, currentAnimations);
    currentPOIIndex = 0;
    moveToPOI();
  }, undefined, function (error) {
    console.error('Error loading model', error);
  });
}

// Function to move the camera to the current POI with tween animation
function moveToPOI() {
    const poi = modelPOIs[currentModelIndex][currentPOIIndex];

    currentPOIIndex === 0 ? camera.position.set(poi.position.x, poi.position.y, poi.position.z) : null;
  
    // Setze Start- und Endpositionen
    startPosition.copy(camera.position);
    endPosition.set(poi.position.x, poi.position.y, poi.position.z);
  
    // Setze Start- und End-Blickrichtungen
    startLookAt.copy(camera.position).add(camera.getWorldDirection(new THREE.Vector3()));
    endLookAt.set(poi.lookAt.x, poi.lookAt.y, poi.lookAt.z);
  
    animationStart = Date.now(); // Startzeit der Animation
    isAnimating = true; // Animationsstatus aktivieren
  }

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
      let timeElapsed = Date.now() - animationStart;
      if (isAnimating && timeElapsed < animationDuration) {
        let alpha = timeElapsed / animationDuration; // Normalisiere die verstrichene Zeit
    
        // Interpoliere Position
        camera.position.lerpVectors(startPosition, endPosition, alpha);
    
        // Interpoliere Blickrichtung
        let currentLookAt = new THREE.Vector3();
        currentLookAt.lerpVectors(startLookAt, endLookAt, alpha);
        camera.lookAt(currentLookAt);
      } else if (isAnimating) {
        isAnimating = false; // Beende die Animation, wenn die Zeit abgelaufen ist
        camera.position.copy(endPosition); // Stelle sicher, dass die Zielposition erreicht ist
        camera.lookAt(endLookAt); // Stelle sicher, dass die Zielblickrichtung erreicht ist
      }

      const delta = clock.getDelta(); // Die Zeit seit dem letzten Frame

      // Den AnimationMixer updaten
      if (mixer) {
        mixer.update(delta);
      }
    
      renderer.render(scene, camera);
    }
  
document.getElementById('backward').addEventListener('click', () => {
    currentPOIIndex--; // Move to the next POI
    if (currentPOIIndex < 0) {
      currentPOIIndex = 0;
      currentModelIndex--; // Move to the next model
      if (currentModelIndex < 0) {
        currentModelIndex = 0; // Restart the process if all models are visited
      }
      loadModel(currentModelIndex); // Load the next model
    } else {
      moveToPOI(); // Move to the last POI in the current model
    }
});

// Event listener for clicks
document.getElementById('forward').addEventListener('click', () => {
  currentPOIIndex++; // Move to the next POI
  if (currentPOIIndex >= modelPOIs[currentModelIndex].length) {
    currentPOIIndex = 0;
    currentModelIndex++; // Move to the next model
    if (currentModelIndex >= modelPaths.length) {
      currentModelIndex = 0; // Restart the process if all models are visited
    }
    loadModel(currentModelIndex); // Load the next model
  } else {
    moveToPOI(); // Move to the next POI in the current model
  }
});

// Window resize handling
window.addEventListener('resize', function () {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});


// Initial model load and start animation loop
loadModel(currentModelIndex);
animate();
