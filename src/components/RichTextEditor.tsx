import React, { useRef, useCallback, useEffect, useState } from 'react';
import type { RichTextFormat, ToolbarAction } from '../types';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Type
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = "Start writing your note...",
  className = "",
  onFocus,
  onBlur
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [format, setFormat] = useState<RichTextFormat>({
    bold: false,
    italic: false,
    underline: false,
    fontSize: 16,
    alignment: 'left'
  });

  const executeCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handleToolbarAction = useCallback((action: ToolbarAction) => {
    switch (action.type) {
      case 'bold':
        executeCommand('bold');
        setFormat(prev => ({ ...prev, bold: !prev.bold }));
        break;
      case 'italic':
        executeCommand('italic');
        setFormat(prev => ({ ...prev, italic: !prev.italic }));
        break;
      case 'underline':
        executeCommand('underline');
        setFormat(prev => ({ ...prev, underline: !prev.underline }));
        break;
      case 'fontSize':
        if (action.value) {
          executeCommand('fontSize', action.value.toString());
          setFormat(prev => ({ ...prev, fontSize: Number(action.value) }));
        }
        break;
      case 'alignment':
        if (action.value) {
          const alignmentMap = {
            left: 'justifyLeft',
            center: 'justifyCenter',
            right: 'justifyRight'
          };
          executeCommand(alignmentMap[action.value as keyof typeof alignmentMap]);
          setFormat(prev => ({ ...prev, alignment: action.value as 'left' | 'center' | 'right' }));
        }
        break;
    }
  }, [executeCommand]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      onChange(newContent);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          handleToolbarAction({ type: 'bold' });
          break;
        case 'i':
          e.preventDefault();
          handleToolbarAction({ type: 'italic' });
          break;
        case 'u':
          e.preventDefault();
          handleToolbarAction({ type: 'underline' });
          break;
      }
    }
  }, [handleToolbarAction]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden bg-white ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-3 bg-gray-50 border-b border-gray-200">
        {/* Bold */}
        <button
          type="button"
          onClick={() => handleToolbarAction({ type: 'bold' })}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            format.bold ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold size={18} />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => handleToolbarAction({ type: 'italic' })}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            format.italic ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic size={18} />
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => handleToolbarAction({ type: 'underline' })}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            format.underline ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
          }`}
          title="Underline (Ctrl+U)"
        >
          <Underline size={18} />
        </button>

        <div className="h-6 w-px bg-gray-300 mx-1" />

        {/* Font Size */}
        <div className="flex items-center gap-1">
          <Type size={18} className="text-gray-600" />
          <select
            value={format.fontSize}
            onChange={(e) => handleToolbarAction({ type: 'fontSize', value: e.target.value })}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
          >
            <option value="12">12px</option>
            <option value="14">14px</option>
            <option value="16">16px</option>
            <option value="18">18px</option>
            <option value="20">20px</option>
            <option value="24">24px</option>
            <option value="32">32px</option>
          </select>
        </div>

        <div className="h-6 w-px bg-gray-300 mx-1" />

        {/* Alignment */}
        <button
          type="button"
          onClick={() => handleToolbarAction({ type: 'alignment', value: 'left' })}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            format.alignment === 'left' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
          }`}
          title="Align Left"
        >
          <AlignLeft size={18} />
        </button>

        <button
          type="button"
          onClick={() => handleToolbarAction({ type: 'alignment', value: 'center' })}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            format.alignment === 'center' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
          }`}
          title="Align Center"
        >
          <AlignCenter size={18} />
        </button>

        <button
          type="button"
          onClick={() => handleToolbarAction({ type: 'alignment', value: 'right' })}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            format.alignment === 'right' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
          }`}
          title="Align Right"
        >
          <AlignRight size={18} />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        className="p-4 min-h-[300px] focus:outline-none rich-text-editor"
        style={{ fontSize: `${format.fontSize}px` }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      <style>{`
        .rich-text-editor:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};
