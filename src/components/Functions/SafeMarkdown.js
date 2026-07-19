import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

/** Allow underline + basic formatting used in Cardify markdown. */
export const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), 'u'],
};

/**
 * Safe markdown renderer — raw HTML allowed only through sanitize schema.
 */
export function SafeMarkdown({ children, className, components }) {
  return (
    <ReactMarkdown
      className={className}
      rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
      components={components}
    >
      {children}
    </ReactMarkdown>
  );
}

export default SafeMarkdown;
