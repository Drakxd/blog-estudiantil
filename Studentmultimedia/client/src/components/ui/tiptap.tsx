import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent, BubbleMenu, Editor } from '@tiptap/react';
import { extensions } from '@/lib/editor-extensions';
import { cn } from '@/lib/utils';
import {
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  List, 
  ListOrdered, 
  Quote, 
  Heading1, 
  Heading2, 
  Heading3, 
  Youtube as YoutubeIcon,
  Table as TableIcon
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TipTapProps {
  content: string;
  onChange: (html: string) => void;
  className?: string;
  placeholder?: string;
}

export function TipTap({ content, onChange, className, placeholder = 'Escribe el contenido de tu entrada aquí...' }: TipTapProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageUpload, setImageUpload] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const editor = useEditor({
    extensions,
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert focus:outline-none p-4 min-h-[300px]',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Handle link insertion
  const setLink = useCallback(() => {
    if (!linkUrl) return;
    
    // Check if the URL has a protocol, if not, add http://
    const url = linkUrl.trim();
    const formattedUrl = url.startsWith('http') ? url : `http://${url}`;
    
    editor?.chain().focus().extendMarkRange('link').setLink({ href: formattedUrl }).run();
    setLinkUrl('');
  }, [editor, linkUrl]);

  // Handle image insertion
  const addImage = useCallback(() => {
    if (imageUrl) {
      editor?.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
    }
  }, [editor, imageUrl]);

  // Handle image upload
  const handleImageUpload = useCallback(async () => {
    if (!imageUpload) return;
    
    try {
      const formData = new FormData();
      formData.append('file', imageUpload);
      
      const response = await fetch('/api/admin/media', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      editor?.chain().focus().setImage({ src: data.path }).run();
      setImageUpload(null);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  }, [editor, imageUpload]);

  // Handle YouTube embed
  const addYoutubeVideo = useCallback(() => {
    if (!youtubeUrl) return;
    
    const url = youtubeUrl.trim();
    editor?.chain().focus().setYoutubeVideo({ src: url }).run();
    setYoutubeUrl('');
  }, [editor, youtubeUrl]);

  // Handle table insertion
  const insertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn('border border-input rounded-md overflow-hidden', className)}>
      <div className="flex flex-wrap items-center border-b border-input bg-muted/50 px-2 py-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-muted' : ''}
          title="Negrita (Ctrl+B)"
          type="button"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-muted' : ''}
          title="Cursiva (Ctrl+I)"
          type="button"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'bg-muted' : ''}
          title="Subrayado (Ctrl+U)"
          type="button"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'bg-muted' : ''}
          title="Tachado"
          type="button"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        
        <div className="mx-1 h-4 border-l border-gray-300" />
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className={editor.isActive('link') ? 'bg-muted' : ''} title="Enlace" type="button">
              <LinkIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="flex flex-col gap-2">
              <Label htmlFor="link-url">URL del enlace</Label>
              <div className="flex gap-2">
                <Input 
                  id="link-url"
                  placeholder="https://example.com" 
                  value={linkUrl} 
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setLink()}
                />
                <Button size="sm" onClick={setLink} type="button">Insertar</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" title="Imagen" type="button">
              <ImageIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <Tabs defaultValue="url">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="upload">Subir</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="flex flex-col gap-2">
                <Label htmlFor="image-url">URL de la imagen</Label>
                <div className="flex gap-2">
                  <Input 
                    id="image-url"
                    placeholder="https://example.com/image.jpg" 
                    value={imageUrl} 
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addImage()}
                  />
                  <Button size="sm" onClick={addImage} type="button">Insertar</Button>
                </div>
              </TabsContent>
              <TabsContent value="upload" className="flex flex-col gap-2">
                <Label htmlFor="image-upload">Subir imagen</Label>
                <Input 
                  id="image-upload"
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setImageUpload(e.target.files?.[0] || null)}
                />
                <Button size="sm" onClick={handleImageUpload} disabled={!imageUpload} type="button">
                  Subir e insertar
                </Button>
              </TabsContent>
            </Tabs>
          </PopoverContent>
        </Popover>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" title="YouTube" type="button">
              <YoutubeIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="flex flex-col gap-2">
              <Label htmlFor="youtube-url">URL del video de YouTube</Label>
              <div className="flex gap-2">
                <Input 
                  id="youtube-url"
                  placeholder="https://youtube.com/watch?v=..." 
                  value={youtubeUrl} 
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addYoutubeVideo()}
                />
                <Button size="sm" onClick={addYoutubeVideo} type="button">Insertar</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" title="Tabla" type="button">
              <TableIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60">
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">Insertar tabla</h3>
              <p className="text-xs text-muted-foreground">Se insertará una tabla 3x3 con fila de encabezado</p>
              <Button size="sm" onClick={insertTable} type="button">Insertar tabla</Button>
            </div>
          </PopoverContent>
        </Popover>
        
        <div className="mx-1 h-4 border-l border-gray-300" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? 'bg-muted' : ''}
          title="Alinear a la izquierda"
          type="button"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? 'bg-muted' : ''}
          title="Centrar"
          type="button"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? 'bg-muted' : ''}
          title="Alinear a la derecha"
          type="button"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        
        <div className="mx-1 h-4 border-l border-gray-300" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-muted' : ''}
          title="Lista con viñetas"
          type="button"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-muted' : ''}
          title="Lista numerada"
          type="button"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-muted' : ''}
          title="Cita"
          type="button"
        >
          <Quote className="h-4 w-4" />
        </Button>
        
        <div className="mx-1 h-4 border-l border-gray-300" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
          title="Encabezado 1"
          type="button"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
          title="Encabezado 2"
          type="button"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}
          title="Encabezado 3"
          type="button"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
      </div>
      
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="flex items-center rounded-md border border-border bg-background shadow-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'bg-muted' : ''}
              type="button"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'bg-muted' : ''}
              type="button"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={editor.isActive('underline') ? 'bg-muted' : ''}
              type="button"
            >
              <Underline className="h-4 w-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className={editor.isActive('link') ? 'bg-muted' : ''} type="button">
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bubble-link-url">URL del enlace</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="bubble-link-url"
                      placeholder="https://example.com" 
                      value={linkUrl} 
                      onChange={(e) => setLinkUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && setLink()}
                    />
                    <Button size="sm" onClick={setLink} type="button">Insertar</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </BubbleMenu>
      )}
      
      <EditorContent editor={editor} className="min-h-[300px]" />
    </div>
  );
}
