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
import { MiddleStepRotateAnimator } from './common/engine/animators/MiddleStepRotateAnimator.js';

const canvas = document.querySelector("canvas");

const renderer = new Renderer(canvas);
await renderer.initialize();
const gltfLoader = new GLTFLoader();
await gltfLoader.load("common/models/scenaImport/pls.gltf");

export function startGame() {
    document.getElementById('main-menu').style.display = 'none';

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
    const coins = [];
    const ovire = [];

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
            setTimeout(function () {
                model.removeComponent(LinearAnimator);
                scene.removeChild(model);
            }, 10000);
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

    //////////////////// Sistem ovir ////////////////////

    // modeli ovir
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
    function spawnObstacle(callback) {
        // Check if there are any free obstacles
        if (stProstihOvir > 0) {
            // Select a random obstacle and check if it's free
            var randomOvira = Math.floor(Math.random() * stOvir);
            if (ovire[randomOvira].prosta) {
                // Add a random timer that tells us when to place the obstacle on the scene - between 1 and 5 seconds and reduce the number of free obstacles
                // Random timer adds a "random component"
                var randomTimer = Math.floor(Math.random() * 5) + 1;
                stProstihOvir--;
                ovire[randomOvira].prosta = false;

                // Add a variance to the x coordinate so that the obstacles are not placed in the same row - between -4 and +6
                var randomX = Math.random() * 10 - 4;

                // Check if there is already a coin or obstacle at that position
                for (var i = 0; i < coins.length; i++) {
                    if (coins[i].getComponentOfType(Transform).translation[0] === randomX) {
                        // If there is a coin at that position, generate a new position and check again
                        randomX = Math.random() * 10 - 4;
                        i = -1;
                    }
                }

                var threshold = 0.5; // Adjust this value as needed

                for (var i = 0; i < ovire.length; i++) {
                    if (Math.abs(ovire[i].getComponentOfType(Transform).translation[0] - randomX) < threshold) {
                        // If there is an obstacle at that position, generate a new position and check again
                        randomX = Math.random() * 10 - 4;
                        i = -1;
                    }
                }

                // Use the timer in the LinearAnimator startTime
                ovire[randomOvira].addComponent(new LinearAnimator(ovire[randomOvira], {
                    startPosition: [
                        prviXYZ[0] + randomX,
                        ovire[randomOvira].getComponentOfType(Transform).translation[1],
                        prviXYZ[2]
                    ],
                    endPosition: [
                        prviXYZ[0] + randomX,
                        ovire[randomOvira].getComponentOfType(Transform).translation[1],
                        prviXYZ[2] + 5 * dolzinaBloka
                    ],
                    duration: 10,
                    loop: false,
                    startTime: randomTimer,
                }));
                // When the obstacle is at the end of the path, we remove the animator and place it at the starting position
                setTimeout(function () {
                    ovire[randomOvira].removeComponent(LinearAnimator);
                    ovire[randomOvira].getComponentOfType(Transform).translation = ovire[randomOvira].zacetniXYZ;
                    ovire[randomOvira].prosta = true;
                    stProstihOvir++;
                    callback();
                }, 10000 + randomTimer * 1000 + 1000);
            }
        }
    }

    function continueSpawningObstacles() {
        var randomInterval = 1000 * (Math.floor(Math.random() * 5) + 1);
        spawnObstacle(function () {
            // Code to be executed after spawnObstacle completes
        });
        setTimeout(continueSpawningObstacles, randomInterval);
    }

    continueSpawningObstacles();

    //////////////////// Konec sistema ovir ////////////////////

    //////////////////// Sistem Coinov ////////////////////

    // modeli coinov
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

    function spawnCoin(callback) {
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
                //var randomTimer = Math.floor(Math.random() * 5) + 1;

                stProstihCoinov--;
                coins[izbranCoin].prost = false;

                //dodamo varianco x koordinate, da se ovire ne postavijo v isto vrsto - med -4 in +6
                var randomX = Math.random() * 10 - 4;

                // Check if there is already a coin or obstacle at that position
                for (var i = 0; i < coins.length; i++) {
                    if (coins[i].getComponentOfType(Transform).translation[0] === randomX) {
                        // If there is a coin at that position, generate a new position and check again
                        randomX = Math.random() * 10 - 4;
                        i = -1;
                    }
                }

                for (var i = 0; i < ovire.length; i++) {
                    if (ovire[i].getComponentOfType(Transform).translation[0] === randomX) {
                        // If there is an obstacle at that position, generate a new position and check again
                        randomX = Math.random() * 10 - 4;
                        i = -1;
                    }
                }

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
                    startTime: 0,
                }));
                //ko je coin na koncu poti, mu odstranimo animator in ga postavimo na začetni položaj
                var currentCoin = izbranCoin;
                setTimeout(function () {
                    coins[currentCoin].removeComponent(LinearAnimator);
                    coins[currentCoin].getComponentOfType(Transform).translation = coins[currentCoin].zacetniXYZ;
                    // console.log(coins[currentCoin].getComponentOfType(Transform).translation); // Check the value immediately after setting it
                    coins[currentCoin].prost = true;
                    stProstihCoinov++;
                }, 10000 + 1000);
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

        // Assuming spawnCoin is an asynchronous operation (e.g., with animations)
        // Call the callback function when the operation is complete
        setTimeout(function () {
            callback();
        }, 10000 + 1000 /* Time needed for the operation to complete */);
    }

    function continueSpawning() {
        var randomInterval = 1000 * (Math.floor(Math.random() * 5) + 1);
        spawnCoin(function () {
            // Code to be executed after spawnCoin completes
        });
        setTimeout(continueSpawning, randomInterval);
    }

    continueSpawning();

    //////////////////// Konec sistema coinov ////////////////////

    // Bike
    const bike = gltfLoader.loadNode("Bike");
    bike.addComponent(new FirstPersonController(bike, document.body, {
        dev: true,
        maxSpeed: 25,
        // pitch: -0.3,
    }));

    //////////////////// Animacija kolesarja ////////////////////

    bike.find(node => node.name === "Sprednje_kolo").addComponent(new RotateAnimator(bike.find(node => node.name === "Sprednje_kolo"), {
        startRotation: [0, 0, 0, 1],
        endRotation: [-0.25, 0, 0, 1],
        startTime: 0,
        duration: 0.1,
        loop: true,
    }));
    bike.find(node => node.name === "Zadnje_Kolo").addComponent(new RotateAnimator(bike.find(node => node.name === "Zadnje_Kolo"), {
        startRotation: [0, 0, 0, 1],
        endRotation: [-0.25, 0, 0, 1],
        startTime: 0,
        duration: 0.1,
        loop: true,
    }));
    //dobimo node Noga_desna in dodamo middlesteprotateanimator
    //console.log(bike.find(node => node.name === "Noga_desna"));
    bike.find(node => node.name === "Noga_desna").addComponent(new MiddleStepRotateAnimator(bike.find(node => node.name === "Noga_desna"), {
        startRotation: [0.10, 0, 0, 1],
        middleRotation: [-0.15, -0.02, 0.02, 1],
        endRotation: [0.10, 0, 0, 1],
        startTime: 0,
        duration: 1,
        loop: true,
    }));
    //dobimo node Noga_leva in dodamo middlesteprotateanimator
    //console.log(bike.find(node => node.name === "Noga_leva"));
    bike.find(node => node.name === "Noga_leva").addComponent(new MiddleStepRotateAnimator(bike.find(node => node.name === "Noga_leva"), {
        startRotation: [-0.05, 0.05, -0.02, 1],
        middleRotation: [0.25, 0, 0, 1],
        endRotation: [-0.05, 0.05, -0.02, 1],
        startTime: 0,
        duration: 1,
        loop: true,
    }));
    //dobimo node Balanca in dodamo middlesteprotateanimator
    //console.log(bike.find(node => node.name === "Balanca"));
    bike.find(node => node.name === "Balanca").addComponent(new MiddleStepRotateAnimator(bike.find(node => node.name === "Balanca"), {
        startRotation: [0, 0.05, 0, 1],
        middleRotation: [0, -0.05, 0, 1],
        endRotation: [0, 0.05, 0, 1],
        startTime: 0,
        duration: 1,
        loop: true,
    }));
    //dobimo node kolo in mu dodamo middlesteprotateanimator
    //console.log(bike.find(node => node.name === "Bike"));
    //bike.find(node => node.name === "Bike").addComponent(new MiddleStepRotateAnimator(bike.find(node => node.name === "Bike"), {
    //    startRotation: [0, 0, 0.02, 1],
    //    middleRotation: [0, 0, -0.02, 1],
    //    endRotation: [0, 0, 0.02, 1],
    //    startTime: 0,
    //    duration: 1,
    //    loop: true,
    //}));
    //dobimo node Pedala in mu dodamo middlesteprotateanimator
    //console.log(bike.find(node => node.name === "Pedala"));
    bike.find(node => node.name === "Pedala").addComponent(new MiddleStepRotateAnimator(bike.find(node => node.name === "Pedala"), {
        startRotation: [0.4, 0, 0, 1],
        middleRotation: [-0.4, 0, 0, 1],
        endRotation: [0.4, 0, 0, 1],
        startTime: 0,
        duration: 1,
        loop: true,
    }));
    //dobimo node kolesar in mu dodamo middlesteprotateanimator
    //console.log(bike.find(node => node.name === "Kolesar"));
    const kolesar = bike.find(node => node.name === "Kolesar");
    bike.find(node => node.name === "Kolesar").addComponent(new MiddleStepRotateAnimator(bike.find(node => node.name === "Kolesar"), {
        startRotation: [0, 0, 0.01, 1],
        middleRotation: [0, 0, -0.01, 1],
        endRotation: [0, 0, 0.01, 1],
        startTime: 0,
        duration: 1,
        loop: true,
    }));

    //////////////////// Konec animacij kolesarja ////////////////////

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

}