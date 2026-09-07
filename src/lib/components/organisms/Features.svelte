<script lang="ts">
	import type { Feature } from '$lib/utils/types';
	import FeatureCard from '$lib/components/molecules/FeatureCard.svelte';
	import { Section, SectionHeader } from '$lib/components/ui';

	export let features: Feature[];
</script>

<Section id="features" class="content-section top">
	<div class="title-area">
		<SectionHeader title="Features" description="Here are some of the features of this template" />
	</div>
	<div class="content-area">
		<div class="features-container">
			<div class="three-group-grid">
				{#each features as feature (feature.name)}
					<FeatureCard
						name={feature.name}
						description={feature.description}
						image={feature.image}
						tags={feature.tags}
					/>
				{/each}
			</div>
		</div>
	</div>
</Section>

<style lang="scss">
	@use '$lib/scss/breakpoints' as *;

	:global(.content-section) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 40px;
		padding: 50px 0;

		.title-area {
			flex: 2;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 15px;
			text-align: center;
		}

		:global(.ui-section-header) {
			flex-direction: column;
			align-items: center;
			gap: 5px;
		}

		.content-area {
			display: grid;
			flex: 5;
			place-items: center;
		}

		@include for-tablet-landscape-up {
			flex-direction: column;

			.title-area {
				order: 1;
				max-width: 600px;
			}

			.content-area {
				order: 2;
				width: 100%;
			}
		}

		@include for-tablet-portrait-down {
			flex-direction: column;
		}
	}

	.features-container {
		width: 100%;
		display: grid;
		grid-template-columns: 1fr;
		grid-gap: 20px;
	}

	.three-group-grid {
		width: 100%;
		display: grid;
		grid-template-columns: 2fr 1fr;
		grid-gap: 20px;

		@media (max-width: 1085px) {
			grid-template-columns: 1fr 1fr;
		}

		@include for-phone-only {
			grid-template-columns: 1fr;
		}

		// Select every 3 elements, starting from position 2
		// And make it take up 2 rows
		@media (min-width: 1086px) {
			> :global(:nth-child(3n + 2)) {
				grid-row: span 2;
			}
		}

		// Select every 3 elements, starting from position 1
		// And make it take up 2 columns
		> :global(:nth-child(3n + 1)) {
			@media (max-width: 1085px) {
				grid-column: span 2;
			}

			@include for-tablet-portrait-down {
				grid-template-columns: 1fr;
				grid-column: unset;
			}
		}
	}
</style>
