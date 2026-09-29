<script>
	import { getContext } from 'svelte';
	import { Button, Section } from '$lib/components/ui';
	import { ANALYTICS_CONTEXT } from './tracker.js';

	const analytics = getContext(ANALYTICS_CONTEXT);
	let { clearMenu = false } = $props();
</script>

{#if analytics?.enabled && analytics.consent === 'unknown'}
	<div class="analytics-consent" class:clear-menu={clearMenu}>
		<Section variant="card" padding="compact" gap="body" aria-label="방문 통계 선택">
			<p class="analytics-notice">
				방문 통계를 허용하면 Google Analytics 쿠키로 방문자 수와 페이지 조회 수를 집계합니다. 도구에
				입력한 내용은 보내지 않습니다. 거부해도 모든 도구를 사용할 수 있습니다. 선택은 아래
				개인정보처리방침에서 바꿀 수 있습니다.
				<a href="https://policies.google.com/technologies/partner-sites?hl=ko"
					>Google 데이터 이용 안내</a
				>
			</p>
			<div class="analytics-actions">
				<Button size="sm" onclick={() => analytics.setConsent('denied')}>통계 거부</Button>
				<Button size="sm" onclick={() => analytics.setConsent('allowed')}>통계 허용</Button>
			</div>
		</Section>
	</div>
{/if}

<style>
	.analytics-consent {
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

	.analytics-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-8);
	}
</style>
