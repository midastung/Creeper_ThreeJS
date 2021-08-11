import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let renderer, scene, camera;
let cameraControl, stats;

function initStats() {
    const stats = new Stats();
    stats.setMode(0);
    document.getElementById('stats').appendChild(stats.domElement);
    return stats;
}

function createVerticesPoints() {
    const geometry = new THREE.BufferGeometry(); //先宣吿一個空的幾何體
    const material = new THREE.PointsMaterial({
        size: 4,
        color: 0xff00ff //粉紅色
    }) //利用 PointsMaterial 決定材質

    for (let x = -5; x < 5; x++) {
        for (let y = -5; y < 5; y++) {
            // 每一個粒子為一個 Vector3 頂點物件
            const point = new THREE.Vector3(x * 10, y * 10, 0);
            //將每個頂點組成自訂的幾何體
            geometry.vertices.push(point);
        }
    }

    //用前面幾何體與材質建立一個粒子系統
    let points = new THREE.Points(geometry, material);
    points.position.set(-45, 0, 0);
    scene.add(points);
}

// 利用球體的頂點創建粒子系統
function createSpherePoints() {
    const geometry = new THREE.SphereGeometry(40, 20, 20); //使用球體
    const material = new THREE.PointsMaterial({
        size: 2,
        color: 0x00ff00 //綠色
    });

    //用球體與材質建立一個粒子系統
    let spherePoints = new THREE.Points(geometry, material);
    spherePoints.position.set(45, 0, 0);
    scene.add(spherePoints);
}

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    )
    camera.position.set(0, 0, 100);
    camera.lookAt(scene.position);

    stats = initStats();

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    cameraControl = new OrbitControls(camera, renderer.domElement);

    //創建粒子系統
    createVerticesPoints();
    createSpherePoints();

    //spotlight
    let spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(-10, 40, 30);
   
    scene.add(spotLight);

    document.body.appendChild(renderer.domElement);
}

function render(){
    stats.update();
    requestAnimationFrame(render);
    cameraControl.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', function(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth / window.innerHeight);
})

init()
render()