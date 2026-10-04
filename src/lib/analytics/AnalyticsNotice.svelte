<script>
	import { getContext } from 'svelte';
	import { Section } from '$lib/components/ui';
	import { ANALYTICS_CONTEXT } from './tracker.js';

	const analytics = getContext(ANALYTICS_CONTEXT);
	let { clearMenu = false } = $props();
</script>

{#if analytics?.enabled && analytics.consent !== 'denied'}
	<div class="analytics-notice-container" class:clear-menu={clearMenu}>
		<Section variant="card" padding="compact" gap="body" aria-label="방문 통계 안내">
			<p class="analytics-notice">
				Google Analytics로 쿠키 없이 방문 통계를 수집합니다. 도구에 입력한 내용은 보내지 않습니다.
				자세한 내용은 아래 개인정보처리방침에서 확인할 수 있습니다.
				<a href="https://policies.google.com/technologies/partner-sites?hl=ko"
					>Google 데이터 이용 안내</a
				>
			</p>
		</Section>
	</div>
{/if}

<style>
	.analytics-notice-container {
		margin: var(--space-16) var(--space-16) 0;
	}

	.clear-menu {
		margin-top: var(--space-64);
	}

	.analytics-notice {
		margin: 0;
		color: var(--ui-text);
		font-size: var(--font-size-14);
		line-height: 1.7;
		overflow-wrap: anywhere;
	}

	.analytics-notice a {
		color: inherit;
		text-decoration: underline;
	}

	@media (max-width: 1200px) {
		.analytics-notice-container {
			display: none;
		}
	}
</style>
