import * as THREE from 'https://unpkg.com/three@0.178.0/build/three.module.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1.5);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

const sunGeometry = new THREE.SphereGeometry(4, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Add background stars
const starGeometry = new THREE.BufferGeometry();
const starVertices = [];
for (let i = 0; i < 1000; i++) {
  const x = THREE.MathUtils.randFloatSpread(600);
  const y = THREE.MathUtils.randFloatSpread(600);
  const z = THREE.MathUtils.randFloatSpread(600);
  starVertices.push(x, y, z);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

const clock = new THREE.Clock();
let isPaused = false;
let isDarkMode = true;

const planetData = [
  { name: "Mercury", radius: 0.5, distance: 7, speed: 0.02, color: 0xaaaaaa },
  { name: "Venus", radius: 0.6, distance: 10, speed: 0.015, color: 0xffddaa },
  { name: "Earth", radius: 0.7, distance: 13, speed: 0.01, color: 0x3399ff },
  { name: "Mars", radius: 0.6, distance: 16, speed: 0.008, color: 0xff5533 },
  { name: "Jupiter", radius: 1.2, distance: 20, speed: 0.006, color: 0xffaa33 },
  { name: "Saturn", radius: 1, distance: 24, speed: 0.004, color: 0xffeeaa },
  { name: "Uranus", radius: 0.9, distance: 28, speed: 0.003, color: 0x66ccff },
  { name: "Neptune", radius: 0.8, distance: 32, speed: 0.002, color: 0x3366ff }
];

const planets = [];
const tooltip = document.createElement('div');
tooltip.style.position = 'absolute';
tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
tooltip.style.color = 'white';
tooltip.style.padding = '4px 8px';
tooltip.style.borderRadius = '4px';
tooltip.style.pointerEvents = 'none';
tooltip.style.display = 'none';
tooltip.style.fontSize = '12px';
document.body.appendChild(tooltip);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const controlsDiv = document.createElement('div');
controlsDiv.id = 'controls';
controlsDiv.style.position = 'absolute';
controlsDiv.style.top = '10px';
controlsDiv.style.left = '10px';
controlsDiv.style.padding = '10px';
controlsDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
controlsDiv.style.color = 'white';
controlsDiv.style.zIndex = '1';
document.body.appendChild(controlsDiv);

planetData.forEach(data => {
  const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: data.color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.x = data.distance;
  mesh.userData.name = data.name;
  scene.add(mesh);
  data.mesh = mesh;
  data.angle = 0;
  planets.push(data);

  // Speed control
  const label = document.createElement('label');
  label.innerText = `${data.name} Speed:`;
  const input = document.createElement('input');
  input.type = 'range';
  input.min = 0.001;
  input.max = 0.05;
  input.step = 0.001;
  input.value = data.speed;
  input.addEventListener('input', (e) => {
    data.speed = parseFloat(e.target.value);
  });
  controlsDiv.appendChild(label);
  controlsDiv.appendChild(input);
  controlsDiv.appendChild(document.createElement('br'));
});

// Pause/Resume button
const toggleBtn = document.createElement('button');
toggleBtn.id = 'toggleAnimation';
toggleBtn.innerText = 'Pause';
toggleBtn.style.position = 'absolute';
toggleBtn.style.top = '10px';
toggleBtn.style.right = '10px';
toggleBtn.style.padding = '5px 10px';
toggleBtn.style.zIndex = '1';
document.body.appendChild(toggleBtn);

toggleBtn.addEventListener('click', () => {
  isPaused = !isPaused;
  toggleBtn.innerText = isPaused ? "Resume" : "Pause";
});

// Dark/Light toggle
const themeBtn = document.createElement('button');
themeBtn.innerText = 'Light Mode';
themeBtn.style.position = 'absolute';
themeBtn.style.top = '50px';
themeBtn.style.right = '10px';
themeBtn.style.padding = '5px 10px';
themeBtn.style.zIndex = '1';
document.body.appendChild(themeBtn);

themeBtn.addEventListener('click', () => {
  isDarkMode = !isDarkMode;
  document.body.style.backgroundColor = isDarkMode ? 'black' : 'white';
  controlsDiv.style.backgroundColor = isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)';
  controlsDiv.style.color = isDarkMode ? 'white' : 'black';
  themeBtn.innerText = isDarkMode ? 'Light Mode' : 'Dark Mode';
});

camera.position.set(0, 0, 100);
const canvas = renderer.domElement;

window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

function animate() {
  requestAnimationFrame(animate);
  if (!isPaused) {
    planets.forEach(planet => {
      planet.angle += planet.speed;
      planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
      planet.mesh.position.z = Math.sin(planet.angle) * planet.distance;
      planet.mesh.rotation.y += 0.01;
    });
  }

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));
  if (intersects.length > 0) {
    const intersected = intersects[0].object;
    tooltip.innerText = intersected.userData.name;
    tooltip.style.left = `${event.clientX + 10}px`;
    tooltip.style.top = `${event.clientY + 10}px`;
    tooltip.style.display = 'block';
  } else {
    tooltip.style.display = 'none';
  }

  renderer.render(scene, camera);
}
animate();