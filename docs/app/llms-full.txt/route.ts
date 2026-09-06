import { getLLMText, latest } from '@/lib/source';

export const revalidate = false;

export async function GET() {
  const pages = await Promise.all(latest.source.getPages().map(getLLMText));

  return new Response(pages.join('\n\n'));
}
