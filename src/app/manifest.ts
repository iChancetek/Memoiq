import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MemoIQ',
    short_name: 'MemoIQ',
    description: 'Your intelligent assistant for memos, tasks, and more.',
    start_url: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'minimal-ui'],
    background_color: '#000005',
    theme_color: '#000080',
    categories: ['productivity', 'utilities'],
    icons: [
      {
        src: '/icon',
        sizes: 'any',
        type: 'image/png',
      },
    ],
    shortcuts: [
      {
        name: 'Dashboard',
        url: '/dashboard',
        description: 'View your daily briefing',
      },
      {
        name: 'New Memo',
        url: '/memos',
        description: 'Record a new voice note',
      },
    ],
  };
}
