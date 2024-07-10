"use client"

import React from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Color from '@tiptap/extension-color';
import ListItem from '@tiptap/extension-list-item';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Blockquote from '@tiptap/extension-blockquote';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import HardBreak from '@tiptap/extension-hard-break';
import Heading from '@tiptap/extension-heading';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBold, faItalic, faStrikethrough, faCode, faParagraph, faHeading, faListUl, faListOl, faQuoteRight, faUndo, faRedo, faTint, faMinus } from '@fortawesome/free-solid-svg-icons';

interface MenuBarProps {
  editor: Editor;
}

const MenuBar: React.FC<MenuBarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-2 mb-2">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 border border-gray-300 rounded ${editor.isActive('bold') ? 'bg-gray-200' : ''} w-24`}
        >
          <FontAwesomeIcon icon={faBold} /> Bold
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 border border-gray-300 rounded ${editor.isActive('italic') ? 'bg-gray-200' : ''} w-24`}
        >
          <FontAwesomeIcon icon={faItalic} /> Italic
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`p-2 border border-gray-300 rounded ${editor.isActive('strike') ? 'bg-gray-200' : ''} w-24`}
        >
          <FontAwesomeIcon icon={faStrikethrough} /> Strike
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          className={`p-2 border border-gray-300 rounded ${editor.isActive('code') ? 'bg-gray-200' : ''} w-24`}
        >
          <FontAwesomeIcon icon={faCode} /> Code
        </button>
        <button onClick={() => editor.chain().focus().unsetAllMarks().run()} className="p-2 border border-gray-300 rounded w-24">
          Clear marks
        </button>
        <button onClick={() => editor.chain().focus().clearNodes().run()} className="p-2 border border-gray-300 rounded w-24">
          Clear nodes
        </button>
        <button
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`p-2 border border-gray-300 rounded ${editor.isActive('paragraph') ? 'bg-gray-200' : ''} w-24`}
        >
          <FontAwesomeIcon icon={faParagraph} /> Paragraph
        </button>
        {[1, 2, 3, 4, 5, 6].map(level => (
          <button
            key={level}
            onClick={() => editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run()}
            className={`p-2 border border-gray-300 rounded ${editor.isActive('heading', { level: level as 1 | 2 | 3 | 4 | 5 | 6 }) ? 'bg-gray-200' : ''} w-24`}
          >
            <FontAwesomeIcon icon={faHeading} /> H{level}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 border border-gray-300 rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : ''} w-24`}
        >
          <FontAwesomeIcon icon={faListUl} /> Bullet list
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 border border-gray-300 rounded ${editor.isActive('orderedList') ? 'bg-gray-200' : ''} w-24`}
        >
          <FontAwesomeIcon icon={faListOl} /> Ordered list
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 border border-gray-300 rounded ${editor.isActive('blockquote') ? 'bg-gray-200' : ''} w-24`}
        >
          <FontAwesomeIcon icon={faQuoteRight} /> Blockquote
        </button>
        <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className="p-2 border border-gray-300 rounded w-24">
          <FontAwesomeIcon icon={faMinus} /> Horizontal rule
        </button>
        <button onClick={() => editor.chain().focus().setHardBreak().run()} className="p-2 border border-gray-300 rounded w-24">
          Hard break
        </button>
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-2 border border-gray-300 rounded w-24"
        >
          <FontAwesomeIcon icon={faUndo} /> Undo
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-2 border border-gray-300 rounded w-24"
        >
          <FontAwesomeIcon icon={faRedo} /> Redo
        </button>
        <button
          onClick={() => editor.chain().focus().setColor('#958DF1').run()}
          className={`p-2 border border-gray-300 rounded ${editor.isActive('textStyle', { color: '#958DF1' }) ? 'bg-gray-200' : ''} w-24`}
        >
          <FontAwesomeIcon icon={faTint} /> Purple
        </button>
      </div>
    </div>
  );
};

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
      ListItem,
      BulletList,
      OrderedList,
      Blockquote,
      HorizontalRule,
      HardBreak,
      Heading,
    ],
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="border border-gray-300 p-2 rounded" />
    </div>
  );
};

export default Tiptap;
