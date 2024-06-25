// src/types/slate.d.ts
import { BaseEditor } from 'slate';
import { ReactEditor } from 'slate-react';
import { HistoryEditor } from 'slate-history';

type CustomText = { text: string };

type ParagraphElement = {
  type: 'paragraph';
  children: CustomText[];
};

type CustomElement = ParagraphElement;

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}
