import { filteredPosts } from '$lib/data/blog-posts';

/** @param {{url: {pathname: string}}} */
export async function load({ url }) {
  const { pathname } = url;
  const slug = pathname.replace('/', '');
  const post = filteredPosts.find((post) => post.slug === slug);

  return {
    post
  };
}
