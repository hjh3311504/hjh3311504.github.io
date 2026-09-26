// 같은 build·브라우저에서 이전의 요청→응답→다음 요청 구조를 대조한다.
// 제품의 계산 규칙·그리기는 그대로 쓰며 검사 브라우저에서만 이전 스케줄러를 재현한다.
export async function installRequestDrivenWorker(page) {
	await page.addInitScript(() => {
		const NativeWorker = window.Worker;
		window.Worker = class extends NativeWorker {
			constructor(...args) {
				super(...args);
				this.running = false;
				this.busy = false;
				this.unused = 0;
				this.speed = 1;
				this.serial = 0;
			}
			set onmessage(callback) {
				super.onmessage = (event) => {
					const data = event.data;
					if (['frame', 'advanced', 'idle'].includes(data.kind)) {
						this.busy = false;
						this.unused = data.unused ?? this.unused;
						if (data.kind === 'frame') {
							this.slow = data.state.cinematic?.active;
							data.stream = true;
							data.serial = ++this.serial;
							if (this.snapshotReply != null) {
								data.reply = this.snapshotReply;
								this.snapshotReply = null;
							}
							callback(event);
						}
						if (this.pauseId != null) this.capturePause();
						else this.pump();
					} else callback(event);
				};
			}
			get onmessage() {
				return super.onmessage;
			}
			capturePause() {
				if (this.busy) return;
				this.busy = true;
				this.snapshotReply = this.pauseId;
				this.pauseId = null;
				super.postMessage({ kind: 'snapshot' });
			}
			pump() {
				clearTimeout(this.timer);
				if (!this.running || this.busy) return;
				const now = performance.now(),
					delta = Math.max(0, (now - this.last) / 1000) + this.unused;
				const minimum = 1 / 120 / (this.slow ? 0.25 : this.speed);
				if (delta + 1e-12 < minimum) {
					this.timer = setTimeout(
						() => this.pump(),
						Math.max(1, Math.ceil((minimum - delta) * 1000))
					);
					return;
				}
				this.last = now;
				this.busy = true;
				super.postMessage({ kind: 'advance', seconds: delta, speed: this.speed });
			}
			postMessage(data, ...args) {
				if (data.kind === 'run') {
					this.running = true;
					this.last = performance.now();
					this.speed = data.speed;
					this.pump();
				} else if (data.kind === 'speed') this.speed = data.speed;
				else if (data.kind === 'pause') {
					this.running = false;
					clearTimeout(this.timer);
					this.pauseId = data.requestId;
					this.capturePause();
				} else if (data.kind !== 'ack') super.postMessage(data, ...args);
			}
			terminate() {
				this.running = false;
				clearTimeout(this.timer);
				super.terminate();
			}
		};
	});
}
