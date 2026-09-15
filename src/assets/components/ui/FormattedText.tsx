import React from 'react';

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
        <code key={parts.length} className="px-1 py-0.5 bg-slate-100 text-slate-800 rounded text-[11px] font-mono border border-slate-250">
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

export default function FormattedText({
  text,
  className = '',
  fallbackText = 'No details provided.'
}: FormattedTextProps) {
  if (!text || !text.trim()) {
    return <p className="text-slate-400 italic text-[11px]">{fallbackText}</p>;
  }

  // Split by multiple linebreaks into distinct paragraphs
  const paragraphs = text.split(/\n\n+/);

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
                    className="font-extrabold text-slate-900 text-xs pt-1.5 pb-0.5 uppercase tracking-wide border-b border-slate-150 flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-3.5 bg-emerald-500 rounded-xs inline-block"></span>
                    <span>{trimmed.replace(/^##\s+/, '')}</span>
                  </h3>
                );
              }

              // Subheading 3 (### Heading)
              if (trimmed.startsWith('### ')) {
                return (
                  <h4
                    key={lIdx}
                    className="font-bold text-slate-900 text-[11.5px] pt-1 pb-0.5 border-b border-slate-100"
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
                    <span className="text-emerald-600 font-black text-sm leading-none mt-0.5 shrink-0">•</span>
                    <span className="leading-snug">{parseInlineStyles(bulletContent)}</span>
                  </div>
                );
              }

              // Numbered List (1., 2., etc.)
              if (/^\d+\.\s+/.test(trimmed)) {
                const match = trimmed.match(/^(\d+)\.\s+(.*)/);
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-1.5 text-slate-700">
                    <span className="text-emerald-700 font-bold font-mono text-[10.5px] shrink-0 mt-0.5">
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
                    className="border-l-3 border-emerald-500 pl-3 py-1.5 my-1 text-slate-700 italic bg-emerald-50/40 rounded-r-md leading-relaxed"
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
