import { Transform } from '../core.js';
import { quat } from '../../../lib/gl-matrix-module.js';

export class MiddleStepRotateAnimator {
    constructor(node, {
        startRotation = [0, 0, 0, 1],
        middleRotation = [0, 0, 0, 1],
        endRotation = [0, 0, 0, 1],
        startTime = 0,
        duration = 1,
        loop = false,
    } = {}) {
        this.node = node;
        this.startRotation = quat.fromValues(...startRotation);
        this.middleRotation = quat.fromValues(...middleRotation);
        this.endRotation = quat.fromValues(...endRotation);
        this.startTime = startTime;
        this.duration = duration;
        this.loop = loop;
        this.playing = true;
    }

    play() {
        this.playing = true;
    }

    pause() {
        this.playing = false;
    }

    update(t, dt) {
        if (!this.playing) {
            return;
        }

        const linearInterpolation = (t - this.startTime) / this.duration;
        const clampedInterpolation = Math.min(Math.max(linearInterpolation, 0), 1);
        const loopedInterpolation = ((linearInterpolation % 1) + 1) % 1;
        this.updateNode(this.loop ? loopedInterpolation : clampedInterpolation);
    }

    updateNode(interpolation) {
        const transform = this.node.getComponentOfType(Transform);
        if (!transform) {
            return;
        }

        let result = quat.create();
        if (interpolation < 0.5) {
            quat.slerp(result, this.startRotation, this.middleRotation, interpolation * 2);
        } else {
            quat.slerp(result, this.middleRotation, this.endRotation, (interpolation - 0.5) * 2);
        }
        transform.rotation = result;
    }
}