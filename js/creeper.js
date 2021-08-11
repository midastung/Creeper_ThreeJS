import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module';

let scene, camera, renderer;
let cameraControl, stats, gui;
let creeperObj, plane;
let walkSpeed = 0
let tween, tweenBack;
let invert = 1; // 正反向
let startTracking = false;

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

        // 身體與腳的材質設定
        const skinMat = new THREE.MeshPhongMaterial({
            map: skinMap // 皮膚貼圖
        })

        // 準備頭部與臉的材質
        const headMaterials = []
        for (let i = 0; i < 6; i++) {
            let map

            if (i === 4) map = headMap
            else map = skinMap

            headMaterials.push(new THREE.MeshPhongMaterial({ map: map }))
        }

        // 頭
        this.head = new THREE.Mesh(headGeo, headMaterials)
        this.head.position.set(0, 6, 0)
        // this.head.rotation.y = 0.5 // 稍微的擺頭

        // 身體
        this.body = new THREE.Mesh(bodyGeo, skinMat)
        this.body.position.set(0, 0, 0)

        // 四隻腳
        this.foot1 = new THREE.Mesh(footGeo, skinMat)
        this.foot1.position.set(-1, -5.5, 2)
        this.foot2 = this.foot1.clone()
        this.foot2.position.set(-1, -5.5, -2)
        this.foot3 = this.foot1.clone()
        this.foot3.position.set(1, -5.5, 2)
        this.foot4 = this.foot1.clone()
        this.foot4.position.set(1, -5.5, -2)

        // 將四隻腳組合為一個 group
        this.feet = new THREE.Group()
        this.feet.add(this.foot1) // 前腳左
        this.feet.add(this.foot2) // 後腳左
        this.feet.add(this.foot3) // 前腳右
        this.feet.add(this.foot4) // 後腳右

        // 將頭、身體、腳組合為一個 group
        this.creeper = new THREE.Group()
        this.creeper.add(this.head)
        this.creeper.add(this.body)
        this.creeper.add(this.feet)

        this.creeper.traverse(function (object) {
            if (object instanceof THREE.Mesh) {
                object.castShadow = true
                object.receiveShadow = true
            }
        })
    }
}

// 生成苦力怕並加到場景
function createCreeper() {
    creeperObj = new Creeper()
    tweenHandler() // 追蹤相機動畫
    scene.add(creeperObj.creeper)
}

let datGUIControls = new (function () {
    this.startTracking = false
})()

function initStats() {
    const stats = new Stats()
    stats.setMode(0)
    document.getElementById('stats').appendChild(stats.domElement)
    return stats
}

// 畫面初始化
function init() {
    scene = new THREE.Scene()

    // 相機設定
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    )
    camera.position.set(50, 50, 50)
    camera.lookAt(scene.position)

    let axes = new THREE.AxesHelper(20)
    scene.add(axes)

    stats = initStats()

    // 渲染器設定
    renderer = new THREE.WebGLRenderer()
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = 2 // THREE.PCFSoftShadowMap

    // 建立 OrbitControls
    cameraControl = new OrbitControls(camera, renderer.domElement)
    cameraControl.enableDamping = true // 啟用阻尼效果
    cameraControl.dampingFactor = 0.25 // 阻尼系數

    // 簡單的地板
    const planeGeometry = new THREE.PlaneGeometry(80, 80)
    const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff })
    plane = new THREE.Mesh(planeGeometry, planeMaterial)
    plane.rotation.x = -0.5 * Math.PI
    plane.position.set(0, -7, 0)
    plane.receiveShadow = true
    plane.name = 'floor'
    scene.add(plane)

    // 產生苦力怕物體
    createCreeper()

    // 設置環境光提供輔助柔和白光
    let ambientLight = new THREE.AmbientLight(0x404040)
    scene.add(ambientLight)

    // 設置聚光燈幫忙照亮物體
    let spotLight = new THREE.SpotLight(0xf0f0f0)
    spotLight.position.set(-10, 30, 20)
    // spotLight.castShadow = true
    scene.add(spotLight)

    // 移動點光源
    let pointLight = new THREE.PointLight(0xccffcc, 1, 100) // 顏色, 強度, 距離
    pointLight.castShadow = true // 投影
    pointLight.position.set(-30, 30, 30)
    scene.add(pointLight)

    // dat.GUI 控制面板
    gui = new GUI()
    gui.add(datGUIControls, 'startTracking').onChange(function (e) {
        startTracking = e
        if (invert > 0) { // invert = 1, tween
            if (startTracking) {
                tween.start()
            } else {
                tween.stop()
            }
        } else { // invert = -1, tweenBack
            if (startTracking) {
                tweenBack.start()
            } else {
                tweenBack.stop()
            }
        }
    })

    document.body.appendChild(renderer.domElement)
}

