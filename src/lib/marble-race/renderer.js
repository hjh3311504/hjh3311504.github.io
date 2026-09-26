import { drawSkill, drawElectricField } from './skill-painter.js';
import { drawMarble } from './marble-painter.js';
import { BLOCKS } from './catalog.js';
import { createTilePainter } from './tile-painter.js';
import { drawSpecialBlock } from './special-painter.js';
import { WIDTH, blockAngle, gateOpen, arcStart, tilesInView } from './physics.js';

export function createRenderer(canvas) {
	const makeCanvas = () =>
		canvas.ownerDocument?.createElement('canvas') ?? new OffscreenCanvas(1, 1);
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('이 브라우저에서는 경기 화면을 그릴 수 없어요.');
	const drawTile = createTilePainter(ctx);
	let camera = 0;
	let particles = [];
	let impressions = [];
	let ripples = [];
	let lastTime = 0;
	let oldRace;
	const textSprites = new Map(),
		tileSprites = new Map();
	const sprites = new Map(),
		labels = new Map();
	let blockBands = new Map();
	let gridPattern;
	let textQuality = 1;
	let spritePage;
	// 같은 글자 크기의 연속 프레임은 번호로 찾고 캐시 키 문자열을 다시 만들지 않는다.
	let recentSprites = [],
		spriteFont,
		spriteScale;
	let labelFrames = [];
	let blockLookup = new Map(),
		firstBand,
		lastBand,
		bandBlocks = [],
		recentTile;
	function marbleSprite(marble, font, quality) {
		if (font !== spriteFont || quality !== spriteScale) {
			recentSprites = [];
			spriteFont = font;
			spriteScale = quality;
		}
		const recent = recentSprites[marble.id];
		if (recent && recent.color === marble.color && recent.radius === marble.r) return recent.sprite;
		const remember = (sprite) => {
			if (marble.id < 2048)
				recentSprites[marble.id] = { color: marble.color, radius: marble.r, sprite };
			return sprite;
		};

		const key = `${marble.color}:${marble.r}:${marble.id}:${font}:${quality}`;
		if (sprites.has(key)) return remember(sprites.get(key));
		if (!spritePage) spritePage = createSpritePage();
		let brush = spritePage.brush;
		brush.font = font;
		let width = Math.ceil(
			Math.max((marble.r + 2) * 2, brush.measureText(String(marble.id + 1)).width + 4)
		);
		let height = Math.max((marble.r + 2) * 2, Number(font.match(/([\d.]+)px/)[1]) * 1.5 + 8);
		width = Math.ceil(width * quality) / quality;
		height = Math.ceil(height * quality) / quality;
		const pixelWidth = Math.round(width * quality),
			pixelHeight = Math.round(height * quality);
		if (sprites.size >= 2048) {
			sprites.clear();
			recentSprites = [];
			spritePage = createSpritePage();
		}
		if (spritePage.x + pixelWidth > spritePage.bitmap.width) {
			spritePage.x = 0;
			spritePage.y += spritePage.rowHeight;
			spritePage.rowHeight = 0;
		}
		if (
			pixelWidth > spritePage.bitmap.width ||
			spritePage.y + pixelHeight > spritePage.bitmap.height
		)
			spritePage = createSpritePage(Math.max(1024, pixelWidth, pixelHeight));
		const { bitmap, x, y } = spritePage;
		brush = spritePage.brush;
		brush.save();
		brush.translate(x, y);
		brush.scale(quality, quality);
		brush.translate(width / 2, height / 2);
		drawMarble(brush, marble, font);
		brush.restore();
		spritePage.x += pixelWidth;
		spritePage.rowHeight = Math.max(spritePage.rowHeight, pixelHeight);
		const sprite = { bitmap, x, y, pixelWidth, pixelHeight, width, height };
		sprites.set(key, sprite);
		return remember(sprite);
	}

	function createSpritePage(size = 1024) {
		const bitmap = makeCanvas();
		bitmap.width = bitmap.height = size;
		return { bitmap, brush: bitmap.getContext('2d'), x: 0, y: 0, rowHeight: 0 };
	}
	function textSprite(text, style, background = false) {
		const key = `${style.font}:${style.color}:${background}:${textQuality}:${text}`;
		let sprite = textSprites.get(key);
		if (!sprite) {
			const fontSize = style.size;
			ctx.font = style.font;
			let width = Math.ceil(ctx.measureText(text).width) + (background ? 12 : 4),
				height = background ? Math.ceil(fontSize) + 8 : Math.ceil(fontSize * 1.5) + 4;
			const bitmap = makeCanvas();
			width = Math.ceil(width * textQuality) / textQuality;
			height = Math.ceil(height * textQuality) / textQuality;
			bitmap.width = Math.round(width * textQuality);
			bitmap.height = Math.round(height * textQuality);
			const brush = bitmap.getContext('2d');
			brush.scale(textQuality, textQuality);
			brush.font = style.font;
			if (background) {
				brush.fillStyle = '#101d2ce8';
				brush.beginPath();
				brush.roundRect(0, 0, width, height, 5);
				brush.fill();
			}
			brush.fillStyle = style.color;
			brush.textAlign = 'center';
			const baseline = background ? fontSize + 4 : height - 4;
			brush.fillText(text, width / 2, baseline);
			sprite = { bitmap, width, height, baseline };
			if (textSprites.size >= 2048) textSprites.clear();
			textSprites.set(key, sprite);
		}
		return sprite;
	}
	function paintText(text, x, y, style, background = false) {
		paintTextSprite(textSprite(text, style, background), x, y);
	}
	function paintTextSprite(sprite, x, y) {
		ctx.drawImage(
			sprite.bitmap,
			x - sprite.width / 2,
			y - sprite.baseline,
			sprite.width,
			sprite.height
		);
	}
	function paintTile(block) {
		if (
			recentTile &&
			recentTile.type === block.type &&
			recentTile.w === block.w &&
			recentTile.h === block.h &&
			recentTile.corner === block.cornerRadius
		) {
			const s = recentTile.sprite;
			ctx.drawImage(s.bitmap, block.x - s.width / 2, block.y - s.height / 2, s.width, s.height);
			return;
		}
		const key = `${block.type}:${block.w}:${block.h}:${block.cornerRadius}`;
		let sprite = tileSprites.get(key);
		if (!sprite) {
			const bitmap = makeCanvas(),
				width = block.w + 4,
				height = block.h + 4;
			bitmap.width = width * 4;
			bitmap.height = height * 4;
			const brush = bitmap.getContext('2d');
			brush.scale(4, 4);
			brush.translate(width / 2, height / 2);
			createTilePainter(brush)({ ...block, x: 0, y: 0 });
			sprite = { bitmap, width, height };
			tileSprites.set(key, sprite);
		}

		recentTile = { type: block.type, w: block.w, h: block.h, corner: block.cornerRadius, sprite };
		ctx.drawImage(
			sprite.bitmap,
			block.x - sprite.width / 2,
			block.y - sprite.height / 2,
			sprite.width,
			sprite.height
		);
	}

	function indexBlocks(blocks) {
		blockLookup = new Map(blocks.map((b) => [b.id, b]));
		firstBand = lastBand = undefined;
		bandBlocks = [];
		blockBands = new Map();
		for (const [order, block] of blocks.entries()) {
			const extent = block.arc?.radius ?? Math.hypot(block.w, block.h) / 2;
			const radius = extent + (block.orbitRadius ?? 0) + 16;
			const y = block.pivotY ?? block.y;
			for (
				let band = Math.floor((y - radius) / 256);
				band <= Math.floor((y + radius) / 256);
				band++
			) {
				if (!blockBands.has(band)) blockBands.set(band, []);
				blockBands.get(band).push({ block, order });
			}
		}
	}
	function blocksInView(top, bottom) {
		const first = Math.floor(top / 256),
			last = Math.floor(bottom / 256);
		if (first === firstBand && last === lastBand) return bandBlocks;
		firstBand = first;
		lastBand = last;
		const visible = new Map();
		for (let band = Math.floor(top / 256); band <= Math.floor(bottom / 256); band++)
			for (const entry of blockBands.get(band) ?? []) visible.set(entry.order, entry.block);
		return (bandBlocks = [...visible.entries()]
			.sort((a, b) => a[0] - b[0])
			.map((entry) => entry[1]));
	}

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
			ctx.strokeStyle =
				block.zoneId === 'finale' ? '#edffff' : block.arc.period ? '#b8a7ed' : '#657d91';
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
				ctx.translate(block.x, block.y);
				ctx.rotate(blockAngle(block, race.time));
				ctx.strokeStyle = BLOCKS[block.type].color;
				ctx.globalAlpha = 0.35;
				ctx.lineWidth = 1.5;
				rounded(
					-block.w / 2,
					-(block.baseHeight ?? block.h) / 2,
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
			paintTile(block);
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
		else ctx.globalAlpha = ['gel', 'wind', 'bubble'].includes(type) ? 0.7 : 1;
		ctx.fillStyle = definition.color;
		ctx.strokeStyle = definition.color;
		ctx.lineWidth = 1.5;
		if (block.zoneId === 'finale' && type === 'rotor') {
			ctx.shadowColor = '#00e5ed';
			ctx.shadowBlur = 12;
			rounded(-w / 2, -h / 2, w, h, block.cornerRadius);
			ctx.fill();
		} else if (['butter', 'frost', 'pond'].includes(type)) {
			drawSpecialBlock(ctx, block, race.time);
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
			if (type === 'wood') {
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
			} else if (type === 'gel' || type === 'sticky') {
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

	function reset(race) {
		if (oldRace !== (race.identity ?? race)) {
			camera = 0;
			particles = [];
			impressions = [];
			ripples = [];
			lastTime = 0;
			labels.clear();
			labelFrames = [];
			sprites.clear();
			recentSprites = [];
			spritePage = null;
			textSprites.clear();
			indexBlocks(race.blocks);
			oldRace = race.identity ?? race;
		}
	}

	function render(
		race,
		{
			focusId = -1,
			overview = false,
			skillsEnabled = false,
			reduced = false,
			view,
			bounds = canvas.getBoundingClientRect(),
			pixelRatio = globalThis.devicePixelRatio || 1
		} = {}
	) {
		reset(race);
		if (!bounds.width || !bounds.height) return;
		const dpr = Math.min(pixelRatio, 2);
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
		if (scale > 0.08) {
			if (!gridPattern) {
				const tile = makeCanvas();
				tile.width = tile.height = 128;
				const brush = tile.getContext('2d');
				brush.scale(4, 4);
				brush.fillStyle = '#294051';
				for (const y of [0, 32]) {
					brush.beginPath();
					brush.arc(24, y, 1, 0, Math.PI * 2);
					brush.fill();
				}
				gridPattern = ctx.createPattern(tile, 'repeat');
				gridPattern.setTransform(new DOMMatrix().scale(0.25));
			}
			ctx.fillStyle = gridPattern;
			ctx.fillRect(12, camera, WIDTH - 24, viewHeight);
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

		if (race.preview) {
			if (scale < 0.08) {
				for (const zone of race.zones) {
					ctx.fillStyle = BLOCKS[zone.type].color;
					ctx.fillRect(12, zone.start, WIDTH - 24, zone.end - zone.start);
				}
			} else {
				for (const block of tilesInView(race.layout, camera - 32, camera + viewHeight + 32))
					drawBlock(block, race);
			}
		}
		const visibleBlocks = blocksInView(camera, camera + viewHeight);
		for (const block of visibleBlocks)
			if (!(block.zoneId === 'finale' && block.type === 'rotor')) drawBlock(block, race);
		for (const block of visibleBlocks) {
			if (block.zoneId !== 'finale' || block.type !== 'rotor') continue;
			const radius = Math.hypot(block.w, block.h) / 2;
			if (block.y + radius > camera && block.y - radius < camera + viewHeight)
				drawBlock(block, race);
		}
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
			const block = blockLookup.get(effect.blockId);
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
		if (skillsEnabled) {
			for (const wave of race.skillWaves ?? race.skills?.waves ?? []) {
				drawSkill(ctx, wave, race.time - wave.time, reduced, {
					left: overview ? 0 : view.left,
					right: (overview ? 0 : view.left) + bounds.width / scale,
					top: camera,
					bottom: camera + viewHeight
				});
			}
		}
		const numberFont = `800 ${Math.round(Math.max(10, 8 / scale) * 2) / 2}px SUIT, sans-serif`;
		// 전체 맵에서도 글자를 자르거나 거대한 비트맵을 만들지 않는다.
		const spriteQuality = 2 ** Math.ceil(Math.log2(scale * dpr));
		textQuality = spriteQuality;
		const renderMarbles = race.marbles
			.filter(
				(marble) =>
					!marble.finished && marble.y >= camera - 60 && marble.y <= camera + viewHeight + 60
			)
			.sort((a, b) => (a.id === Number(focusId)) - (b.id === Number(focusId)));
		// 그림 페이지를 모두 채운 뒤 화면에 복사한다. 그리는 도중 페이지를
		// 바꾸면 같은 큰 이미지를 구슬마다 다시 전송할 수 있다.
		const marbleSprites = renderMarbles.map((marble) =>
			marbleSprite(marble, numberFont, spriteQuality)
		);
		// 같은 글자 설정을 매 구슬마다 Canvas에 다시 지정하거나 읽지 않는다.
		const labelStyles = [false, true].map((focus) => {
			const size = Math.round(Math.max(14, (focus ? 18 : 14) / scale) * 2) / 2;
			return {
				size,
				font: `${focus ? 800 : 600} ${size}px SUIT, sans-serif`,
				color: focus ? '#ffffff' : '#dceaf3'
			};
		});
		const numberStyle = {
			font: numberFont,
			size: Number(numberFont.match(/([\d.]+)px/)[1]),
			color: '#142736'
		};

		for (let i = 0; i < labelStyles.length; i++) {
			if (labelFrames[i]?.font !== labelStyles[i].font || labelFrames[i]?.quality !== textQuality)
				labelFrames[i] = { font: labelStyles[i].font, quality: textQuality, values: new Map() };
		}
		// 이름표 위로 구슬·번호·추적 표식이 보이게 한다.
		for (const marble of renderMarbles) {
			const isFocus = marble.id === Number(focusId);
			if (!overview || isFocus) {
				const style = labelStyles[Number(isFocus)];
				const labelFrame = labelFrames[Number(isFocus)].values;
				let label = labelFrame.get(marble.name);
				if (!label) {
					const key = `${style.font}:${marble.name}`;
					label = labels.get(key);
					if (!label) {
						const chars = [...marble.name],
							name = chars.length > 9 ? chars.slice(0, 8).join('') + '…' : marble.name;
						ctx.font = style.font;
						label = { name, width: ctx.measureText(name).width + 12 };
						// 확대 중의 연속 글자 크기로 캐시가 무한히 늘지 않게 한다.
						if (labels.size > 4096) labels.clear();
						labels.set(key, label);
					}
					label = { ...label, sprite: textSprite(label.name, style, true) };
					if (labelFrame.size >= 2048) labelFrame.clear();
					labelFrame.set(marble.name, label);
				}
				const { width } = label;
				const labelX = Math.max(width / 2 + 3, Math.min(WIDTH - width / 2 - 3, marble.x));
				paintTextSprite(label.sprite, labelX, marble.y + 21 + style.size);
			}
		}
		for (let index = 0; index < renderMarbles.length; index++) {
			const marble = renderMarbles[index];
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
			const sprite = marbleSprites[index];
			ctx.drawImage(
				sprite.bitmap,
				sprite.x,
				sprite.y,
				sprite.pixelWidth,
				sprite.pixelHeight,
				marble.x - sprite.width / 2,
				marble.y - sprite.height / 2,
				sprite.width,
				sprite.height
			);
			if (marble.held?.kind === 'lightning') drawElectricField(ctx, marble, race.time, reduced);
			if (marble.held?.kind === 'frost') {
				ctx.fillStyle = '#b2e9f780';
				ctx.strokeStyle = '#e4faff';
				ctx.lineWidth = 2;
				ctx.beginPath();
				for (let i = 0; i < 6; i++) {
					const a = (i * Math.PI) / 3;
					const x = marble.x + Math.cos(a) * (marble.r + 3);
					const y = marble.y + Math.sin(a) * (marble.r + 3);
					if (i === 0) ctx.moveTo(x, y);
					else ctx.lineTo(x, y);
				}
				ctx.closePath();
				ctx.fill();
				ctx.stroke();
			}
			if (marble.held) paintText(String(marble.id + 1), marble.x, marble.y + 4, numberStyle);
		}
	}
	return { render, addEvents, reset };
}
