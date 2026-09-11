<script>
	import SiteShell from './SiteShell.svelte';
	import { Button, Surface } from '$lib/components/ui';

	let { status = 404 } = $props();
	let missing = $derived(status === 404);
	let heading = $derived(missing ? '페이지를 찾을 수 없습니다' : '페이지를 불러오지 못했습니다');
</script>

<svelte:head>
	<title>{heading} | Lake's develog</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<SiteShell active="" variant="home">
	<main class="error-stage">
		<Surface variant="raised" class="error-card">
			<span class="status">{status}</span>
			<h1>{heading}</h1>
			<p>
				{missing
					? '주소가 바뀌었거나 없는 페이지입니다.'
					: '잠시 후 다시 시도하거나 홈에서 다른 도구를 열어 보세요.'}
			</p>
			<Button href="/" variant="primary">홈으로 이동</Button>
		</Surface>
	</main>
</SiteShell>

<style>
	.error-stage {
		display: grid;
		place-items: center;
		flex: 1;
		padding: 80px 24px;
	}
	:global(.error-card) {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 24px;
		width: min(100%, 640px);
		padding: clamp(24px, 5vw, 48px);
	}
	.status {
		color: var(--shell-nav-accent);
		font-size: 48px;
		font-weight: 800;
	}
	h1 {
		font-size: clamp(24px, 4vw, 32px);
		line-height: 1.3;
	}
	p {
		color: var(--shell-text-muted);
		font-size: 16px;
		line-height: 1.7;
	}
</style>
