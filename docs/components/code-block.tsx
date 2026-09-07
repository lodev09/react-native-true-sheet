import { CodeBlock, type CodeBlockProps, Pre } from 'fumadocs-ui/components/codeblock';

export function StaticCodeBlock({ children, ...props }: CodeBlockProps) {
  return (
    <CodeBlock {...props} viewportProps={{ className: 'max-h-none overflow-visible' }}>
      <Pre className="w-full whitespace-pre-wrap break-words">{children}</Pre>
    </CodeBlock>
  );
}
