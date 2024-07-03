import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Color from '@tiptap/extension-color';
import { MathfieldElement } from 'mathlive';

const Tiptap: React.FC<{ content: string; onUpdate: (content: string) => void }> = ({ content, onUpdate }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Highlight,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Color,
    ],
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

  const mathfieldRef = useRef<MathfieldElement>(null);

  useEffect(() => {
    if (mathfieldRef.current) {
      mathfieldRef.current.addEventListener('input', () => {
        console.log(mathfieldRef.current?.getValue()); // Do something with the LaTeX math expression
      });
    }
  }, []);

  if (!editor) {
    return null;
  }

  return (
    <div>
      <div className="flex flex-wrap space-x-1 mb-2">
        <div className="flex space-x-2 mb-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`border border-black bg-white rounded px-2 py-1 ${editor.isActive('bold') ? 'is-active' : ''}`}
          >
            Bold
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`border border-black bg-white rounded px-2 py-1 ${editor.isActive('italic') ? 'is-active' : ''}`}
          >
            Italic
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`border border-black bg-white rounded px-2 py-1 ${editor.isActive('underline') ? 'is-active' : ''}`}
          >
            Underline
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`border border-black bg-white rounded px-2 py-1 ${editor.isActive('highlight') ? 'is-active' : ''}`}
          >
            Highlight
          </button>
        </div>
        <div className="flex space-x-2 mb-2">
          <button
            onClick={() => editor.chain().focus().setColor('red').run()}
            className={`border border-black bg-white rounded px-2 py-1 ${editor.isActive('color', { color: 'red' }) ? 'is-active' : ''}`}
          >
            Red Text
          </button>
          <button
            onClick={() => editor.chain().focus().run()}
            className="border border-black bg-white rounded px-2 py-1"
          >
            Font Size 20
          </button>
        </div>
        <div className="flex space-x-2 mb-2">
          <button onClick={() => editor.chain().focus().run()} className="border border-black bg-white rounded px-2 py-1">
            Align Left
          </button>
          <button onClick={() => editor.chain().focus().run()} className="border border-black bg-white rounded px-2 py-1">
            Align Center
          </button>
          <button onClick={() => editor.chain().focus().run()} className="border border-black bg-white rounded px-2 py-1">
            Align Right
          </button>
          <button onClick={() => editor.chain().focus().run()} className="border border-black bg-white rounded px-2 py-1">
            Align Justify
          </button>
        </div>
        <div className="flex space-x-2 mb-2">
          <button
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            className="border border-black bg-white rounded px-2 py-1"
          >
            Insert Table
          </button>
        </div>
      </div>
      <EditorContent editor={editor} className="border border-gray-300 p-2 rounded" />
    </div>
  );
};

export default Tiptap;
