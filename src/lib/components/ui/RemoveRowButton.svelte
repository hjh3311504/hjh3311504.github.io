<script>
	import IconButton from './IconButton.svelte';
	let { label, ...props } = $props();
</script>

<IconButton {...props} {label} class="remove-row-button">
	<svg viewBox="0 0 15 15" width="15" height="15" fill="none" aria-hidden="true" focusable="false">
		<path
			d="M3.75 3.75l7.5 7.5m0-7.5-7.5 7.5"
			stroke="currentColor"
			stroke-width="1.8"
			stroke-linecap="round"
		/>
	</svg>
</IconButton>
