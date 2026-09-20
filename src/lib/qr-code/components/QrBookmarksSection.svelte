<script>
	import RemoveRowButton from '$lib/components/ui/RemoveRowButton.svelte';
	import { Button } from '$lib/components/ui';
	import { Section } from '$lib/components/ui';
	import { SectionHeader } from '$lib/components/ui';
	import { EmptyState } from '$lib/components/ui';
	let { onopen, storageError, bookmarks, deleted, removeBookmark, undoDelete } = $props();
</script>

<Section
	variant="card"
	padding="card"
	gap="body"
	class="qr-panel qr-bookmarks"
	aria-labelledby="qr-bookmarks-title"
>
	<SectionHeader class="qr-section-header" title="내 북마크" titleId="qr-bookmarks-title"
		>{#snippet titleSuffix()}<span class="count">{bookmarks.length}</span>{/snippet}</SectionHeader
	>
	<div class="qr-bookmark-content">
		{#if bookmarks.length}
			<ul>
				{#each bookmarks as item, index (index)}<li>
						<Button variant="ghost" class="bookmark-open" onclick={() => onopen(item)}
							><strong>{item.title || '제목 없는 QR 코드'}</strong><span>{item.content}</span
							></Button
						><RemoveRowButton
							label={`${item.title || '제목 없는 QR 코드'} 북마크 삭제`}
							onclick={() => removeBookmark(index)}
						/>
					</li>{/each}
			</ul>
		{:else}<EmptyState
				class="bookmark-empty"
				title="자주 쓰는 QR 코드를 모아 두세요."
				description="만든 뒤 ‘북마크에 저장’을 누르면 다시 꺼내 쓸 수 있습니다."
			/>{/if}
	</div>
	{#if deleted}<Button variant="ghost" size="sm" onclick={undoDelete}>북마크 삭제 취소</Button>{/if}
	{#if storageError}<p class="qr-error" role="alert">{storageError}</p>{/if}
</Section>