function tweenHandler() {
    let offset = { x: 0, z: 0, rotateY: 0 };
    let target = { x: 20, z: 20, rotatey: 0.7853981633974484 } // 目標值

    const onUpdate = () => {
        //移動
        creeperObj.feet.position.x = offset.x;
        creeperObj.feet.position.z = offset.z;
        creeperObj.head.position.x = offset.x;
        creeperObj.head.position.z = offset.z;
        creeperObj.body.position.x = offset.x;
        creeperObj.body.position.z = offset.z;

        //轉身
        if (target.x > 0) {
            creeperObj.feet.rotation.y = offset.rotateY;
            creeperObj.head.rotation.y = offset.rotateY;
            creeperObj.body.rotation.y = offset.rotateY;
        } else {
            creeperObj.feet.rotation.y = -offset.rotateY
            creeperObj.head.rotation.y = -offset.rotateY
            creeperObj.body.rotation.y = -offset.rotateY
        }
    }

    // 計算新的目標值
    const handleNewTarget = () => {
        //限制苦力怕走路邊界
        if (camera.position.x > 30) target.x = 20
        else if (camera.position.x < -30) target.x = -20
        else target.x = camera.position.x
        if (camera.position.z > 30) target.z = 20
        else if (camera.position.z < -30) target.z = -20
        else target.z = camera.position.z

        const v1 = new THREE.Vector2(0, 1); //圓點面向方向
        const v2 = new THREE.Vector2(target.x, target.z); // 苦力怕面向新相機方向

        // 內積除以純量得兩向量 cos 值
        let cosValue = v1.dot(v2) / (v1.length() * v2.length());

        // 防呆，cos 值區間為（-1, 1）
        if (cosValue > 1) cosValue = 1
        else if (cosValue < -1) cosValue = -1

        // cos 值求轉身角度
        target.rotateY = Math.acos(cosValue)
    }

    // 朝相機移動
    tween = new TWEEN.Tween(offset)
        .to(target, 3000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(onUpdate)
        .onComplete(() => {
            invert = -1
            tweenBack.start();
        })

    //回原點
    tweenBack = new TWEEN.Tween(offset)
        .to({ x: 0, z: 0, rotateY: 0 }, 3000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(onUpdate)
        .onComplete(() => {
            handleNewTarget() // 計算新的目標值
            invert = 1
            tween.start();
        })
}

// 苦力怕原地走動動畫
function creeperFeetWalk() {
    walkSpeed += 0.04
    creeperObj.foot1.rotation.x = Math.sin(walkSpeed) / 4 // 前腳左
    creeperObj.foot2.rotation.x = -Math.sin(walkSpeed) / 4 // 後腳左
    creeperObj.foot3.rotation.x = -Math.sin(walkSpeed) / 4 // 前腳右
    creeperObj.foot4.rotation.x = Math.sin(walkSpeed) / 4 // 後腳左
  }


function render() {
    stats.update()
    cameraControl.update()
    creeperFeetWalk()
    TWEEN.update() // update

    requestAnimationFrame(render)
    renderer.render(scene, camera)
}

window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})

init()
render()
