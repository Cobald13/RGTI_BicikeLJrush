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
    Camera,
    Model,
    Node,
    Transform,
} from './common/engine/core.js';

const canvas = document.querySelector('canvas');

const renderer = new Renderer(canvas);
await renderer.initialize();

const gltfLoader = new GLTFLoader();
await gltfLoader.load("common/models/scenaImport/pls.gltf");

const scene = gltfLoader.loadScene(gltfLoader.defaultScene);
const camera = scene.find(node => node.getComponentOfType(Camera));
// const camera = gltfLoader.loadNode('Camera');

camera.addComponent(new TurntableController(camera, document.body, {
    distance: 8,
}));
camera.getComponentOfType(Camera).far = 1000
// camera.addComponent(new Transform({
//     translation: [0, 1, 10],
// }));

// Example: load from 2nd file
// const gltfLoader1 = new GLTFLoader();
// await gltfLoader1.load("common/models/scenaImport/new/tmp/test.gltf");
// const test = gltfLoader1.loadNode('test');
// scene.addChild(test)

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

//we get all the models from the scene
const models = scene.filter(node => node.getComponentOfType(Model));
//we add linear animator to each model
//to each model we add a different loop delay - first we loop the first model, then the second, then the third...
models.forEach((model, index) => {
    model.addComponent(new LinearAnimator(model, {
        startPosition: [model.getComponentOfType(Transform).translation[0], model.getComponentOfType(Transform).translation[1], model.getComponentOfType(Transform).translation[2]],
        endPosition: [model.getComponentOfType(Transform).translation[0], model.getComponentOfType(Transform).translation[1], model.getComponentOfType(Transform).translation[2] + 20],
        duration: 10,
        startTime: index * 10,
        loop: true,
    }));
});

// Move the first model behind the camera and keep it there
//models[2].addComponent(new LinearAnimator(models[2], {
//    startPosition: [models[2].getComponentOfType(Transform).translation[0], models[2].getComponentOfType(Transform).translation[1], models[2].getComponentOfType(Transform).translation[2]],
//    endPosition: [models[2].getComponentOfType(Transform).translation[0], models[2].getComponentOfType(Transform).translation[1], models[2].getComponentOfType(Transform).translation[2] + 120],
//    startTime: 0,
//    duration: 10,
//    loop: false,
//}));
//
//// Move the rest of the models in a loop from behind the camera to the front
//for (let i = 0; i < models.length; i++) {
//    if (i == 2) {
//        continue;
//    }
//    models[i].addComponent(new LinearAnimator(models[i], {
//        startPosition: [models[3].getComponentOfType(Transform).translation[0], models[3].getComponentOfType(Transform).translation[1], models[3].getComponentOfType(Transform).translation[2]],
//        endPosition: [models[3].getComponentOfType(Transform).translation[0], models[3].getComponentOfType(Transform).translation[1], models[3].getComponentOfType(Transform).translation[2] + 120],
//        startTime: 0, // Adjust the delay based on your requirements
//        duration: 10,
//        loop: true,
//    }));
//}

const bike = gltfLoader.loadNode('Bike');
// Don't move bike with the scene
bike.removeComponent(bike.getComponentOfType(LinearAnimator))
console.log("BIKE:", bike);
// const startPosition = bike.getComponentOfType(Transform).translation
// console.log(startPosition)

// Controls: Left/Right arrow pressed
// (linear animator doesn't work...)
document.addEventListener('keydown', function(event) {
    if (event.key === 'ArrowLeft' || event.code === 'ArrowLeft') {
        console.log("Left arrow key pressed!");
        
        // linearAnimatorComponent.startPosition = [bike.getComponentOfType(Transform).translation[0], bike.getComponentOfType(Transform).translation[1], bike.getComponentOfType(Transform).translation[2], 1];
        // linearAnimatorComponent.endPosition = [bike.getComponentOfType(Transform).translation[0], bike.getComponentOfType(Transform).translation[1], bike.getComponentOfType(Transform).translation[2]-1, 1];
        // linearAnimatorComponent.duration = 5;

        // bike.addComponent(new LinearAnimator(bike, {
        //     startPosition: [bike.getComponentOfType(Transform).translation[0], bike.getComponentOfType(Transform).translation[1], bike.getComponentOfType(Transform).translation[2], 1],
        //     endPosition: [bike.getComponentOfType(Transform).translation[0]-1, bike.getComponentOfType(Transform).translation[1], bike.getComponentOfType(Transform).translation[2], 1],
        //     duration: 5,
        // }))
        // bike.removeComponent(bike.getComponentOfType(LinearAnimator))
        // console.log("linear animators:", bike.getComponentsOfType(LinearAnimator));

        bike.getComponentOfType(Transform).translation[0] += -1
    } else if (event.key === 'ArrowRight' || event.code === 'ArrowRight') {
        console.log("Right arrow key pressed!");

        // bike.addComponent(new LinearAnimator(bike, {
        //     startPosition: [bike.getComponentOfType(Transform).translation[0], bike.getComponentOfType(Transform).translation[1], bike.getComponentOfType(Transform).translation[2], 1],
        //     endPosition: [bike.getComponentOfType(Transform).translation[0]+1, bike.getComponentOfType(Transform).translation[1], bike.getComponentOfType(Transform).translation[2], 1],
        //     duration: 5,
        // }))
        // bike.removeComponent(bike.getComponentOfType(LinearAnimator))

        bike.getComponentOfType(Transform).translation[0] += 1
    }  else if (event.key === 'ArrowUp' || event.code === 'ArrowUp') {

        // Camera transformations - testing (remove TurntableController component)
        camera.getComponentOfType(Transform).translation[2] -= 1;
        camera.getComponentOfType(Camera).fovy = 1.5;
        console.log(camera);
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
}

function render() {
    renderer.render(scene, camera);
}

function resize({ displaySize: { width, height } }) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();