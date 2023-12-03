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

// dobimo vse modele
const models = scene.filter(node => node.getComponentOfType(Model));

//////////////////// Loop scene ////////////////////

// modeli scene
const scena = [];
models.forEach((model) => {
    if (model.name.includes("Landscape") || model.name.includes("Start")) {
        scena.push(model);
    }
});


// sortiramo modele po imenu
scena.sort((a, b) => {
    const aIndex = parseInt(a.name.split('.')[1]);
    const bIndex = parseInt(b.name.split('.')[1]);
    return aIndex - bIndex;
});

const prviBlok = models.find(obj => obj.name === "Landscape.001");
const prviXYZ = prviBlok.getComponentOfType(Transform).translation.slice();
const dolzinaBloka = prviBlok.getComponentOfType(Transform).translation[2] - models.find(obj => obj.name === "Landscape.002").getComponentOfType(Transform).translation[2];

var delayIndex = 0;
scena.forEach((model) => {
    //ce je ime bloka Start, se ne bo loopal
    if (model.name.includes("Start")) {
        model.addComponent(new LinearAnimator(model, {
            startPosition: [
                model.getComponentOfType(Transform).translation[0],
                model.getComponentOfType(Transform).translation[1],
                model.getComponentOfType(Transform).translation[2]
            ],
            endPosition: [
                model.getComponentOfType(Transform).translation[0],
                model.getComponentOfType(Transform).translation[1],
                model.getComponentOfType(Transform).translation[2] + 
                    5 * dolzinaBloka
            ],
            duration: 10,
            startTime: 0,
            loop: false,
        }));
    }
    else {
        model.addComponent(new LinearAnimator(model, {
            startPosition: [
                prviBlok.getComponentOfType(Transform).translation[0],
                prviBlok.getComponentOfType(Transform).translation[1],
                prviBlok.getComponentOfType(Transform).translation[2]
            ],
            endPosition: [
                prviBlok.getComponentOfType(Transform).translation[0],
                prviBlok.getComponentOfType(Transform).translation[1],
                prviBlok.getComponentOfType(Transform).translation[2] + 
                    5 * dolzinaBloka
            ],
            duration: 10,
            startTime: delayIndex * 2,
            loop: true,
        }));
        delayIndex++;
    }
});

//////////////////// Konec loop scene ////////////////////

//////////////////// Sistem ovir ////////////////////

// modeli ovir
const ovire = [];
models.forEach((model) => {
    if (model.name.includes("Ovira")) {
        ovire.push(model);
        //oviram dodamo boolean, ki pove, če je ovira trenutno prosta za uporabo
        ovire[ovire.length - 1].prosta = true;
        //oviram dodamo atribut, ki pove njen začetni položaj
        ovire[ovire.length - 1].zacetniXYZ = model.getComponentOfType(Transform).translation.slice();
    }
});

var stProstihOvir = ovire.length;
var stOvir = ovire.length;

//izvajamo zanko v neskončnost vsake 1 - 5 sekund
setInterval(function () {
    //preverimo, če je število prostih ovir večje od 0
    if (stProstihOvir > 0) {
        //izberemo naključno oviro in preverimo, če je prosta
        var randomOvira = Math.floor(Math.random() * stOvir);
        if (ovire[randomOvira].prosta) {

            //dodamo naključen timer, ki pove, čez koliko časa bomo oviro postavili na sceno - med 1 in 5 sekund in zmanjšamo število prostih ovir
            //random timer doda "naključno z komponento"
            var randomTimer = Math.floor(Math.random() * 5) + 1;
            stProstihOvir--;
            ovire[randomOvira].prosta = false;

            //dodamo varianco x koordinate, da se ovire ne postavijo v isto vrsto - med -4 in +6
            var randomX = Math.random() * 10 - 4;

            //timer uporabimo v LinearAnimatorju startTime
            ovire[randomOvira].addComponent(new LinearAnimator(ovire[randomOvira], {
                startPosition: [
                    prviXYZ[0] + randomX,
                    prviXYZ[1],
                    prviXYZ[2]
                ],
                endPosition: [
                    prviXYZ[0] + randomX,
                    prviXYZ[1],
                    prviXYZ[2] + 5 * dolzinaBloka
                ],
                duration: 10,
                loop: false,
                startTime: randomTimer,
            }));
            //ko je ovira na koncu poti, ji odstranimo animator in jo postavimo na začetni položaj
            setTimeout(function () {
                ovire[randomOvira].removeComponent(LinearAnimator);
                ovire[randomOvira].getComponentOfType(Transform).translation = ovire[randomOvira].zacetniXYZ;
                console.log(ovire[randomOvira].getComponentOfType(Transform).translation); // Check the value immediately after setting it
                ovire[randomOvira].prosta = true;
                stProstihOvir++;
            }, 10000 + randomTimer * 1000 + 1000);
        }
        else {
            //če ovira ni prosta, ponovimo zanko
            console.log("ovira ni prosta");
            return;
        }
    }
    else {
        //če ni prostih ovir, ponovimo zanko
        return;
    }
}, 1000 * (Math.floor(Math.random() * 5) + 1));

//////////////////// Konec sistema ovir ////////////////////

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
