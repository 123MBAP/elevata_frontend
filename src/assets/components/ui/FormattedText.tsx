import React, { useMemo } from 'react';

interface FormattedTextProps {
  text?: string;
  className?: string;
  fallbackText?: string;
}

export const parseInlineStyles = (content: string): React.ReactNode => {
  if (!content) return '';

  // Match: **bold**, *italic*, <u>underline</u>, `code`
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|<u>(.+?)<\/u>|`(.+?)`)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }

    if (match[2] !== undefined) {
      // Bold
      parts.push(
        <strong key={parts.length} className="font-bold text-slate-900">
          {match[2]}
        </strong>
      );
    } else if (match[3] !== undefined) {
      // Italic
      parts.push(
        <em key={parts.length} className="italic text-slate-800">
          {match[3]}
        </em>
      );
    } else if (match[4] !== undefined) {
      // Underline
      parts.push(
        <span key={parts.length} className="underline underline-offset-2 decoration-slate-400">
          {match[4]}
        </span>
      );
    } else if (match[5] !== undefined) {
      // Code
      parts.push(
        <code key={parts.length} className="px-1 py-0.5 bg-slate-100 text-slate-800 rounded text-[11px] font-mono border border-slate-200">
          {match[5]}
        </code>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts.length > 0 ? parts : content;
};

/**
 * Decodes HTML entities (e.g., &lt;button&gt; -> <button>)
 */
export const decodeHtmlEntities = (raw: string): string => {
  if (!raw || (!raw.includes('&lt;') && !raw.includes('&gt;') && !raw.includes('&amp;') && !raw.includes('&quot;') && !raw.includes('&#') && !raw.includes('&nbsp;'))) {
    return raw;
  }
  if (typeof window === 'undefined') {
    return raw
      .replace(/&nbsp;/gi, ' ')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&amp;/gi, '&');
  }
  try {
    const txt = document.createElement('textarea');
    txt.innerHTML = raw;
    let decoded = txt.value;
    if (decoded.includes('&lt;') || decoded.includes('&gt;') || decoded.includes('&amp;')) {
      txt.innerHTML = decoded;
      decoded = txt.value;
    }
    return decoded;
  } catch {
    return raw;
  }
};

/**
 * Strips HTML tags, entities, and Markdown syntax to produce clean, readable plain text.
 * Essential for card previews, list summaries, tooltips, and search filtering.
 */
