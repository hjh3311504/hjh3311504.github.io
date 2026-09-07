<script lang="ts">
	import Tag from '$lib/components/atoms/Tag.svelte';
	import { Surface } from '$lib/components/ui';
	import type { TagType } from '$lib/utils/types';
	import Image from '../atoms/Image.svelte';

	export let name: string;
	export let description: string;
	export let image: string;
	export let tags: TagType[] | undefined;
</script>

<Surface as="article" variant="card" class="card feature-card">
	<div class="image">
		<Image src={image} alt="Picture describing the {name} feature" />
	</div>
	<div class="body">
		<div class="content">
			<div class="title">
				<span>{name}</span>
			</div>
			<p>{description}</p>
		</div>
		<div class="footer">
			{#if tags && tags.length > 0}
				<div class="tags">
					{#each tags as tag (tag.label)}
						<Tag color={tag.color}>{tag.label}</Tag>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</Surface>

<style lang="scss">
	:global(.feature-card) {
		position: relative;
		display: flex;
		flex-flow: row wrap;
		width: 100%;
		overflow: hidden;
		color: var(--color--text);
		background: var(--color--card-background);
		border: 0;
		border-radius: 10px;
		box-shadow: var(--card-shadow);
		transition: all 0.4s ease;
	}

	:global(.feature-card[href]),
	:global(.feature-card[onclick]) {
		cursor: pointer;
	}

	:global(.feature-card[href]:hover),
	:global(.feature-card[onclick]:hover) {
		box-shadow: var(--card-shadow-hover);
		transform: scale(1.01);
	}

	.body {
		display: flex;
		flex: 1 0 50%;
		flex-direction: column;
		justify-content: space-between;
		gap: 10px;
		padding: 20px;
	}

	.image {
		position: relative;
		flex: 1 0 max(50%, 330px);
		min-height: 280px;
		max-height: 350px;
	}

	.content {
		display: flex;
		flex-direction: column;
		gap: 10px;
		align-items: flex-start;
	}

	.title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;

		font-size: 1.2rem;
		font-family: var(--font--title);
		font-weight: 700;
	}

	.tags {
		display: flex;
		align-items: center;
		gap: 5px;
		flex-wrap: wrap;
	}

	.footer {
		margin-top: 20px;
	}

	:global(.feature-card .image img) {
		position: absolute;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
