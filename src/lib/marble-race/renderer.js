import { BLOCKS } from './catalog.js';
import { createTilePainter } from './tile-painter.js';
import { WIDTH, blockAngle, gateOpen, arcStart } from './physics.js';

export function createRenderer(canvas) {
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('이 브라우저에서는 경기 화면을 그릴 수 없어요.');
	const drawTile = createTilePainter(ctx);
	let camera = 0;
	let particles = [];
	let impressions = [];
	let ripples = [];
	let lastTime = 0;
	let oldRace;

	function rounded(x, y, w, h, radius = 7) {
		ctx.beginPath();
		ctx.roundRect(x, y, w, h, radius);
	}
	function line(points) {
		ctx.beginPath();
		points.forEach(([x, y], index) => (index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
		ctx.stroke();
	}

	function drawBlock(block, race) {
		if (block.arc) {
			const start = arcStart(block, race.time);
			ctx.strokeStyle = block.arc.period ? '#b8a7ed' : '#657d91';
			ctx.lineWidth = block.arc.thickness;
			ctx.lineCap = 'round';
			ctx.beginPath();
			ctx.arc(block.x, block.y, block.arc.radius, start, start + block.arc.sweep);
			ctx.stroke();
			ctx.lineCap = 'butt';
			return;
		}

		if (!block.alive) {
			if (
				(block.tile || block.special) &&
				block.respawnAt !== null &&
				race.time >= block.respawnAt - 0.2
			) {
				ctx.save();
				ctx.strokeStyle = BLOCKS[block.type].color;
				ctx.globalAlpha = 0.35;
				ctx.lineWidth = 1.5;
				rounded(
					block.x - block.w / 2,
					block.y - (block.baseHeight ?? block.h) / 2,
					block.w,
					block.baseHeight ?? block.h,
					block.cornerRadius ?? 3
				);
				ctx.stroke();
				ctx.restore();
			}
			return;
		}
		if (block.tile) {
			drawTile(block);
			return;
		}
		if (block.motion) {
			ctx.strokeStyle = '#baaff344';
			ctx.lineWidth = 2;
			line([
				[block.motion.originX - block.motion.amplitude, block.y],
				[block.motion.originX + block.motion.amplitude, block.y]
			]);
		}
		const { type, w, h } = block;
		const definition =
			block.zoneId === 'finale'
				? { color: type === 'rotor' ? '#00e5ed' : '#edffff' }
				: (BLOCKS[type] ?? { color: '#657d91' });
		ctx.save();
		ctx.translate(block.x, block.y);
		ctx.rotate(blockAngle(block, race.time));
		const pulse = Math.max(0, 1 - (race.time - block.flash) * 7);
		if (type === 'gate' && gateOpen(block, race.time)) ctx.globalAlpha = 0.2;
		else ctx.globalAlpha = ['gel', 'wind', 'bubble', 'pond'].includes(type) ? 0.7 : 1;
		ctx.fillStyle = definition.color;
		ctx.strokeStyle = definition.color;
		ctx.lineWidth = 1.5;
		if (block.id === 'finale-bar') {
			ctx.shadowColor = '#00e5ed';
			ctx.shadowBlur = 12;
			rounded(-w / 2, -h / 2, w, h, block.cornerRadius);
			ctx.fill();
		} else if (type === 'wall') {
			// 칸막이의 둥근 끝과 유도벽의 각진 연결부를 충돌 모양 그대로 그린다.
			rounded(-w / 2, -h / 2, w, h, block.cornerRadius ?? 0);
			ctx.fill();
		} else if (type === 'bubble') {
			for (let x = -w / 2 + 13; x < w / 2; x += 22) {
				const gradient = ctx.createRadialGradient(x - 4, -4, 1, x, 0, 12);
				gradient.addColorStop(0, '#ffffffd0');
				gradient.addColorStop(0.35, '#d8baf318');
				gradient.addColorStop(1, '#d8baf399');
				ctx.fillStyle = gradient;
				ctx.beginPath();
				ctx.arc(x, 0, 12, 0, Math.PI * 2);
				ctx.fill();
				ctx.stroke();
			}
		} else if (type === 'rubber') {
			rounded(-w / 2, -h / 2, w, h, block.cornerRadius ?? 6);
			ctx.fill();
			ctx.strokeStyle = '#ffffff90';
			ctx.beginPath();
			ctx.ellipse(0, 0, w / 2 - 7, h / 2 - 6, 0, 0, Math.PI * 2);
			ctx.stroke();
		} else if (type === 'wind') {
			rounded(-w / 2, -h / 2, w, h);
			ctx.fillStyle = '#8ddacc12';
			ctx.fill();
			for (let x = -25; x <= 25; x += 25) {
				const y = ((race.time * 24 + x) % 25) - 12;
				const tipX = x + block.direction * 9;
				line([
					[x, y + 15],
					[tipX, y - 8],
					[tipX - 5, y - 2]
				]);
				line([
					[tipX, y - 8],
					[tipX + 5, y - 2]
				]);
			}
		} else if (type === 'spring') {
			ctx.lineWidth = 3;
			line([
				[-w / 2, h / 2],
				[w / 2, h / 2]
			]);
			const points = [];
			for (let i = 0; i < 9; i++)
				points.push([-w / 2 + 8 + (i * (w - 16)) / 8, i % 2 ? -9 + pulse * 7 : 8]);
			line(points);
			line([
				[-w / 2, -h / 2 + pulse * 9],
				[w / 2, -h / 2 + pulse * 9]
			]);
		} else {
			const gradient = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
			gradient.addColorStop(0, definition.color);
			gradient.addColorStop(1, `${definition.color}b0`);
			ctx.fillStyle = gradient;
			rounded(-w / 2, -h / 2, w, h, block.cornerRadius ?? (type === 'gel' ? 14 : 6));
			ctx.fill();
			ctx.strokeStyle = '#ffffff55';
			ctx.stroke();
			ctx.strokeStyle = '#172a3b65';
			ctx.lineWidth = 1.3;
			if (type === 'butter') {
				ctx.fillStyle = '#735221';
				ctx.font = 'bold 18px SUIT, sans-serif';
				ctx.textAlign = 'center';
				ctx.fillText(`${(block.maxHp ?? 5) - block.hp}/${block.maxHp ?? 5}`, 0, 6);
			} else if (type === 'wood') {
				line([
					[-w / 2 + 8, -4],
					[-8, -2],
					[w / 2 - 8, -5]
				]);
				line([
					[-w / 2 + 8, 6],
					[8, 4],
					[w / 2 - 8, 6]
				]);
			} else if (type === 'soap') {
				ctx.strokeStyle = '#fff4f0cc';
				ctx.lineWidth = 2;
				for (let i = -8; i <= 8; i += 8)
					line([
						[-12, i - 3],
						[12, i + 3]
					]);
				ctx.fillStyle = '#fff4f090';
				rounded(-7, -5, 14, 10, 3);
				ctx.fill();
			} else if (type === 'glass' || type === 'ice') {
				ctx.strokeStyle = '#ffffffbb';
				line([
					[-29, 6],
					[-16, -6]
				]);
				line([
					[-19, 7],
					[-6, -6]
				]);
				if (type === 'ice' && block.hp === 1) {
					ctx.strokeStyle = '#25709b';
					line([
						[0, -h / 2],
						[-7, -2],
						[4, 3],
						[-3, h / 2]
					]);
				}
			} else if (type === 'sand') {
				ctx.fillStyle = '#775d2e80';
				for (let i = 0; i < 18; i++)
					ctx.fillRect(-w / 2 + 7 + ((i * 17) % (w - 12)), -8 + ((i * 7) % 17), 2, 2);
			} else if (type === 'gel' || type === 'sticky' || type === 'pond') {
				ctx.strokeStyle = '#ffffff9a';
				for (let row = -1; row <= 1; row++) {
					const points = [];
					for (let x = -w / 2 + 9; x < w / 2 - 6; x += 4)
						points.push([x, row * (h / 4) + Math.sin(x / 10 + race.time) * 2]);
					line(points);
				}
			} else if (type === 'gate') {
				for (let x = -w / 2 + 10; x < w / 2; x += 14)
					line([
						[x, -7],
						[x, 7]
					]);
			} else if (type === 'slide') {
				for (let x = -24; x < 30; x += 20)
					line([
						[x - 4, -5],
						[x + 3, 0],
						[x - 4, 5]
					]);
			} else if ((type === 'rotor' && block.pivotX === undefined) || type === 'seesaw') {
				ctx.fillStyle = '#1d3147';
				ctx.beginPath();
				ctx.arc(0, 0, 4, 0, Math.PI * 2);
				ctx.fill();
			}
		}
		if (pulse > 0 && block.flash > 0) {
			ctx.globalAlpha = pulse * 0.35;
			ctx.fillStyle = '#ffffff';
			rounded(-w / 2, -h / 2, w, h);
			ctx.fill();
		}
		ctx.restore();
		if (type === 'seesaw') {
			ctx.fillStyle = '#d9b98c88';
			ctx.beginPath();
			ctx.moveTo(block.x, block.y + 6);
			ctx.lineTo(block.x - 10, block.y + 26);
			ctx.lineTo(block.x + 10, block.y + 26);
			ctx.fill();
		}
	}

	function addEvents(events, reduced) {
		if (reduced) return;
		for (const event of events) if (event.type === 'pond') ripples.push({ ...event, life: 0.6 });
		ripples = ripples.slice(-40);
		for (const event of events) if (event.broken) impressions.push({ ...event, life: 0.18 });
		impressions = impressions.slice(-100);
		for (const event of events) {
			if (!event.broken) continue;
			const count = event.type === 'sand' ? 10 : 6;
			for (let i = 0; i < count; i++) {
				const angle = i * 2.4 + event.x;
				particles.push({
					x: event.x,
					y: event.y,
					vx: Math.cos(angle) * 100,
					vy: Math.sin(angle) * 100 - 25,
					life: 0.65,
					round: [
						'foam',
						'bubble',
						'wrap',
						'popit',
						'slime',
						'asmr',
						'droplet',
						'frog',
						'duck'
					].includes(event.type),
					color: BLOCKS[event.type].color,
					size:
						event.type === 'sand' || event.type === 'typewriter' || event.type === 'ember' ? 2 : 4,
					shard: event.type === 'soap',
					angle
				});
			}
		}
		particles = particles.slice(-240);
	}

	function render(race, { focusId = -1, overview = false, view } = {}) {
		if (oldRace !== (race.identity ?? race)) {
			camera = 0;
			particles = [];
			impressions = [];
			ripples = [];
			lastTime = 0;
			oldRace = race.identity ?? race;
		}
		const bounds = canvas.getBoundingClientRect();
		if (!bounds.width || !bounds.height) return;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const pixelWidth = Math.round(bounds.width * dpr),
			pixelHeight = Math.round(bounds.height * dpr);
		if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
			canvas.width = pixelWidth;
			canvas.height = pixelHeight;
		}
		const finishY = race.layout.finish.y;
		const scale = overview
			? Math.min(bounds.width / WIDTH, bounds.height / race.layout.height)
			: view.scale;
		const viewHeight = bounds.height / scale;
		camera = overview ? 0 : view.top;
		const dt = Math.max(0, Math.min(0.05, race.time - lastTime));
		lastTime = race.time;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.fillStyle = '#101d2c';
		ctx.fillRect(0, 0, bounds.width, bounds.height);
		ctx.translate(overview ? (bounds.width - WIDTH * scale) / 2 : -view.left * scale, 0);
		ctx.scale(scale, scale);
		ctx.translate(0, -camera);
		ctx.fillStyle = '#294051';
		for (let y = Math.floor(camera / 32) * 32; y < camera + viewHeight; y += 32) {
			for (let x = 24; x < WIDTH; x += 32) {
				ctx.beginPath();
				ctx.arc(x, y, 1, 0, Math.PI * 2);
				ctx.fill();
			}
		}
		ctx.strokeStyle = '#385062';
		ctx.lineWidth = 2;
		line([
			[12, camera],
			[12, camera + viewHeight]
		]);
		line([
			[WIDTH - 12, camera],
			[WIDTH - 12, camera + viewHeight]
		]);
		ctx.textAlign = 'left';
		ctx.font = `600 ${14 / scale}px SUIT, sans-serif`;
		ctx.fillStyle = '#8fa7b9';
		ctx.fillText('출발', 28, 24);

		for (const block of race.blocks)
			if (
				block.id !== 'finale-bar' &&
				block.y > camera - 280 &&
				block.y < camera + viewHeight + 280
			)
				drawBlock(block, race);
		const finaleBar = race.blocks.find((block) => block.id === 'finale-bar');
		if (finaleBar && finaleBar.y > camera - 100 && finaleBar.y < camera + viewHeight + 100)
			drawBlock(finaleBar, race);
		for (const effect of ripples) {
			ctx.save();
			ctx.strokeStyle = '#e7fffc';
			ctx.globalAlpha = effect.life / 0.6;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.ellipse(
				effect.x,
				effect.y,
				8 + (0.6 - effect.life) * 70,
				3 + (0.6 - effect.life) * 15,
				0,
				0,
				Math.PI * 2
			);
			ctx.stroke();
			ctx.restore();
			effect.life -= dt;
		}
		ripples = ripples.filter((e) => e.life > 0);
		for (const effect of impressions) {
			const block = race.blocks.find((block) => block.id === effect.blockId);
			if (block?.tile) drawTile(block, Math.max(0, effect.life / 0.18));
			effect.life -= dt;
		}
		impressions = impressions.filter((effect) => effect.life > 0);

		for (let x = race.layout.finish.left; x < race.layout.finish.right; x += 10) {
			ctx.fillStyle = Math.floor(x / 10) % 2 ? '#83d8c4' : '#294858';
			ctx.fillRect(x, finishY, 10, 10);
		}
		ctx.font = '700 18px SUIT, sans-serif';
		ctx.fillStyle = '#b9e4dc';
		ctx.textAlign = 'center';
		ctx.fillText('도착', WIDTH / 2, finishY + 38);
		for (const particle of particles) {
			particle.x += particle.vx * dt;
			particle.y += particle.vy * dt;
			particle.vy += 200 * dt;
			particle.life -= dt;
			ctx.globalAlpha = Math.max(0, particle.life / 0.65);
			ctx.fillStyle = particle.color;
			if (particle.round) {
				ctx.beginPath();
				ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
				ctx.fill();
			} else if (particle.shard) {
				ctx.save();
				ctx.translate(particle.x, particle.y);
				ctx.rotate(particle.angle + (0.65 - particle.life) * 4);
				ctx.fillRect(-5, -1, 10, 2);
				ctx.restore();
			} else ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
		}
		particles = particles.filter((p) => p.life > 0);
		ctx.globalAlpha = 1;
		const labels = [];
		const renderMarbles = [...race.marbles].sort(
			(a, b) => (b.id === Number(focusId)) - (a.id === Number(focusId))
		);
		for (const marble of renderMarbles) {
			if (marble.finished || marble.y < camera - 60 || marble.y > camera + viewHeight + 60)
				continue;
			const isFocus = marble.id === Number(focusId);
			if (isFocus) {
				ctx.strokeStyle = isFocus ? '#ffffff' : '#7cf2ce';
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.arc(marble.x, marble.y, marble.r + 5, 0, Math.PI * 2);
				ctx.stroke();
			}
			if (marble.windUntil > race.time) {
				ctx.strokeStyle = '#8ddacc';
				ctx.lineWidth = 2;
				for (let row = -1; row <= 1; row++) {
					const x = marble.x - marble.windDirection * (35 + ((race.time * 35) % 16)),
						y = marble.y + row * 9;
					line([
						[x, y],
						[x + marble.windDirection * 22, y],
						[x + marble.windDirection * 16, y - 4]
					]);
				}
			}
			const gradient = ctx.createRadialGradient(
				marble.x - 4,
				marble.y - 5,
				1,
				marble.x + 2,
				marble.y + 3,
				marble.r + 3
			);
			gradient.addColorStop(0, '#ffffff');
			gradient.addColorStop(0.3, marble.color);
			gradient.addColorStop(1, '#304a61');
			ctx.fillStyle = gradient;
			ctx.beginPath();
			ctx.arc(marble.x, marble.y, marble.r, 0, Math.PI * 2);
			ctx.fill();
			ctx.font = `800 ${Math.max(10, 8 / scale)}px SUIT, sans-serif`;
			ctx.fillStyle = '#142736';
			ctx.fillText(String(marble.id + 1), marble.x, marble.y + 4);
			if (!overview || isFocus) {
				const labelFont = Math.max(14, (isFocus ? 18 : 14) / scale);
				ctx.font = `${isFocus ? 800 : 600} ${labelFont}px SUIT, sans-serif`;
				const name =
					[...marble.name].length > 9 ? [...marble.name].slice(0, 8).join('') + '…' : marble.name;
				const width = ctx.measureText(name).width + 12;
				const labelX = Math.max(width / 2 + 3, Math.min(WIDTH - width / 2 - 3, marble.x));
				const box = { x: labelX - width / 2, y: marble.y + 17, w: width, h: labelFont + 8 };
				if (
					!isFocus &&
					labels.some(
						(b) =>
							box.x < b.x + b.w && box.x + box.w > b.x && box.y < b.y + b.h && box.y + box.h > b.y
					)
				)
					continue;
				labels.push(box);
				ctx.fillStyle = '#101d2ce8';
				rounded(labelX - width / 2, marble.y + 17, width, labelFont + 8, 5);
				ctx.fill();
				ctx.fillStyle = isFocus ? '#ffffff' : '#dceaf3';
				ctx.fillText(name, labelX, marble.y + 21 + labelFont);
			}
		}
	}
	function celebrate(race, reduced) {
		if (reduced) return;
		for (let i = 0; i < 50; i++)
			particles.push({
				x: 360,
				y: race.layout.finish.y - 20,
				vx: Math.cos(i * 2.4) * 180,
				vy: -100 - (i % 7) * 30,
				life: 0.9,
				size: 3,
				color: ['#ffc85b', '#76dbc0', '#eea19b'][i % 3]
			});
	}
	return { render, addEvents, celebrate };
}
