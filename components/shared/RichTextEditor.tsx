// src/components/shared/RichTextEditor.tsx
import React, { useMemo, useState, useCallback } from 'react';
import { Slate, Editable, withReact } from 'slate-react';
import { createEditor, Descendant } from 'slate';
import { withHistory } from 'slate-history';
import { CustomElement } from '@/lib/slate';

const initialValue: CustomElement[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const [editorValue, setEditorValue] = useState<Descendant[]>(() => {
    try {
      return value ? JSON.parse(value) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  const handleChange = useCallback(
    (newValue: Descendant[]) => {
      setEditorValue(newValue);
      const stringifiedValue = JSON.stringify(newValue);
      onChange(stringifiedValue);
    },
    [onChange]
  );

  return (
    <Slate editor={editor} initialValue={editorValue} onChange={handleChange}>
      <Editable placeholder="Enter some notes..." />
    </Slate>
  );
};

export default RichTextEditor;
