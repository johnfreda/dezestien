// Shared Portable Text ↔ Markdown utilities
// Used by: api/generate/route.ts, api/admin/articles/route.ts, AdminEditBar

// Generate a unique key for Sanity blocks
export function blockKey() {
  return Math.random().toString(36).slice(2, 10);
}

// Parse inline markdown (bold, italic, links) into Sanity spans + markDefs
export function parseInline(content: string) {
  const children: any[] = [];
  const markDefs: any[] = [];

  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/;
  const parts = content.split(regex);

  for (const part of parts) {
    if (!part) continue;

    if (part.startsWith('**') && part.endsWith('**')) {
      children.push({
        _type: 'span',
        _key: blockKey(),
        text: part.slice(2, -2),
        marks: ['strong'],
      });
    } else if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      children.push({
        _type: 'span',
        _key: blockKey(),
        text: part.slice(1, -1),
        marks: ['em'],
      });
    } else {
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const linkKey = blockKey();
        markDefs.push({
          _type: 'link',
          _key: linkKey,
          href: linkMatch[2],
        });
        children.push({
          _type: 'span',
          _key: blockKey(),
          text: linkMatch[1],
          marks: [linkKey],
        });
      } else {
        children.push({
          _type: 'span',
          _key: blockKey(),
          text: part,
          marks: [],
        });
      }
    }
  }

  return { children, markDefs };
}

// Convert markdown text to Sanity Portable Text blocks
export function textToBlocks(text: string) {
  const lines = text.split('\n');
  const blocks: any[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let style = 'normal';
    let content = trimmed;
    let listItem: string | undefined;

    if (trimmed.startsWith('#### ')) {
      style = 'h4';
      content = trimmed.slice(5);
    } else if (trimmed.startsWith('### ')) {
      style = 'h3';
      content = trimmed.slice(4);
    } else if (trimmed.startsWith('## ')) {
      style = 'h2';
      content = trimmed.slice(3);
    } else if (trimmed.startsWith('# ')) {
      style = 'h2';
      content = trimmed.slice(2);
    }

    if (content.startsWith('- ') || content.startsWith('* ')) {
      listItem = 'bullet';
      content = content.slice(2);
    }

    const { children, markDefs } = parseInline(content);

    if (children.length > 0) {
      const block: any = {
        _type: 'block',
        _key: blockKey(),
        style,
        children,
        markDefs,
      };
      if (listItem) {
        block.listItem = listItem;
        block.level = 1;
      }
      blocks.push(block);
    }
  }

  return blocks;
}

// Convert Sanity Portable Text blocks back to markdown
export function portableTextToMarkdown(blocks: any[]): string {
  if (!blocks || !Array.isArray(blocks)) return '';

  const lines: string[] = [];

  for (const block of blocks) {
    if (block._type !== 'block') {
      // Skip non-block types (images, embeds, etc.)
      continue;
    }

    const style = block.style || 'normal';
    const markDefs: Record<string, any> = {};
    if (block.markDefs) {
      for (const def of block.markDefs) {
        markDefs[def._key] = def;
      }
    }

    // Convert children spans to inline markdown
    let text = '';
    if (block.children) {
      for (const child of block.children) {
        if (child._type !== 'span') continue;
        let spanText = child.text || '';

        // Apply marks
        const marks: string[] = child.marks || [];
        let hasStrong = false;
        let hasEm = false;
        let linkHref = '';

        for (const mark of marks) {
          if (mark === 'strong') hasStrong = true;
          else if (mark === 'em') hasEm = true;
          else if (markDefs[mark]?.href) linkHref = markDefs[mark].href;
        }

        if (linkHref) {
          spanText = `[${spanText}](${linkHref})`;
        }
        if (hasStrong) spanText = `**${spanText}**`;
        if (hasEm) spanText = `*${spanText}*`;

        text += spanText;
      }
    }

    // Apply block-level styles
    let prefix = '';
    if (style === 'h2') prefix = '## ';
    else if (style === 'h3') prefix = '### ';
    else if (style === 'h4') prefix = '#### ';

    if (block.listItem === 'bullet') prefix = '- ';

    lines.push(prefix + text);
    // Add blank line after non-list blocks for readability
    if (!block.listItem) lines.push('');
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
