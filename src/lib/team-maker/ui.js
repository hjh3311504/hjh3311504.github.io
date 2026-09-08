import { createLifetime } from './lifecycle.js';
import { SVG_NAMESPACE } from './utils.js';

export function createUi({ root, prefersReducedMotion }) {
	const lifetime = createLifetime();
	const { setTimeout, requestAnimationFrame } = lifetime;

	function markEntering(collection, ids, duration = 420) {
		for (const id of ids) collection.add(id);
		setTimeout(() => {
			for (const id of ids) collection.delete(id);
		}, duration);
	}

	function captureFlipPositions() {
		const positions = new Map();
		for (const element of root.querySelectorAll('[data-flip]')) {
			positions.set(element.dataset.flip, element.getBoundingClientRect());
		}
		return positions;
	}

	function playFlip(previousPositions, movementTypes) {
		if (!previousPositions?.size || prefersReducedMotion()) return 0;
		let movementDuration = 0;
		for (const element of root.querySelectorAll('[data-flip]')) {
			const previous = previousPositions.get(element.dataset.flip);
			if (!previous) continue;
			const current = element.getBoundingClientRect();
			const deltaX = previous.left - current.left;
			const deltaY = previous.top - current.top;
			if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) continue;
			const movementType = movementTypes?.get(element.dataset.flip) || 'layout';
			movementDuration = 300;
			if (movementTypes) {
				element.dataset.removalMovement = movementType;
			}
			element.style.transition = 'none';
			element.style.transform = `translate(${deltaX.toFixed(1)}px, ${deltaY.toFixed(1)}px)`;
			requestAnimationFrame(() => {
				element.style.transition = 'transform 300ms cubic-bezier(0.2, 0, 0.2, 1)';
				element.style.transform = '';
			});
		}
		return movementDuration;
	}

	function applyUiButton(button, { variant = 'outline', size = 'md' } = {}) {
		button.classList.add('ui-button');
		button.dataset.uiButton = '';
		button.dataset.variant = variant;
		button.dataset.size = size;
		return button;
	}

	function createRemoveButton(label, dataset = {}) {
		const button = applyUiButton(document.createElement('button'), {
			variant: 'ghost',
			size: 'icon'
		});
		button.type = 'button';
		button.classList.add('remove-row-button');
		button.setAttribute('aria-label', label);
		Object.assign(button.dataset, dataset);

		const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
		svg.setAttribute('viewBox', '0 0 15 15');
		svg.setAttribute('width', '15');
		svg.setAttribute('height', '15');
		svg.setAttribute('fill', 'none');
		svg.setAttribute('aria-hidden', 'true');
		svg.setAttribute('focusable', 'false');
		const path = document.createElementNS(SVG_NAMESPACE, 'path');
		path.setAttribute('d', 'M3.75 3.75l7.5 7.5m0-7.5-7.5 7.5');
		path.setAttribute('stroke', 'currentColor');
		path.setAttribute('stroke-width', '1.8');
		path.setAttribute('stroke-linecap', 'round');
		svg.append(path);
		button.append(svg);
		return button;
	}
	function connect() {}
	function destroy() {
		lifetime.destroy();
	}
	return {
		connect,
		destroy,
		markEntering,
		captureFlipPositions,
		playFlip,
		applyUiButton,
		createRemoveButton
	};
}
