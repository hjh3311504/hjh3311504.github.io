<script lang="ts">
	import { resolve } from '$app/paths';
	import Logo from '$lib/components/atoms/Logo.svelte';
	import ThemeToggle from '$lib/components/molecules/ThemeToggle.svelte';

	export let showBackground = false;
</script>

<header class:has-background={showBackground}>
	<nav class="container">
		<a class="logo" href={resolve('/')} aria-label="Site logo">
			<Logo />
		</a>
		<div class="links">
			<ThemeToggle />
		</div>
	</nav>
</header>

<style lang="scss">
	@use '$lib/scss/breakpoints' as *;

	header {
		position: relative;
		padding: 30px 0;

		@include for-phone-only {
			padding: 20px 0;
		}

		&.has-background {
			background: linear-gradient(
				60deg,
				var(--color--waves-start) 0%,
				var(--color--waves-end) 100%
			);
		}

		.container {
			display: flex;
			align-items: center;
			gap: 30px;
		}

		.logo {
			height: 44px;
			flex: 1;
		}

		a {
			color: var(--color--text);
		}

		.links {
			display: flex;
			align-items: center;
			justify-content: flex-end;
			gap: 30px;
		}
	}
</style>
