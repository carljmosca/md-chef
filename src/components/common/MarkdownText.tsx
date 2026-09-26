import React from 'react';
import { renderMarkdownInline } from '../../services/inlineMarkdown';

export { renderMarkdownInline };

export const MarkdownText: React.FC<{
  children: string;
  className?: string;
  as?: 'span' | 'p' | 'div';
}> = ({ children, className, as: Component = 'span' }) => {
  return <Component className={className}>{renderMarkdownInline(children)}</Component>;
};
