import { CalloutContainer, type CalloutContainerProps } from 'fumadocs-ui/components/callout';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import type { HTMLAttributes } from 'react';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    CalloutContainer: (props: CalloutContainerProps) => (
      <CalloutContainer
        {...props}
        className="border-(--callout-color)/20 bg-(--callout-color)/10 shadow-none"
      />
    ),
    pre: (props: HTMLAttributes<HTMLPreElement>) => (
      <CodeBlock {...props} keepBackground>
        <Pre>{props.children}</Pre>
      </CodeBlock>
    ),
    ...components,
  } satisfies MDXComponents;
}
