import React from 'react';

/**
 * Parses inline markdown tokens:
 * - **bold** or __bold__
 * - *italic* or _italic_
 * - ~~strikethrough~~
 * - `code`
 * - [link text](https://url)
 */
export function renderMarkdownInline(text: string): React.ReactNode {
  if (!text) return text;

  // Regex tokenizing all supported inline markdown syntax:
  // 1: [text](url) -> match[2]=text, match[3]=url
  // 4: `code` -> match[5]=code
  // 6: **bold** or __bold__ -> match[7] or match[8]
  // 9: *italic* or _italic_ -> match[10] or match[11]
  // 12: ~~strike~~ -> match[13]
  const tokenRegex = /(\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*|__([^_]+)__)|(\*([^*]+)\*|_([^_]+)_)|(~~([^~]+)~~)/g;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    // Push plain text preceding this token
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }

    const key = `md-${match.index}-${elements.length}`;

    if (match[1]) {
      // Link: [text](url)
      const linkText = match[2];
      const linkUrl = match[3];
      elements.push(
        React.createElement(
          'a',
          {
            key,
            href: linkUrl,
            target: '_blank',
            rel: 'noopener noreferrer',
            onClick: (e: React.MouseEvent) => e.stopPropagation(),
            className: 'text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-0.5 font-medium'
          },
          linkText
        )
      );
    } else if (match[4]) {
      // Code: `code`
      const codeText = match[5];
      elements.push(
        React.createElement(
          'code',
          {
            key,
            className: 'px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-amber-700 dark:text-amber-400 font-mono text-xs'
          },
          codeText
        )
      );
    } else if (match[6]) {
      // Bold: **bold** or __bold__
      const boldText = match[7] || match[8];
      elements.push(
        React.createElement(
          'strong',
          {
            key,
            className: 'font-semibold text-stone-900 dark:text-stone-100'
          },
          renderMarkdownInline(boldText)
        )
      );
    } else if (match[9]) {
      // Italic: *italic* or _italic_
      const italicText = match[10] || match[11];
      elements.push(
        React.createElement(
          'em',
          {
            key,
            className: 'italic'
          },
          renderMarkdownInline(italicText)
        )
      );
    } else if (match[12]) {
      // Strikethrough: ~~strike~~
      const strikeText = match[13];
      elements.push(
        React.createElement(
          'del',
          {
            key,
            className: 'line-through text-stone-400 dark:text-stone-500'
          },
          renderMarkdownInline(strikeText)
        )
      );
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements.length === 1 && typeof elements[0] === 'string' ? elements[0] : elements;
}
