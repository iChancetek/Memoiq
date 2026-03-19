import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MemoIQ',
    short_name: 'MemoIQ',
    description: 'Your intelligent assistant for memos, tasks, and more.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000080',
    theme_color: '#000080',
    icons: [
      {
        src: '/icon',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  };
}
