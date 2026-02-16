'use client';

import React, { useRef } from 'react';
import { Bold, Italic, Code, Link, List, ListOrdered, Quote, Heading2 } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export default function MarkdownEditor({ value, onChange, placeholder, rows = 6, className = '' }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertAtLineStart = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lines = value.split('\n');
    let currentPos = 0;
    let lineIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      if (currentPos + lines[i].length >= start) {
        lineIndex = i;
        break;
      }
      currentPos += lines[i].length + 1; // +1 for newline
    }

    lines[lineIndex] = prefix + lines[lineIndex];
    onChange(lines.join('\n'));

    setTimeout(() => {
      textarea.focus();
      const newPos = currentPos + prefix.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const toolbarButtons = [
    {
      icon: Bold,
      label: 'Bold',
      action: () => insertText('**', '**'),
    },
    {
      icon: Italic,
      label: 'Italic',
      action: () => insertText('*', '*'),
    },
    {
      icon: Code,
      label: 'Code',
      action: () => insertText('`', '`'),
    },
    {
      icon: Heading2,
      label: 'Heading',
      action: () => insertAtLineStart('## '),
    },
    {
      icon: Quote,
      label: 'Quote',
      action: () => insertAtLineStart('> '),
    },
    {
      icon: List,
      label: 'Bullet List',
      action: () => insertAtLineStart('- '),
    },
    {
      icon: ListOrdered,
      label: 'Numbered List',
      action: () => insertAtLineStart('1. '),
    },
    {
      icon: Link,
      label: 'Link',
      action: () => insertText('[', '](url)'),
    },
  ];

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-900/50 border border-gray-700 rounded-lg">
        {toolbarButtons.map((button, idx) => {
          const Icon = button.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={button.action}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
              title={button.label}
            >
              <Icon size={16} />
            </button>
          );
        })}
        <div className="ml-auto text-xs text-gray-500">
          Markdown ondersteund
        </div>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-green-500 resize-none font-mono ${className}`}
      />
    </div>
  );
}
