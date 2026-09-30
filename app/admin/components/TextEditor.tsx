'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

interface TextEditorProps {
  defaultValue?: string;
}

export default function TextEditor({ defaultValue = '' }: TextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [content, setContent] = useState(defaultValue);
  const [isUploading, setIsUploading] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  // Auto-resize textarea theo nội dung
  const autoResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const newHeight = Math.max(500, textarea.scrollHeight);
    textarea.style.height = `${newHeight}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [content, activeTab, autoResize]);

  // Hàm hỗ trợ chèn thẻ định dạng vào đoạn văn bản đang được bôi đen
  const insertFormat = (startTag: string, endTag: string = '', placeholder: string = 'Văn bản') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const replacement = `${startTag}${selectedText || placeholder}${endTag}`;

    textarea.setRangeText(replacement, start, end, 'select');
    const newValue = textarea.value;
    setContent(newValue);
    textarea.focus();
  };

  // Chèn text tại vị trí con trỏ (không wrap selection)
  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    textarea.setRangeText(text, start, end, 'end');
    const newValue = textarea.value;
    setContent(newValue);
    textarea.focus();
  };

  // Upload ảnh lên server
  const handleFileUpload = async (file: File) => {
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

      // Chèn thẻ <img> vào nội dung
      insertAtCursor(`\n<img src="${data.url}" alt="Ảnh bài viết" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;" />\n`);
    } catch {
      alert('Đã xảy ra lỗi khi upload ảnh.');
    } finally {
      setIsUploading(false);
    }
  };

  // Chèn ảnh bằng URL
  const handleInsertImageUrl = () => {
    if (!imageUrl.trim()) return;
    insertAtCursor(`\n<img src="${imageUrl.trim()}" alt="Ảnh bài viết" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;" />\n`);
    setImageUrl('');
    setShowImageDialog(false);
  };

  // Toolbar button component
  const ToolbarButton = ({ onClick, title, children, className = '' }: {
    onClick: () => void;
    title: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors text-sm ${className}`}
      title={title}
    >
      {children}
    </button>
  );

  // Divider
  const ToolbarDivider = () => (
    <div className="w-px h-6 bg-gray-300 mx-1" />
  );

  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Thanh Tab: Viết / Xem trước */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => setActiveTab('write')}
          className={`px-5 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'write'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ✏️ Viết
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`px-5 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'preview'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          👁 Xem trước
        </button>
      </div>

      {activeTab === 'write' ? (
        <>
          {/* Thanh công cụ Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-gray-50 border-b border-gray-200">
            {/* Nhóm: Heading */}
            <ToolbarButton
              onClick={() => insertFormat('<h1>', '</h1>', 'Tiêu đề')}
              title="Tiêu đề H1"
              className="font-bold text-base"
            >
              H1
            </ToolbarButton>
            <ToolbarButton
              onClick={() => insertFormat('<h2>', '</h2>', 'Tiêu đề')}
              title="Tiêu đề H2"
              className="font-bold"
            >
              H2
            </ToolbarButton>
            <ToolbarButton
              onClick={() => insertFormat('<h3>', '</h3>', 'Tiêu đề')}
              title="Tiêu đề H3"
              className="font-semibold text-sm"
            >
              H3
            </ToolbarButton>

            <ToolbarDivider />

            {/* Nhóm: Định dạng chữ */}
            <ToolbarButton
              onClick={() => insertFormat('<b>', '</b>')}
              title="In đậm"
              className="font-bold"
            >
              B
            </ToolbarButton>
            <ToolbarButton
              onClick={() => insertFormat('<i>', '</i>')}
              title="In nghiêng"
              className="italic"
            >
              I
            </ToolbarButton>
            <ToolbarButton
              onClick={() => insertFormat('<u>', '</u>')}
              title="Gạch chân"
              className="underline"
            >
              U
            </ToolbarButton>

            <ToolbarDivider />

            {/* Nhóm: Kích thước chữ */}
            <ToolbarButton
              onClick={() => insertFormat('<span style="font-size: 20px;">', '</span>')}
              title="Chữ lớn"
            >
              A+
            </ToolbarButton>
            <ToolbarButton
              onClick={() => insertFormat('<span style="font-size: 13px;">', '</span>')}
              title="Chữ nhỏ"
            >
              A-
            </ToolbarButton>

            <ToolbarDivider />

            {/* Nhóm: Cấu trúc */}
            <ToolbarButton
              onClick={() => insertAtCursor('\n<ul>\n  <li>Mục 1</li>\n  <li>Mục 2</li>\n</ul>\n')}
              title="Danh sách không thứ tự"
            >
              • List
            </ToolbarButton>
            <ToolbarButton
              onClick={() => insertAtCursor('\n<ol>\n  <li>Mục 1</li>\n  <li>Mục 2</li>\n</ol>\n')}
              title="Danh sách có thứ tự"
            >
              1. List
            </ToolbarButton>
            <ToolbarButton
              onClick={() => insertFormat('<blockquote style="border-left: 3px solid #d1d5db; padding-left: 16px; color: #6b7280; margin: 12px 0;">', '</blockquote>', 'Trích dẫn')}
              title="Trích dẫn"
            >
              ❝ Quote
            </ToolbarButton>

            <ToolbarDivider />

            {/* Nhóm: Chèn */}
            <ToolbarButton
              onClick={() => {
                const url = prompt('Nhập URL liên kết:');
                if (url) insertFormat(`<a href="${url}" style="color: #2563eb; text-decoration: underline;">`, '</a>', 'Văn bản liên kết');
              }}
              title="Chèn liên kết"
            >
              🔗 Link
            </ToolbarButton>
            <ToolbarButton
              onClick={() => insertAtCursor('\n<hr style="border-top: 1px solid #e5e7eb; margin: 20px 0;" />\n')}
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

          {/* Ô nhập nội dung — tự co giãn, min 500px */}
          <textarea
            ref={textareaRef}
            id="content"
            name="content"
            required
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              autoResize();
            }}
            placeholder="Viết nội dung bài viết tại đây...

Sử dụng thanh công cụ phía trên để định dạng văn bản, chèn ảnh, danh sách, liên kết và nhiều hơn nữa."
            className="w-full p-5 focus:outline-none text-gray-900 leading-relaxed text-base resize-none"
            style={{ minHeight: '500px' }}
          />

          {/* Thanh trạng thái */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
            <span>{content.length} ký tự</span>
            <span>Hỗ trợ HTML • Chuyển tab &quot;Xem trước&quot; để kiểm tra kết quả</span>
          </div>
        </>
      ) : (
        /* Tab Xem trước */
        <div className="p-6" style={{ minHeight: '500px' }}>
          {content.trim() ? (
            <div
              className="prose max-w-none text-gray-800 leading-relaxed whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <p>Chưa có nội dung để xem trước. Hãy chuyển sang tab &quot;Viết&quot; để bắt đầu.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}