export const stripFormattedText = (raw?: string | null, fallback = ''): string => {
  if (!raw || typeof raw !== 'string') return fallback;

  let text = raw.trim();
  if (!text) return fallback;

  // 1. Decode HTML entities
  text = decodeHtmlEntities(text);

  // 2. Extract plain text content using DOMParser if in browser
  if (typeof window !== 'undefined' && (text.includes('<') || text.includes('>'))) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');

      // Remove non-content and noisy elements
      const unwanted = doc.querySelectorAll('script, style, svg, noscript, iframe, head');
      unwanted.forEach(el => el.remove());

      // Separate block elements with a space so words don't get glued together
      const blocks = doc.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li, br, hr, tr, td, button, section, article');
      blocks.forEach(b => {
        b.insertAdjacentText('afterend', ' ');
      });

      const extracted = doc.body.textContent || '';
      if (extracted.trim()) {
        text = extracted;
      }
    } catch {
      // Regex fallback below
    }
  }

  // 3. Fallback regex to clean any remaining HTML tags (including unclosed tags like <button ... or <div ...)
  text = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/<[a-zA-Z][^>]*$/g, ' ');

  // 4. Clean Markdown syntax
  text = text
    // Remove headings: #, ##, ###, ####, #####, ###### at start of line
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold and italics: **text**, *text*, __text__, _text_
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove strikethrough: ~~text~~
    .replace(/~~([^~]+)~~/g, '$1')
    // Remove inline code: `code`
    .replace(/`([^`]+)`/g, '$1')
    // Remove links: [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove image links: ![alt](url) -> ''
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    // Remove blockquotes: > text
    .replace(/^>\s+/gm, '')
    // Remove bullet / list markers: -, *, +, •, 1.
    .replace(/^[\s*•\-–—+]+(?:\d+\.)?\s+/gm, '')
    // Remove dividers: ---, ***, ___
    .replace(/^[-*_]{3,}\s*$/gm, '');

  // 5. Normalize whitespace (tabs, newlines, multiple spaces -> single space)
  text = text.replace(/\s+/g, ' ').trim();

  return text || fallback;
};

/**
 * Sanitizes rich HTML, unwraps noisy external interactive elements (like buttons or tabs),
 * strips Tailwind variable clutter, and converts text into clean readable semantic markup.
 */
const sanitizeAndFormatHtml = (rawHtml: string): string => {
  if (typeof window === 'undefined') return rawHtml;

  try {
    const decoded = decodeHtmlEntities(rawHtml);
    const parser = new DOMParser();
    const doc = parser.parseFromString(decoded, 'text/html');

    // 1. Remove dangerous or noisy elements
    const unwanted = doc.querySelectorAll('script, style, form, input, select, textarea, svg, meta, link, iframe, noscript');
    unwanted.forEach(el => el.remove());

    // 2. Unwrap external buttons, custom tabs, nav items into clean paragraphs/spans
    const wrappers = doc.querySelectorAll('button, [role="tab"], [role="button"], [role="navigation"], nav, header, footer');
    wrappers.forEach(w => {
      const text = w.textContent?.trim();
      if (text) {
        const p = doc.createElement('p');
        p.textContent = text;
        w.parentNode?.replaceChild(p, w);
      } else {
        w.remove();
      }
    });

    // 3. Clean attributes across all elements to avoid layout breakage or CSS variable bloat
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(el => {
      // Remove class, id, roles, and aria clutter
      el.removeAttribute('class');
      el.removeAttribute('id');
      el.removeAttribute('role');
      el.removeAttribute('aria-selected');
      el.removeAttribute('aria-controls');
      el.removeAttribute('aria-expanded');
      el.removeAttribute('tabindex');

      // Clean inline styles
      const style = el.getAttribute('style');
      if (style) {
        if (style.includes('--tw') || style.includes('margin') || style.includes('padding') || style.includes('position') || style.includes('font-size') || style.includes('display')) {
          if (style.includes('border-left') || style.includes('background: #f0f9ff') || style.includes('color: #0369a1')) {
            el.setAttribute('style', 'border-left: 3px solid #2998d6; background: #f0f9ff; padding: 8px 12px; margin: 8px 0; border-radius: 4px; color: #0369a1;');
          } else {
            el.removeAttribute('style');
          }
        }
      }
    });

    // 4. Ensure empty spans or empty divs are cleaned up
    const emptyNodes = doc.querySelectorAll('span:empty, div:empty');
    emptyNodes.forEach(n => n.remove());

    const result = doc.body.innerHTML.trim();
    return result || rawHtml;
  } catch {
    return rawHtml;
  }
};

export default function FormattedText({
  text,
  className = '',
  fallbackText = 'No details provided.'
}: FormattedTextProps) {
  if (!text || !text.trim()) {
    return <p className="text-slate-400 italic text-[11px]">{fallbackText}</p>;
  }

  // Pre-decode entities to detect actual tags
  const decodedText = useMemo(() => decodeHtmlEntities(text), [text]);

  // Check if content contains HTML tags
  const isHtml = useMemo(() => {
    return /<[a-z][\s\S]*>/i.test(decodedText) || /<[a-z0-9]+(\s+[^>]*)?>/i.test(decodedText);
  }, [decodedText]);

  const sanitizedHtml = useMemo(() => {
    if (!isHtml) return '';
    return sanitizeAndFormatHtml(decodedText);
  }, [decodedText, isHtml]);

  if (isHtml && sanitizedHtml) {
    return (
      <div
        className={`space-y-2.5 text-xs leading-relaxed font-sans text-slate-700 
          [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:border-b [&_h1]:border-slate-200 [&_h1]:pb-1
          [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-3.5 [&_h2]:mb-1.5 [&_h2]:border-b [&_h2]:border-slate-150 [&_h2]:pb-0.5
          [&_h3]:text-xs [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:uppercase [&_h3]:tracking-wider [&_h3]:text-[#2998d6]
          [&_h4]:text-xs [&_h4]:font-bold [&_h4]:text-slate-800 [&_h4]:mt-2.5 [&_h4]:mb-1
          [&_p]:my-1.5 [&_p]:leading-relaxed [&_p]:text-slate-700
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ul]:space-y-1
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_ol]:space-y-1
          [&_li]:leading-relaxed [&_li]:text-slate-700
          [&_blockquote]:border-l-3 [&_blockquote]:border-[#2998d6] [&_blockquote]:bg-sky-50/80 [&_blockquote]:p-3 [&_blockquote]:my-2.5 [&_blockquote]:rounded-r-lg [&_blockquote]:text-[#0369a1] [&_blockquote]:italic [&_blockquote]:shadow-2xs
          [&_strong]:font-bold [&_strong]:text-slate-900
          [&_em]:italic [&_em]:text-slate-800
          [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:bg-slate-100 [&_code]:text-slate-800 [&_code]:rounded [&_code]:font-mono [&_code]:text-[11px]
          ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  }

  // Split by multiple linebreaks into distinct paragraphs for markdown
  const paragraphs = decodedText.split(/\n\n+/);

  return (
    <div className={`space-y-3 text-xs leading-relaxed font-sans text-slate-700 ${className}`}>
      {paragraphs.map((p, pIdx) => {
        const lines = p.split(/\n/);
        return (
          <div key={pIdx} className="space-y-1.5">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();

              // Major Heading 2 (## Heading)
              if (trimmed.startsWith('## ')) {
                return (
                  <h3
                    key={lIdx}
                    className="font-extrabold text-slate-900 text-xs pt-2 pb-0.5 uppercase tracking-wide border-b border-slate-150 flex items-center gap-1.5 text-[#2998d6]"
                  >
                    <span className="w-1.5 h-3.5 bg-[#2998d6] rounded-xs inline-block"></span>
                    <span>{trimmed.replace(/^##\s+/, '')}</span>
                  </h3>
                );
              }

              // Subheading 3 (### Heading)
              if (trimmed.startsWith('### ')) {
                return (
                  <h4
                    key={lIdx}
                    className="font-bold text-slate-900 text-[11.5px] pt-1.5 pb-0.5 border-b border-slate-100 uppercase tracking-wider"
                  >
                    {trimmed.replace(/^###\s+/, '')}
                  </h4>
                );
              }

              // Bullet List (•, -, *)
              if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                const bulletContent = trimmed.replace(/^[•\-*]\s+/, '');
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-1.5 text-slate-700">
                    <span className="text-[#2998d6] font-black text-sm leading-none mt-0.5 shrink-0">•</span>
                    <span className="leading-snug">{parseInlineStyles(bulletContent)}</span>
                  </div>
                );
              }

              // Numbered List (1., 2., etc.)
              if (/^\d+\.\s+/.test(trimmed)) {
                const match = trimmed.match(/^(\d+)\.\s+(.*)/);
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-1.5 text-slate-700">
                    <span className="text-[#2998d6] font-bold font-mono text-[10.5px] shrink-0 mt-0.5">
                      {match ? match[1] : '1'}.
                    </span>
                    <span className="leading-snug">{parseInlineStyles(match ? match[2] : trimmed)}</span>
                  </div>
                );
              }

              // Blockquote / Callout (> text)
              if (trimmed.startsWith('> ')) {
                const quoteContent = trimmed.replace(/^>\s+/, '');
                return (
                  <blockquote
                    key={lIdx}
                    className="border-l-3 border-[#2998d6] pl-3 py-2 my-1 text-[#0369a1] italic bg-sky-50/70 rounded-r-md leading-relaxed shadow-2xs"
                  >
                    {parseInlineStyles(quoteContent)}
                  </blockquote>
                );
              }

              // Divider (---)
              if (trimmed === '---') {
                return <hr key={lIdx} className="my-2 border-slate-200" />;
              }

              // Standard Paragraph Line
              return (
                <p key={lIdx} className="leading-relaxed">
                  {parseInlineStyles(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
