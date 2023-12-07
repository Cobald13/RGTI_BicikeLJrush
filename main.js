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
import { MiddleStepAnimator } from './common/engine/animators/MiddleStepAnimator.js';

const canvas = document.querySelector("canvas");

const renderer = new Renderer(canvas);
await renderer.initialize();
const gltfLoader = new GLTFLoader();
await gltfLoader.load("common/models/scenaImport/pls.gltf");

const scene = gltfLoader.loadScene(gltfLoader.defaultScene);
const camera = scene.find(node => node.getComponentOfType(Camera));
camera.getComponentOfType(Camera).far = 100;


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

//////////////////// Luči ////////////////////

const light = new Node();
light.addComponent(new Transform({
    translation: [3, 3, 3],
}));
light.addComponent(new Light({
    ambient: 0.5,
}));
light.addComponent(new LinearAnimator(light, {
    //začetna lokacija je lokacija luči z imenom Luč.002
    startPosition: [
        models.find(obj => obj.name === "Luč.002").getComponentOfType(Transform).translation[0],
        models.find(obj => obj.name === "Luč.002").getComponentOfType(Transform).translation[1] + 2,
        models.find(obj => obj.name === "Luč.002").getComponentOfType(Transform).translation[2] - 8
    ],
    endPosition: [
        models.find(obj => obj.name === "Luč.002").getComponentOfType(Transform).translation[0],
        models.find(obj => obj.name === "Luč.002").getComponentOfType(Transform).translation[1] + 2,
        models.find(obj => obj.name === "Luč.002").getComponentOfType(Transform).translation[2] - 8 + dolzinaBloka
    ],
    duration: 2,
    loop: true,
}))
scene.addChild(light);

//////////////////// Konec luči ////////////////////

//////////////////// Preverjanje colisionov ovir in coinov ////////////////////

//shranimo si zadnji 2 oviri in zadnji 2 coina
var zadnjiOviri = [];
var zadnjiCoini = [];

//////////////////// Konec preverjanja colisionov ovir in coinov ////////////////////

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
                    prviXYZ[1] + 1,
                    prviXYZ[2]
                ],
                endPosition: [
                    prviXYZ[0] + randomX,
                    prviXYZ[1] + 1,
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
                // console.log(ovire[randomOvira].getComponentOfType(Transform).translation); // Check the value immediately after setting it
                ovire[randomOvira].prosta = true;
                stProstihOvir++;
            }, 10000 + randomTimer * 1000 + 1000);
        }
        else {
            //če ovira ni prosta, ponovimo zanko
            // console.log("ovira ni prosta");
            return;
        }
    }
    else {
        //če ni prostih ovir, ponovimo zanko
        return;
    }
}, 1000 * (Math.floor(Math.random() * 5) + 1));

//////////////////// Konec sistema ovir ////////////////////

//////////////////// Sistem Coinov ////////////////////

// modeli coinov
const coins = [];
models.forEach((model) => {
    if (model.name.includes("Coin")) {
        coins.push(model);
        //coinom dodamo boolean, ki pove, če je coin trenutno prosta za uporabo
        coins[coins.length - 1].prost = true;
        //coinom dodamo atribut, ki pove njen začetni položaj
        coins[coins.length - 1].zacetniXYZ = model.getComponentOfType(Transform).translation.slice();
        //dodamo rotacijo
        coins[coins.length - 1].addComponent(new RotateAnimator(coins[coins.length - 1], {
            startRotation: [0, 0.70, 0, 1],
            endRotation: [0, -0.70, 0, 1],
            startTime: 0,
            duration: 1,
            loop: true,
        }));
        /*trenutno "bobbing" animacijo prekine LinearAnimator
        coins[coins.length - 1].addComponent(new MiddleStepAnimator(coins[coins.length - 1], {
            startPosition: [
                coins[coins.length - 1].getComponentOfType(Transform).translation[0],
                coins[coins.length - 1].getComponentOfType(Transform).translation[1],
                coins[coins.length - 1].getComponentOfType(Transform).translation[2]
            ],
            middlePosition: [
                coins[coins.length - 1].getComponentOfType(Transform).translation[0],
                coins[coins.length - 1].getComponentOfType(Transform).translation[1] + 0.5,
                coins[coins.length - 1].getComponentOfType(Transform).translation[2]
            ],
            endPosition: [
                coins[coins.length - 1].getComponentOfType(Transform).translation[0],
                coins[coins.length - 1].getComponentOfType(Transform).translation[1],
                coins[coins.length - 1].getComponentOfType(Transform).translation[2]
            ],
            startTime: 0,
            duration: 1,
            loop: true,
        }));
        */
    }
});

var stProstihCoinov = coins.length;
var stCoinov = coins.length;
var izbranCoin = 0;

//izvajamo zanko v neskončnost vsake 1 - 5 sekund
setInterval(function () {
    if (izbranCoin == stCoinov) {
        izbranCoin = 0;
    }
    //preverimo, če je število prostih coinov večje od 0
    if (stProstihCoinov > 0) {
        //izberemo prvi coin v arrayu in preverimo, če je prost
        //če ni prost, izberemo naslednjega, dokler ni izbran prost coin
        if (izbranCoin < stCoinov && coins[izbranCoin].prost) {
            // console.log("coin " + izbranCoin + " je prost")
            //dodamo naključen timer, ki pove, čez koliko časa bomo oviro postavili na sceno - med 1 in 5 sekund in zmanjšamo število prostih ovir
            //random timer doda "naključno z komponento"
            var randomTimer = Math.floor(Math.random() * 5) + 1;
            stProstihCoinov--;
            coins[izbranCoin].prost = false;

            //dodamo varianco x koordinate, da se ovire ne postavijo v isto vrsto - med -4 in +6
            var randomX = Math.random() * 10 - 4;

            //timer uporabimo v LinearAnimatorju startTime
            coins[izbranCoin].addComponent(new LinearAnimator(coins[izbranCoin], {
                startPosition: [
                    prviXYZ[0] + randomX,
                    prviXYZ[1] + 1.2,
                    prviXYZ[2]
                ],
                endPosition: [
                    prviXYZ[0] + randomX,
                    prviXYZ[1] + 1.2,
                    prviXYZ[2] + 5 * dolzinaBloka
                ],
                duration: 10,
                loop: false,
                startTime: randomTimer,
            }));
            //ko je coin na koncu poti, mu odstranimo animator in ga postavimo na začetni položaj
            var currentCoin = izbranCoin;
            setTimeout(function () {
                coins[currentCoin].removeComponent(LinearAnimator);
                coins[currentCoin].getComponentOfType(Transform).translation = coins[currentCoin].zacetniXYZ;
                // console.log(coins[currentCoin].getComponentOfType(Transform).translation); // Check the value immediately after setting it
                coins[currentCoin].prost = true;
                stProstihCoinov++;
            }, 10000 + randomTimer * 1000 + 1000);
            izbranCoin++;
        }
        else {
            //če coin ni prost, izberemo naslednjega
            // console.log("coin " + izbranCoin + " ni prost");
            izbranCoin++;
        }
    }
    else {
        //če ni prostih coinov, ponovimo zanko
        return;
    }   //timeout nastavimo med 1 in 5 sekundami
}, 1000 * (Math.floor(Math.random() * 5) + 1));

//////////////////// Konec sistema coinov ////////////////////

// Bike
const bike = gltfLoader.loadNode("Bike");
bike.addComponent(new FirstPersonController(bike, document.body, {
    dev: false,
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


