import { Transform } from '../core.js';

import { vec3 } from '../../../lib/gl-matrix-module.js';

export class LinearAnimator {

    constructor(node, {
        startPosition = [0, 0, 0],
        endPosition = [0, 0, 0],
        startTime = 0,
        duration = 1,
        loop = false,
    } = {}) {
        this.node = node;

        this.startPosition = startPosition;
        this.endPosition = endPosition;

        this.startTime = startTime;
        this.duration = duration;
        this.loop = loop;

        this.playing = true;
        this.lastInterpolation = 0;

        this.timeElapsed = 0;
    }

    play() {
        this.playing = true;
    }

    pause() {
        this.playing = false;
    }

    update(t, dt) {
        this.timeElapsed += dt;
        if (this.timeElapsed < this.startTime) {
            return;
        }

        const linearInterpolation = (this.timeElapsed - this.startTime) / this.duration;
        const clampedInterpolation = Math.min(Math.max(linearInterpolation, 0), 1);
        const loopedInterpolation = ((linearInterpolation % 1) + 1) % 1;
        this.updateNode(this.loop ? loopedInterpolation : clampedInterpolation);
    }

    updateNode(interpolation) {
        const transform = this.node.getComponentOfType(Transform);
        if (!transform) {
            return;
        }

        const isLoopRestarting = interpolation < this.lastInterpolation;

        if (isLoopRestarting) {
            // console.log(this.node.name, "Reset");
        }

        // Update lastInterpolation for the next frame
        this.lastInterpolation = interpolation;

        vec3.lerp(transform.translation, this.startPosition, this.endPosition, interpolation);
    }
}
