import { createLifetime } from './lifecycle.js';

export function createDialogs({ root, runtime, $ }) {
	let confirmAction = null;
	const lifetime = createLifetime();
	const { on, setTimeout, requestAnimationFrame } = lifetime;

	let lockedPageScrollY = null;

	function lockPageScroll() {
		if (lockedPageScrollY !== null) return;
		lockedPageScrollY = window.scrollY;
		document.body.style.setProperty('--team-maker-scroll-offset', `-${lockedPageScrollY}px`);
		document.documentElement.classList.add('team-maker-dialog-open');
	}

	function releasePageScrollLock() {
		if (lockedPageScrollY === null) return;
		const scrollY = lockedPageScrollY;
		lockedPageScrollY = null;
		document.documentElement.classList.add('team-maker-restoring-scroll');
		document.documentElement.classList.remove('team-maker-dialog-open');
		document.body.style.removeProperty('--team-maker-scroll-offset');
		window.scrollTo(0, scrollY);
		requestAnimationFrame(() => {
			document.documentElement.classList.remove('team-maker-restoring-scroll');
		});
	}

	function syncPageScrollLock() {
		if (root.querySelector('dialog[open]')) lockPageScroll();
		else releasePageScrollLock();
	}

	function showDialog(dialog, focusSelector) {
		lockPageScroll();
		if (!dialog.open) dialog.showModal();
		syncPageScrollLock();
		const focusTarget = focusSelector ? dialog.querySelector(focusSelector) : null;
		setTimeout(
			() =>
				(focusTarget || dialog.querySelector('button, input, textarea'))?.focus({
					preventScroll: true
				}),
			0
		);
	}

	function closeDialog(dialog) {
		if (!dialog) return;
		if (dialog.id === 'wheel-dialog' && runtime.wheelSpinning) return;
		if (dialog.open) dialog.close();
		syncPageScrollLock();
	}

	function closeDialogFromBackdrop(event) {
		const dialog = event.currentTarget;
		if (event.target !== dialog) return;
		const bounds = dialog.getBoundingClientRect();
		const clickedOutside =
			event.clientX < bounds.left ||
			event.clientX > bounds.right ||
			event.clientY < bounds.top ||
			event.clientY > bounds.bottom;
		if (clickedOutside) closeDialog(dialog);
	}

	function showConfirm({
		title,
		description,
		warning = '되돌릴 수 없습니다.',
		actionLabel = '삭제',
		action
	}) {
		$('#confirm-title').textContent = title;
		$('#confirm-description').textContent = description;
		$('#confirm-warning').textContent = warning;
		$('#confirm-action-button').textContent = actionLabel;
		confirmAction = action;
		showDialog($('#confirm-dialog'), '#cancel-confirm-button');
	}
	function connect() {
		on($('#cancel-confirm-button'), 'click', () => closeDialog($('#confirm-dialog')));

		on($('#confirm-action-button'), 'click', () => {
			const action = confirmAction;
			closeDialog($('#confirm-dialog'));
			confirmAction = null;
			action?.();
		});

		on($('#confirm-dialog'), 'close', () => {
			confirmAction = null;
		});

		for (const dialog of root.querySelectorAll('dialog')) {
			on(dialog, 'close', syncPageScrollLock);
			on(dialog, 'click', closeDialogFromBackdrop);
		}
		on(root, 'click', (event) => {
			const closeButton = event.target.closest('[data-close-dialog]');
			if (closeButton) closeDialog(closeButton.closest('dialog'));
		});
	}
	function destroy() {
		for (const dialog of root.querySelectorAll('dialog[open]')) dialog.close();
		releasePageScrollLock();
		document.documentElement.classList.remove('team-maker-restoring-scroll');
		confirmAction = null;
		lifetime.destroy();
	}
	return { connect, destroy, showDialog, closeDialog, showConfirm };
}
