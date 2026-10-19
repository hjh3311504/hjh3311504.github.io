<script>
	// 우승 칸과 진행 상태 띠에서 같이 쓰는 트로피 선 아이콘
	let { class: className = 'bracket-trophy' } = $props();
</script>

<svg class={className} viewBox="0 0 48 48" aria-hidden="true">
	<path d="M14 7h20v8c0 8-4.5 13-10 13s-10-5-10-13z" />
	<path d="M14 10H8c0 8 3 12 8 13.5M34 10h6c0 8-3 12-8 13.5" />
	<path d="M21.5 28c0 4-1 6.5-3 8h11c-2-1.5-3-4-3-8" />
	<path d="M16 41c0-3 1.5-5 4-5h8c2.5 0 4 2 4 5z" />
</svg>
