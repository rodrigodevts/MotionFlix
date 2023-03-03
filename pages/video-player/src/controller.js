export default class Controller {
	#view
	#worker
	#camera
	#blinkCounter = 0
	constructor({ view, worker, camera }) {
		this.#view = view;
		this.#camera = camera;
		this.#worker = this.#configureWorker(worker);

		this.#view.configureOnBtnClick(this.onBtnStart.bind(this));
	}
	
	static async initialize(deps) {
		const controller = new Controller(deps);
		controller.log('Not yet detecting eye blink! Click in the button to start')
		return controller.init();
	}

	#configureWorker(worker) {
		let ready = false;
		worker.onmessage = ({ data }) => {
			if ('READY' === data) {
				console.log('Worker is ready!');
				this.#view.enableButton();
				ready = true;
				return;
			}
			const blinked = data.blinked;
			this.#blinkCounter += blinked;
			this.#view.togglePlayVideo();
			console.log('Blinked', blinked);
		}

		return {
			send(msg) {
				if (!ready) return;
				worker.postMessage(msg);
			}
		};
	}

	async init() {
		console.log('init!!');
	}

	loop() {
		const video = this.#camera.video;
		const img = this.#view.getVideoFrame(video);
		this.#worker.send(img);
		this.log(`detecting eye blink`);

		setTimeout(() => this.loop(), 100);
	}

	log(text) {
		const times = `      - blinked times: ${this.#blinkCounter}`;
		this.#view.log(`status: ${text}`.concat(this.#blinkCounter ? times : ""))
	}

	onBtnStart() {
		this.log('Initializing detection...');
		this.#blinkCounter = 0;
		this.loop();
	}
}