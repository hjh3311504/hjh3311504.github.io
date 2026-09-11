export function titleLines(title) {
	const text = title.trim().normalize('NFC');
	return text ? [text] : [];
}

export function pendingTitle(title) {
	return {
		title,
		paths: [],
		lines: titleLines(title),
		fallback: true,
		svgError: '',
		canRetrySvg: false
	};
}
