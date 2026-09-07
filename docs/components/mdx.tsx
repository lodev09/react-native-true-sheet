import { CalloutContainer, type CalloutContainerProps } from 'fumadocs-ui/components/callout';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { StaticCodeBlock } from './code-block';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    CalloutContainer: (props: CalloutContainerProps) => (
      <CalloutContainer
        {...props}
        className="border-(--callout-color)/20 bg-(--callout-color)/10 ps-3 shadow-none [&>[role=none]]:hidden"
      />
    ),
    pre: StaticCodeBlock,
    ...components,
  } satisfies MDXComponents;
}
