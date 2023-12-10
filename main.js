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

import { ScoringSystem } from './ScoringSystem.js'

import { playMusic, pauseMusic, crashMusic, coinMusic, audioBike, audioAmbient } from './Sound.js';

const canvas = document.querySelector("canvas");

const renderer = new Renderer(canvas);
await renderer.initialize();
const gltfLoader = new GLTFLoader();
await gltfLoader.load("common/models/scenaImport/pls.gltf");
const score = new ScoringSystem();
export { score };

const scene = gltfLoader.loadScene(gltfLoader.defaultScene);
const camera = scene.find(node => node.getComponentOfType(Camera));
camera.getComponentOfType(Camera).far = 100;
camera.getComponentOfType(Camera).near = 0.05;

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

const light = new Node();
light.addComponent(new Transform({
    translation: [3, 3, 3],
}));
light.addComponent(new Light({
    ambient: 0.5,
}));
scene.addChild(light);

// modeli ovir
models.forEach((model) => {
    if (model.name.includes("Ovira")) {
        ovire.push(model);
        //oviram dodamo boolean, ki pove, če je ovira trenutno prosta za uporabo
        ovire[ovire.length - 1].prosta = true;
        //oviram dodamo atribut, ki pove njen začetni položaj
        // ovire[ovire.length - 1].zacetniXYZ = model.getComponentOfType(Transform).translation.slice();
    }
});

var stProstihOvir = ovire.length;
var stOvir = ovire.length;
var stProstihCoinov = 0;

// Bike
const bike = gltfLoader.loadNode("Bike");
bike.addComponent(new FirstPersonController(bike, document.body, {
    dev: true,
    maxSpeed: 25,
}));

const GAME_SPEED = 10;
var updateSystem;

document.getElementById('main-menu').style.opacity = '0.5';
export let startTime;
export function startGame() {

    //predvajamo glasbo
    playMusic();

    score.startGame();
    // document.getElementById('main-menu').style.display = 'none';
    startTime = performance.now();


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
                duration: GAME_SPEED,
                startTime: 0,
                loop: false,
            }));
            //setTimeout(function () {
            //    model.removeComponent(LinearAnimator);
            //    scene.removeChild(model);
            //}, 10000);
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
                duration: GAME_SPEED,
                startTime: delayIndex * 2,
                loop: true,
            }));
            delayIndex++;
        }
    });

    //////////////////// Konec loop scene ////////////////////

    //////////////////// Luči ////////////////////

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
    }));

    //////////////////// Konec luči ////////////////////

    //////////////////// Sistem ovir ////////////////////


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
                var randomX = Math.random() * 8 - 4;

                // Check if there is already a coin or obstacle at that position
                for (var i = 0; i < coins.length; i++) {
                    if (coins[i].getComponentOfType(Transform).translation[0] === randomX) {
                        // If there is a coin at that position, generate a new position and check again
                        randomX = Math.random() * 8 - 4;
                        i = -1;
                    }
                }

                var threshold = 0.5;

                for (var i = 0; i < ovire.length; i++) {
                    if (Math.abs(ovire[i].getComponentOfType(Transform).translation[0] - randomX) < threshold) {
                        // If there is an obstacle at that position, generate a new position and check again
                        randomX = Math.random() * 8 - 4;
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
            // coins[coins.length - 1].zacetniXYZ = model.getComponentOfType(Transform).translation.slice();
            // coins[coins.length - 1].zacetniXYZ = JSON.parse(JSON.stringify(model.getComponentOfType(Transform).translation));
            // model.zacetniXYZ = model.getComponentOfType(Transform).translation.slice(); // pomojem to bolj pravilno?
            //dodamo rotacijo
            coins[coins.length - 1].addComponent(new RotateAnimator(coins[coins.length - 1], {
                startRotation: [0, 0.70, 0, 1],
                endRotation: [0, -0.70, 0, 1],
                startTime: 0,
                duration: 1,
                loop: true,
            }));
        }
    });
    // console.log(coins[0], coins[0].zacetniXYZ);

    // Spawn first available coin & add LinearAnimator
    function spawnCoin() {

        // Select first available coin
        var chosenCoin;
        coins.forEach(coin => {
            if (coin.prost) {
                chosenCoin = coin;
                return;
            }
        });
        if (!chosenCoin) return;

        chosenCoin.prost = false;

        // Select random x coordinate [-4, 4)
        var randomX = Math.random() * 8 - 4;

        // Check if there is already a coin or obstacle at that position
        for (var i = 0; i < coins.length; i++) {
            if (coins[i].getComponentOfType(Transform).translation[0] === randomX) {
                console.log("PROBLEM:", coins[i]);
                // If there is a coin at that position, generate a new position and check again
                var randomX = Math.random() * 8 - 4;
                i = -1;
            }
        }
        for (var i = 0; i < ovire.length; i++) {
            if (ovire[i].getComponentOfType(Transform).translation[0] === randomX) {
                console.log("PROBLEM:", ovire[i]);
                // If there is an obstacle at that position, generate a new position and check again
                randomX = Math.random() * 10 - 4;
                i = -1;
            }
        }

        chosenCoin.addComponent(new LinearAnimator(chosenCoin, {
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
            duration: GAME_SPEED,
            loop: false,
            startTime: 0,
        }));
    }



    //////////////////// Konec sistema coinov ////////////////////


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

    coins.forEach(coin => {
        coin.isStatic = true;
    });

    ovire.forEach(ovira => {
        ovira.isStatic = true;
    });

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


    let lastExecutionTime = 0;
    const physics = new Physics(scene);
    const timeElement = document.getElementById("time");
    function update(time, dt) {
        timeElement.textContent = `Time: ${Math.floor(time)}`;
        
        // Check if 2 seconds have passed since the last execution
        if (Math.floor(time) - lastExecutionTime >= 2) {
            // console.log(time);

            // Check for any coins with old linear animators to be made available
            coins.forEach(coin => {
                const linearAnimator = coin.getComponentOfType(LinearAnimator);
                if (linearAnimator && linearAnimator.timeElapsed > 13) {
                    coin.removeComponent(linearAnimator);
                    coin.prost = true;
                }
                // console.log(coin.prost);
            });
            spawnCoin();

            lastExecutionTime = Math.floor(time); // Update the last execution time
        }
    
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
    updateSystem = new UpdateSystem({ update, render });
    updateSystem.start();
}

