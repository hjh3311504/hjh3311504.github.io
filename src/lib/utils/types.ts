export type NoUndefinedField<T> = { [P in keyof T]: NoUndefinedField<NonNullable<T[P]>> };

export type SparkleType = {
	id: string;
	createdAt: number;
	color: string;
	size: number;
	style: Record<string, string>;
};

export type TagType = {
	label: string;
	color?: 'primary' | 'secondary';
};

export type Feature = {
	name: string;
	description: string;
	image: string;
	tags?: TagType[];
};
