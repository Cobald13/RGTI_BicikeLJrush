import { ResizeSystem } from './common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from './common/engine/systems/UpdateSystem.js';

import { OrbitController } from './common/engine/controllers/OrbitController.js';
import { FirstPersonController } from './common/engine/controllers/FirstPersonController.js';
import { TurntableController } from './common/engine/controllers/TurntableController.js';
import { RotateAnimator } from './common/engine/animators/RotateAnimator.js';

import { GLTFLoader } from './common/engine/loaders/GLTFLoader.js';

import { Renderer } from './Renderer.js'

import { Light } from './Light.js';

import { LinearAnimator } from './common/engine/animators/LinearAnimator.js';

import {
    calculateAxisAlignedBoundingBox,
    mergeAxisAlignedBoundingBoxes,
} from './common/engine/core/MeshUtils.js';
import { Physics } from './Physics.js';

import {
    Camera,
    Model,
    Node,
    Transform,
} from './common/engine/core.js';

const canvas = document.querySelector("canvas");

const renderer = new Renderer(canvas);
await renderer.initialize();

const gltfLoader = new GLTFLoader();
await gltfLoader.load("common/models/scenaImport/pls.gltf");

const scene = gltfLoader.loadScene(gltfLoader.defaultScene);
const camera = scene.find(node => node.getComponentOfType(Camera));
camera.getComponentOfType(Camera).far = 1000;

// Light
const light = new Node();
light.addComponent(new Transform({
    translation: [3, 3, 3],
}));
light.addComponent(new Light({
    ambient: 0.3,
}));
//light.addComponent(new LinearAnimator(light, {
//    startPosition: [3, 3, 3],
//    endPosition: [-3, -3, -3],
//    duration: 5,
//    loop: true,
//}))
scene.addChild(light);

// Scene scroll
// dobimo vse modele
const models = scene.filter(node => node.getComponentOfType(Model));

const block_1 = models.find(obj => obj.name === "Landscape.001");
const block_2 = models.find(obj => obj.name === "Landscape.002");
const block_3 = models.find(obj => obj.name === "Landscape.003");

// Add linear animator to landscape blocks
var delayIndex = 0;
models.forEach((model) => {
    if (model.name.startsWith("Landscape")) {
        model.addComponent(new LinearAnimator(model, {
            startPosition: [
                block_1.getComponentOfType(Transform).translation[0],
                block_1.getComponentOfType(Transform).translation[1],
                block_1.getComponentOfType(Transform).translation[2]
            ],
            endPosition: [
                block_1.getComponentOfType(Transform).translation[0],
                block_1.getComponentOfType(Transform).translation[1],
                block_1.getComponentOfType(Transform).translation[2] + 
                    5 * (block_2.getComponentOfType(Transform).translation[2] - block_3.getComponentOfType(Transform).translation[2])
            ],
            duration: 10,
            startTime: delayIndex * 2,
            loop: true,
        }));
        delayIndex++;
    }
});

// Bike
const bike = gltfLoader.loadNode("Bike");
bike.addComponent(new FirstPersonController(bike, document.body, {
    dev: true,
    maxSpeed: 25,
    // pitch: -0.3,
}));

// Collision detection
bike.isDynamic = true;
// bike.aabb = {
//     min: [-0.2, -0.2, -0.2],
//     max: [0.2, 0.2, 0.2],
// };

// Obstacles - static
gltfLoader.loadNode("Cube.000").isStatic = true;
gltfLoader.loadNode("Box.000").isStatic = true;
gltfLoader.loadNode("Monkey.000").isStatic = true;

const physics = new Physics(scene);
scene.traverse(node => {
    const model = node.getComponentOfType(Model);
    if (!model) {
        return;
    }

    const boxes = model.primitives.map(primitive => calculateAxisAlignedBoundingBox(primitive.mesh));
    // console.log(boxes.length, node.name, model.primitives);

    // Bike
    if (boxes.length == 2) {
        node.aabb = mergeAxisAlignedBoundingBoxes([boxes[0]]);
    }
    // Obstacles
    if (boxes.length == 1) {
        node.aabb = mergeAxisAlignedBoundingBoxes(boxes);
    }
});


function update(time, dt) {
    // Move bike & camera forwards
    // bike.getComponentOfType(Transform).translation[2] -= dt*3
    // camera.getComponentOfType(Transform).translation[2] -= dt*3

    scene.traverse(node => {
        for (const component of node.components) {
            component.update?.(time, dt);
        }
    });

    physics.update(time, dt);
}

function render() {
    renderer.render(scene, camera);
}

function resize({ displaySize: { width, height } }) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();
