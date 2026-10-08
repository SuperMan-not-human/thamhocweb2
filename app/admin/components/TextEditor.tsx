'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

interface TextEditorProps {
  defaultValue?: string;
}

export default function TextEditor({ defaultValue = '' }: TextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState(defaultValue);
  const [isUploading, setIsUploading] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        }
      }),
      Placeholder.configure({
        placeholder: 'Viết nội dung bài viết tại đây...',
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: defaultValue,
    editorProps: {
      attributes: {
        class: 'w-full p-5 focus:outline-none text-gray-900 leading-relaxed text-base prose max-w-none min-h-[500px]',
      },
    },
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
  });

  // Chèn ảnh bằng URL
  const handleInsertImageUrl = () => {
    if (!imageUrl.trim() || !editor) return;
    editor.chain().focus().setImage({ src: imageUrl.trim(), alt: 'Ảnh bài viết' }).run();
    setImageUrl('');
    setShowImageDialog(false);
  };

  // Upload ảnh lên server
  const handleFileUpload = async (file: File) => {
    if (!editor) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Upload thất bại');
        return;
      }

      // Chèn ảnh đã upload vào Tiptap
      editor.chain().focus().setImage({ src: data.url, alt: 'Ảnh bài viết' }).run();
      setShowImageDialog(false);
    } catch {
      alert('Đã xảy ra lỗi khi upload ảnh.');
    } finally {
      setIsUploading(false);
    }
  };

  // Toolbar button component
  const ToolbarButton = ({ onClick, title, children, className = '', isActive = false }: {
    onClick: () => void;
    title: string;
    children: React.ReactNode;
    className?: string;
    isActive?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1.5 border rounded-md transition-colors text-sm ${
        isActive 
          ? 'bg-blue-100 border-blue-400 text-blue-700' 
          : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400'
      } ${className}`}
      title={title}
    >
      {children}
    </button>
  );

  // Divider
  const ToolbarDivider = () => (
    <div className="w-px h-6 bg-gray-300 mx-1" />
  );

  if (!editor) {
    return null; // Tránh render lỗi trước khi hydration
  }

  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Input ẩn để submit form */}
      <input type="hidden" name="content" value={content} />

      {/* Thanh công cụ Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-gray-50 border-b border-gray-200">
        {/* Nhóm: Heading */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Tiêu đề H1"
          className="font-bold text-base"
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Tiêu đề H2"
          className="font-bold"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Tiêu đề H3"
          className="font-semibold text-sm"
        >
          H3
        </ToolbarButton>

        <ToolbarDivider />

        {/* Nhóm: Định dạng chữ */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="In đậm"
          className="font-bold"
        >
          B
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="In nghiêng"
          className="italic"
        >
          I
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Gạch ngang"
          className="line-through"
        >
          S
        </ToolbarButton>

        <ToolbarDivider />

        {/* Nhóm: Cấu trúc */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Danh sách không thứ tự"
        >
          • List
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Danh sách có thứ tự"
        >
          1. List
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Trích dẫn"
        >
          ❝ Quote
        </ToolbarButton>

        <ToolbarDivider />

        {/* Nhóm: Chèn */}
        <ToolbarButton
          onClick={() => {
            const previousUrl = editor.getAttributes('link').href;
            const url = window.prompt('Nhập URL liên kết:', previousUrl);
            
            // cancelled
            if (url === null) return;
            
            // empty
            if (url === '') {
              editor.chain().focus().extendMarkRange('link').unsetLink().run();
              return;
            }

            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
          }}
          isActive={editor.isActive('link')}
          title="Chèn liên kết"
        >
          🔗 Link
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Đường kẻ ngang"
        >
          ── HR
        </ToolbarButton>

        <ToolbarDivider />

        {/* Nút chèn ảnh */}
        <ToolbarButton
          onClick={() => setShowImageDialog(!showImageDialog)}
          title="Chèn ảnh"
          className="text-green-700 font-medium"
        >
          🖼 Ảnh
        </ToolbarButton>
      </div>

      {/* Dialog chèn ảnh */}
      {showImageDialog && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-gray-700">Chèn ảnh vào bài viết:</p>

            {/* Upload từ máy */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? '⏳ Đang upload...' : '📁 Chọn ảnh từ máy'}
              </button>
              <span className="text-xs text-gray-500">JPG, PNG, GIF, WebP — tối đa 5MB</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                  e.target.value = '';
                }}
              />
            </div>

            {/* Hoặc dùng URL */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">hoặc</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Dán URL ảnh vào đây..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleInsertImageUrl();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleInsertImageUrl}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
              >
                Chèn URL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WYSIWYG Editor */}
      <EditorContent editor={editor} />
      
      <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 16px 0;
        }
      `}</style>
    </div>
  );
}