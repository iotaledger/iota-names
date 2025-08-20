import type { MDXComponents } from 'mdx/types';

export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        h1: (props) => <h1 className="text-2xl mb-4" {...props} />,
        p: (props) => <p className="mb-4" {...props} />,
        ...components,
    };
}
