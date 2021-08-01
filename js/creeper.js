import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer;
let cameraControl, stats;

// 苦力怕物件
class Creeper {
    constructor() {
        //宣吿頭、身體、腳幾何體大小
        const headGeo = new THREE.BoxGeometry(4, 4, 4);
        const bodyGeo = new THREE.BoxGeometry(4, 8, 2);
        const footGeo = new THREE.BoxGeometry(2, 3, 2);

        // 苦力怕臉部貼圖
        const headMap = new THREE.TextureLoader().load(
            'https://dl.dropboxusercontent.com/s/bkqu0tty04epc46/creeper_face.png'
        );

        // 苦力怕皮膚貼圖
        const skinMap = new THREE.TextureLoader().load(
            'https://dl.dropboxusercontent.com/s/eev6wxdxfmukkt8/creeper_skin.png'
        );

        //身體與腳的材質設定
        const skinMat = new THREE.MeshStandardMaterial({
            roughness: 0.3, // 粗糙度
            metalness: 0.8, // 金屬感
            transparent: true, // 透明與否
            opacity: 0.9, // 透明度
            side: THREE.DoubleSide, // 雙面材質
            map: skinMap // 皮膚貼圖
        });

        // 準備頭部與臉的材質
        const headMaterials = [];
        for (let i = 0; i < 6; i++) {
            let map;

            if (i === 4) map = headMap;
            else map = skinMap;

            headMaterials.push(new THREE.MeshStandardMaterial({
                map: map
            }))
        };
        // const creeperMat = new THREE.MeshPhongMaterial({
        //     color: 0x00ff00
        // });

        //頭
        this.head = new THREE.Mesh(headGeo, headMaterials);
        this.head.position.set(0, 6, 0);

        //身體
        this.body = new THREE.Mesh(bodyGeo, skinMat);
        this.body.position.set(0, 0, 0);

        //四隻腳
        this.foot1 = new THREE.Mesh(footGeo, skinMat)
        this.foot1.position.set(-1, -5.5, 2)
        this.foot2 = this.foot1.clone() // 剩下三隻腳都複製第一隻的 Mesh
        this.foot2.position.set(-1, -5.5, -2)
        this.foot3 = this.foot1.clone()
        this.foot3.position.set(1, -5.5, 2)
        this.foot4 = this.foot1.clone()
        this.foot4.position.set(1, -5.5, -2)

        //將四隻腳組成一Group
        this.feet = new THREE.Group();
        this.feet.add(this.foot1);
        this.feet.add(this.foot2);
        this.feet.add(this.foot3);
        this.feet.add(this.foot4);

        //將頭、身體、腳組成一Group
        this.creeper = new THREE.Group();
        this.creeper.add(this.head);
        this.creeper.add(this.body);
        this.creeper.add(this.feet);
    }
}

//生成苦力怕並加到場景
function createCreeper() {
    const creeperObj = new Creeper();
    scene.add(creeperObj.creeper);
}

//建立監測器
function initStats() {
    stats = new Stats()
    stats.setMode(0)
    document.getElementById('stats').appendChild(stats.domElement);
    return stats
}

function init() {
    scene = new THREE.Scene();

    //相機設定與OrbitControls
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        100
    );
    camera.position.set(30, 30, 30);  //相機位置
    camera.lookAt(scene.position); //相機焦點

    // 三軸座標輔助
    let axes = new THREE.AxesHelper(20);
    scene.add(axes);

    stats = initStats();

    //渲染器設定
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    //建立OrbitControls
    cameraControl = new OrbitControls(camera, renderer.domElement);
    cameraControl.enableDamping = true; //啟用阻尼效果
    cameraControl.dampingFactor = 0.25 //阻尼系數
    //cameraControl.autoRotate = true; //啟用自動旋轉

    //簡單的地板
    const planeGeometry = new THREE.PlaneGeometry(60, 60);
    const planeMaterial = new THREE.MeshLambertMaterial({
        color: 0xffffff
    });
    let plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -0.5 * Math.PI  //使平面與Ｙ軸垂直, 並讓正面朝上
    plane.position.set(0, -7, 0);
    scene.add(plane);

    //生成creeper
    createCreeper();

    //簡單的spotLight 照亮物體
    let spotLight = new THREE.SpotLight();
    spotLight.position.set(-10, 40, 30);
    scene.add(spotLight);

    // 將渲染出來的畫面放到網頁上的 DOM
    document.body.appendChild(renderer.domElement);
}

function render() {
    stats.update();
    requestAnimationFrame(render);
    cameraControl.update(); //須設定Update
    renderer.render(scene, camera);
}

window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})



init();
render();