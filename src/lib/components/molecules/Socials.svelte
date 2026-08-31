<script>
	import { resolve } from '$app/paths';
	import GitHubIcon from '$lib/icons/socials/github.svelte';
	import RssIcon from '$lib/icons/rss.svelte';
</script>

<div class="socials">
	<a
		href="https://github.com/hjh3311504"
		target="_blank"
		rel="noopener noreferrer"
		title="GitHub profile"
		aria-label="GitHub profile"
	>
		<GitHubIcon />
	</a>
	<a href={resolve('/rss.xml')} title="RSS feed" aria-label="RSS feed">
		<RssIcon />
	</a>
</div>

<style lang="scss">
	@use '$lib/scss/breakpoints' as *;
	.socials {
		display: flex;
		align-items: center;
		gap: 20px;

		a {
			transition: all 0.2s ease-in-out;
			width: 24px;
			color: var(--color--text);
			fill: var(--color--text);

			&:hover {
				color: var(--color--primary);
				fill: var(--color--primary);
				filter: drop-shadow(0px 0px 3px var(--color--primary));
			}
		}
	}
</style>
