import { getLLMText, source } from '@/lib/source';

export const revalidate = false;

export async function GET() {
  const pages = await Promise.all(
    source
      .getPages()
      .filter((page) => page.path.startsWith('latest/'))
      .map(getLLMText)
  );

  return new Response(pages.join('\n\n'));
}
