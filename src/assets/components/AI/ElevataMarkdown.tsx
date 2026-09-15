import React from 'react';

interface Props {
  content: string;
}

export default function ElevataMarkdown({ content }: Props) {
  if (!content) return null;

  // Split lines
  const lines = content.split('\n');

  const renderFormattedText = (text: string) => {
    // Process bold **text** and `code`
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 text-blue-700 text-xs font-mono border border-slate-200"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-700 font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Heading 1 / 2 / 3
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-sm font-bold text-slate-900 mt-2 mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
              {renderFormattedText(trimmed.replace('### ', ''))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-base font-bold text-slate-900 mt-3 mb-1 border-b border-slate-100 pb-1">
              {renderFormattedText(trimmed.replace('## ', ''))}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="text-lg font-bold text-slate-900 mt-3 mb-1.5">
              {renderFormattedText(trimmed.replace('# ', ''))}
            </h2>
          );
        }

        // Bullet points
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
          const bulletText = trimmed.replace(/^[-*•]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-blue-500 font-bold select-none">•</span>
              <div className="flex-1">{renderFormattedText(bulletText)}</div>
            </div>
          );
        }

        // Numbered list
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="font-semibold text-blue-600 text-xs min-w-4 text-right pt-0.5 select-none">
                {numMatch[1]}.
              </span>
              <div className="flex-1">{renderFormattedText(numMatch[2])}</div>
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={idx} className="my-1">
            {renderFormattedText(line)}
          </p>
        );
      })}
    </div>
  );
}
