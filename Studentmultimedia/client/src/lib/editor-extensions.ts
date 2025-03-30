import { StarterKit } from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

export const extensions = [
  StarterKit,
  Underline,
  Link.configure({
    openOnClick: false,
    validate: href => /^https?:\/\//.test(href),
  }),
  Image.configure({
    allowBase64: true,
    inline: true,
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  Youtube.configure({
    width: 640,
    height: 480,
    controls: true,
  }),
  Placeholder.configure({
    placeholder: 'Escribe el contenido de tu entrada aquí...',
  }),
  Table.configure({
    resizable: true,
  }),
  TableRow,
  TableCell,
  TableHeader,
];
