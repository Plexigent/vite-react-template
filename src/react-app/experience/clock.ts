type FrameSource = {
    request: (callback: FrameRequestCallback) => number;
    cancel: (id: number) => void;
};
/** Active visible time only. One pending frame, no timers, no hidden wall time. */
export class MotionClock {
    elapsed = 0;
    running = false;
    private pending = 0;
    private previous: number | null = null;
    private paused = false;
    private duration = 0;
    private draw: (seconds: number) => void = () => { };
    private complete: () => void = () => { };
    private source: FrameSource;
    constructor(source: FrameSource = {
        request: callback => window.requestAnimationFrame(callback),
        cancel: id => window.cancelAnimationFrame(id),
    }) {
        this.source = source;
    }
    start(duration: number, draw: (seconds: number) => void, complete = () => { }, initial = 0) {
        this.stop();
        this.duration = duration;
        this.elapsed = Math.min(initial, duration);
        this.draw = draw;
        this.complete = complete;
        this.running = this.elapsed < duration;
        draw(this.elapsed);
        if (this.running)
            this.schedule();
        else
            complete();
    }
    pause(paused: boolean) {
        if (this.paused === paused)
            return;
        this.paused = paused;
        this.cancel();
        if (!paused)
            this.schedule();
    }
    finish() {
        if (!this.running)
            return;
        this.cancel();
        this.elapsed = this.duration;
        this.running = false;
        this.draw(this.elapsed);
        this.complete();
    }
    stop() {
        this.running = false;
        this.cancel();
    }
    private cancel() {
        if (this.pending)
            this.source.cancel(this.pending);
        this.pending = 0;
        this.previous = null;
    }
    private schedule() {
        if (this.running && !this.paused && !this.pending)
            this.pending = this.source.request(this.tick);
    }
    private tick = (now: number) => {
        this.pending = 0;
        if (!this.running || this.paused)
            return;
        if (this.previous !== null)
            this.elapsed = Math.min(this.duration, this.elapsed + (now - this.previous) / 1000);
        this.previous = now;
        this.draw(this.elapsed);
        if (this.elapsed >= this.duration) {
            this.running = false;
            this.previous = null;
            this.complete();
        }
        else
            this.schedule();
    };
}
