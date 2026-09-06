import { llms } from 'fumadocs-core/source';
import { versions } from '@/lib/source';

export const revalidate = false;

export function GET() {
  const sections = versions.map(
    (version) => `## ${version.label}\n\n${llms(version.source).index()}`
  );

  return new Response(sections.join('\n\n'));
}
