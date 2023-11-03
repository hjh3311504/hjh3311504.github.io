// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types

declare global {
	declare namespace App {
		type NoUndefinedField<T> = { [P in keyof T]-?: NoUndefinedField<NonNullable<T[P]>> };
	
		type SparkleType = {
			id: string,
			createdAt: number,
			color: string,
			size: number,
			style: any
		};
	
		type TagType = {
			label: string,
			color?: 'primary' | 'secondary'
		};
	
		type SocialLink = {
		
		};
	
		type Feature = {
			name: string,
			description: string,
			image: string,
			tags: TagType[]
		};
	
		type BlogPost = {
			tags: string[],
			keywords: string[],
			hidden: boolean,
			slug: string,
			title: string,
			date: string,
			updated: string,
			excerpt: string,
			html: string | undefined,
			readingTime: string,
			relatedPosts: BlogPost[],
			coverImage: string | undefined
		};
	}
	
}

declare module "*&imagetools" {
	/**
	 * actual types
	 * - code https://github.com/JonasKruckenberg/imagetools/blob/main/packages/core/src/output-formats.ts
	 * - docs https://github.com/JonasKruckenberg/imagetools/blob/main/docs/guide/getting-started.md#metadata
	 */
	const out;
	export default out;
}

export {};