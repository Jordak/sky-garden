import React from 'react';

interface SafeMarkdownBlockProps {
  readonly markdown: string;
  readonly className?: string;
}

function isSafeHttpsUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Minimal pure-React Markdown renderer for Panoptes task help & Field Guide text.
 * Supports paragraphs, bullet lists, **bold**, *italic*, and https:// links without HTML injection.
 */
function renderInlineNodes(text: string, keyPrefix: string): React.ReactNode[] {
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(<strong key={`${keyPrefix}-b-${idx}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(<em key={`${keyPrefix}-i-${idx}`}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith('[')) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch && isSafeHttpsUrl(linkMatch[2].trim())) {
        nodes.push(
          <a
            key={`${keyPrefix}-a-${idx}`}
            href={linkMatch[2].trim()}
            target="_blank"
            rel="noopener noreferrer"
            className="safe-md-link"
          >
            {linkMatch[1]} ↗
          </a>,
        );
      } else {
        nodes.push(linkMatch ? linkMatch[1] : token);
      }
    }
    lastIndex = match.index + token.length;
    idx += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

export const SafeMarkdownBlock: React.FC<SafeMarkdownBlockProps> = ({
  markdown,
  className = 'safe-md-block',
}) => {
  const blocks = markdown
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) return null;

  return (
    <div className={className}>
      {blocks.map((block, bIdx) => {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
        const isBulletList = lines.length > 0 && lines.every((l) => /^[-*]\s+/.test(l));

        if (isBulletList) {
          return (
            <ul key={`ul-${bIdx}`} className="safe-md-list">
              {lines.map((line, lIdx) => (
                <li key={`li-${bIdx}-${lIdx}`}>
                  {renderInlineNodes(line.replace(/^[-*]\s+/, ''), `li-${bIdx}-${lIdx}`)}
                </li>
              ))}
            </ul>
          );
        }

        const headingMatch = block.match(/^#{1,4}\s+(.+)$/);
        if (headingMatch) {
          return (
            <p key={`h-${bIdx}`} className="safe-md-heading">
              <strong>{renderInlineNodes(headingMatch[1], `h-${bIdx}`)}</strong>
            </p>
          );
        }

        return (
          <p key={`p-${bIdx}`} className="safe-md-paragraph">
            {renderInlineNodes(lines.join(' '), `p-${bIdx}`)}
          </p>
        );
      })}
    </div>
  );
};
