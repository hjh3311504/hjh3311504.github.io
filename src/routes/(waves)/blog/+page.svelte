<script>
	import BlogPostCard from '$lib/components/molecules/BlogPostCard.svelte';
	import ContentSection from '$lib/components/organisms/ContentSection.svelte';
	import Footer from '$lib/components/organisms/Footer.svelte';
	import SiteShell from '$lib/components/organisms/SiteShell.svelte';

	/** @type {{posts: App.BlogPost[]}} */
	export let data;

	let { posts } = data;
</script>

<SiteShell active="blog" variant="home">
	<div class="blog-page">
		<main>
			<div class="container">
				<ContentSection title="All Blog Posts">
					<div class="grid">
						{#each posts as post (post.slug)}
							<BlogPostCard
								title={post.title}
								coverImage={post.coverImage}
								excerpt={post.excerpt}
								readingTime={post.readingTime}
								slug={post.slug}
								tags={post.tags}
							/>
						{/each}
					</div>
				</ContentSection>
			</div>
		</main>
		<Footer />
	</div>
</SiteShell>

<style lang="scss">
	@use '$lib/scss/breakpoints' as *;
	@use '$lib/scss/mixins' as *;

	.blog-page {
		display: flex;
		flex: 1 1 auto;
		flex-direction: column;
		min-width: 0;
		min-height: 100vh;

		main {
			flex: 1 1 auto;
		}
	}

	.grid {
		width: 100%;
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
		grid-gap: 20px;

		@include for-tablet-portrait-down {
			grid-template-columns: 1fr;
		}

		@include for-tablet-landscape-up {
			// Select every 6 elements, starting from position 1
			// And make it take up 6 columns
			> :global(:nth-child(6n + 1)) {
				grid-column: span 6;
			}
			// Select every 6 elements, starting from position 2
			// And make it take up 3 columns
			> :global(:nth-child(6n + 2)) {
				grid-column: span 3;
			}
			// Select every 6 elements, starting from position 3
			// And make it take up 3 columns
			> :global(:nth-child(6n + 3)) {
				grid-column: span 3;
			}
			// Select every 6 elements, starting from position 4, 5 and 6
			// And make it take up 2 columns
			> :global(:nth-child(6n + 4)),
			:global(:nth-child(6n + 5)),
			:global(:nth-child(6n + 6)) {
				grid-column: span 2;
			}
		}
	}
</style>
