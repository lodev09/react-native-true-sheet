import { llms } from 'fumadocs-core/source';
import { site } from '@/lib/site';
import { source } from '@/lib/source';

export const revalidate = false;

export function GET() {
  const latest = source.getPageTree().children.find((node) => node.$id === 'latest');
  if (!latest) throw new Error('Missing latest docs');

  return new Response(
    `# ${site.name}\n\n> ${site.description}\n\n${llms(source).indexNode(latest)}`
  );
}