export function updateCoinsPickedDisplay() {
    const coinsPickedElement = document.getElementById("coinsPicked");
    if (coinsPickedElement) {
        coinsPickedElement.textContent = `Coins Picked: ${score.coinsPicked}`;
    }
}

function resetCoin(coin) {
    // Move coin behind bike
    coin.getComponentOfType(Transform).translation[2] = 25;

    // Remove LinearAnimator
    const linearAnimator = coin.getComponentOfType(LinearAnimator);
    if (linearAnimator) {
        coin.removeComponent(linearAnimator);
        coin.prost = true;
    }

    // const rotateAnimator = coin.getComponentOfType(RotateAnimator);
    // coin.removeComponent(rotateAnimator);
}

export function pauseGame() {
    updateSystem.stop();
    pauseMusic();
}



export function resumeGame() {
    updateSystem.start();
    playMusic();
}

function gameOver() {
    pauseGame();
    score.endGame();
    const finalScore = score.calculateScore();
    
    const gameOverScoreElement = document.getElementById("gameOverScore");
    if (gameOverScoreElement) {
        gameOverScoreElement.textContent = `Score: ${finalScore}, Coins: ${score.coinsPicked}`;
    }
    
    console.log(`Score: ${finalScore}, Coins: ${score.coinsPicked}`);
    score.reset();
}

// Check if the page was reloaded
if (localStorage.getItem('reloadFlag')) {
    // Clear the flag
    localStorage.removeItem('reloadFlag');

    startGame();
}

export function restartGame() {
    // Set the flag before reloading
    localStorage.setItem('reloadFlag', 'true');

    location.reload();
}

export function handleCollision(a, b) {
    const collidedObject = a.name === "Bike" ? b : a;
    if (collidedObject.name.includes("Coin")) {
        console.log(collidedObject);
        coinMusic();
        score.pickCoin();
        updateCoinsPickedDisplay();
        resetCoin(collidedObject);
    } else if (collidedObject.name.includes("Ovira")) {
        console.log("GAME OVER");
        pauseMusic();
        crashMusic();
        gameOver();
    }
}
