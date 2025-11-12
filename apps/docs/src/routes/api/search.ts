import { createFileRoute } from '@tanstack/react-router';
import { createFromSource } from 'fumadocs-core/search/server';
import { source } from '@/lib/source';

const server = createFromSource(source, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: 'english',
});

export const Route = createFileRoute('/api/search')({
  // @ts-ignore 'server prop does not exist'
  server: {
    handlers: {
      GET: async ({ request }: {request: Request}) => server.GET(request),
    },
  },
});
