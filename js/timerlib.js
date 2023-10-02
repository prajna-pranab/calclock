//	Timer library using  the performance API and requestAnimationFrame()
// by Prajna Pranab
// version 0.1.1
//
// durations, delays and intervals are given in milliseconds to +/- 5 microsecond
// accuracy (though browsers that don't support HiDef timestamps may round to the
// nearest millisecond) so you can use, eg, interval = new schedule(0.5, myCallback)
// to call myCallback every 500 microseconds
//
// for more info see the
// <a href='http://tomboy-pink.co.uk/codelib/timerlib/index.html'>documentation</a>

// general purpose timer object ------------------------------------------------
// default duration = 200ms
// either set the duration when instanting or use, eg, myTimer.duration = 2000;
// call with const myTimer = new timer(requestAnimationFrame(callback));
// timer doesn't start until myTimer.progress() or myTimer.ease() is called
class timer {
	constructor(id, duration=200) {
		this.id = id;
		this.duration = duration;
		this.done = false;
	}
	// update the timer entry
	track() {
		const [entry] = performance.getEntriesByName(this.id);
		if (!entry) {
			// create a new entry if there isn't one yet
			performance.mark(this.id);
			return 0;
		}
		// return the elapsed time
		return performance.now() - entry.startTime;
	}
	// get elapsed time from the tracker, convert to 0.0 < progress < 1.0
	progress() {
		const percent = Math.min(this.track() / this.duration, 1);
		// when it reaches 1 we're done
		if (percent == 1) {
			// remove the entry
			performance.clearMarks(this.id);
			this.done = true;
		}
		return percent;
	};
	// easing functions convert progress to eased progress
	ease(fn) {
		const p = this.progress();
		switch(fn) {
			case 'easeIn': return p * p;
			case 'easeOut': return p * (2 - p);
			case 'bezier': return p * p * (3 - 2 * p);
			case 'parametric': return (p * p) / (2 * (p * p - p) + 1);
			case 'parabola': return -p + (.5 * p * p);
		}
	}
}

// schedue a callback function to be called after a delay ----------------------
// replaces setTimeout()
// call with mySchedule = new schedule(delay, callback[, ...args]);
// then you can mySchedule.pause() or mySchedule.cancel()
// use delayCall() instead if you don't need to cancel etc
// timer starts when assigned
class schedule {
	constructor(delay, callback, ...args) {
		this._delay = delay;
		this.originalDelay = delay;
		this.callback = callback;
		this.args = args;
		this.canceled = false;
		this.paused = false;
		this.start = performance.now();
		requestAnimationFrame(this.loop.bind(this));
	}
	get delay() { return this._delay; }
	set delay(period) {
		this._delay = period;
		this.originalDelay = period;
	}
	loop() {
		if (this.canceled || this.paused) return;
		if (performance.now() - this.start < this._delay)
			requestAnimationFrame(this.loop.bind(this));
		else this.callback.call(this, ...this.args);
	}
	cancel() {
		this.canceled = true;
	}
	pause() {
		this._delay = performance.now() - this.start;
		this.paused = true;
	}
	play() {
		this.start = performance.now();
		this.paused = false;
		requestAnimationFrame(this.loop.bind(this));
	}
	reset() {
		this._delay = this.originalDelay;
		this.canceled = false;
		this.start = performance.now();
	}
}

// schedule a callback function to repeat --------------------------------------
// replaces setInterval()
// call with mySchedule = new schedules(interval, callback[, ...args]);
// timer starts when assigned
// call mySchedule.cancel() to stop
class schedules  extends schedule {
	constructor(period, callback, ...args) {
		super(period, callback, ...args);
	}
	get interval() { return super.delay; }
	set interval(period) { super.delay = period; }
	loop() {
		if (this.canceled || this.paused) return;
		if (performance.now() - this.start < this._delay)
			requestAnimationFrame(this.loop.bind(this));
		else {
			this.callback.call(this, ...this.args);
			this.reset();
			requestAnimationFrame(this.loop.bind(this));
		}
	}
}

// minimal replacement for setTimeout() ----------------------------------------
// more accurate and kinder to batteries, automatically paused when minimised
// call with delayCall(delay, callback[, ...args])
const delayCall = (delay, callback, ...args) => {
	const loop = () => {
		if (performance.now() - start < delay)
			requestAnimationFrame(loop);
		else callback.call(this, ...args);
	};
	const start = performance.now();
	requestAnimationFrame(loop);
}
