import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Upload, X, Image as ImageIcon, File as FileIcon, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const MARKDOWN_TEMPLATE = `# [Título do Post]

## Introdução
Escreva uma introdução engajante sobre o tema...

## Seção Principal
Desenvolva o conteúdo principal aqui. Você pode usar:
- **Negrito** para destaque
- *Itálico* para ênfase
- \`código\` para exemplos técnicos

## Conclusão
Resumo e pontos principais...

## Referências
- [Link para referência 1]
- [Link para referência 2]`;

interface UploadedFile {
  id: string;
  name: string;
  type: 'image' | 'file';
  size: number;
  url: string;
}

interface InsertedMedia {
  id: string;
  type: 'image' | 'file';
  name: string;
  url: string;
}

export default function CreatePost() {
  const [, setLocation] = useLocation();
  const [markdown, setMarkdown] = useState(MARKDOWN_TEMPLATE);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [insertedMedia, setInsertedMedia] = useState<InsertedMedia[]>([]);

  // Extract params from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const titleParam = params.get('title');
    const categoryParam = params.get('category');

    if (titleParam) {
      setTitle(decodeURIComponent(titleParam));
      setMarkdown(MARKDOWN_TEMPLATE.replace('[Título do Post]', titleParam));
    }

    if (categoryParam) {
      setCategory(decodeURIComponent(categoryParam));
    }
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const fileId = Math.random().toString(36).substr(2, 9);
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const newFile: UploadedFile = {
          id: fileId,
          name: file.name,
          type,
          size: file.size,
          url,
        };
        setUploadedFiles((prev) => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });
  };

  const insertMedia = (file: UploadedFile) => {
    const mediaId = Math.random().toString(36).substr(2, 9);
    setInsertedMedia((prev) => [...prev, {
      id: mediaId,
      type: file.type,
      name: file.name,
      url: file.url,
    }]);
  };

  const removeInsertedMedia = (id: string) => {
    setInsertedMedia((prev) => prev.filter((m) => m.id !== id));
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handlePublish = () => {
    console.log('Post publicado:', {
      title,
      category,
      markdown,
      media: insertedMedia,
    });
    alert('Post publicado com sucesso!');
    setLocation('/educativo');
  };

  return (
    <div className="min-h-screen bg-guarawatch-surface">
      <Navbar />

      <main className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setLocation('/educativo')}
            className="flex items-center gap-2 text-guarawatch-accent hover:text-guarawatch-primary transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
          <h1 className="font-display text-4xl font-bold text-guarawatch-primary mb-2">
            Criar Post
          </h1>
          {category && (
            <p className="text-guarawatch-muted">
              Categoria: <span className="font-semibold text-guarawatch-primary">{category}</span>
            </p>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Editor + Media */}
          <div className="lg:col-span-2 space-y-6">
            {/* Markdown Editor */}
            <div>
              <label className="block text-sm font-semibold text-guarawatch-primary mb-2">
                Editar Markdown
              </label>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="w-full h-80 p-4 border-2 border-guarawatch-accent rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-guarawatch-accent focus:ring-opacity-50 resize-none"
                placeholder="Escreva seu post em markdown..."
              />
            </div>

            {/* Inserted Media Gallery */}
            {insertedMedia.length > 0 && (
              <div className="bg-white rounded-lg p-6 border-2 border-guarawatch-secondary">
                <h3 className="font-semibold text-guarawatch-primary mb-4">
                  Mídia Inserida
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {insertedMedia.map((media) => (
                    <div key={media.id} className="relative group">
                      {media.type === 'image' ? (
                        <div className="w-full h-32 bg-guarawatch-bg rounded overflow-hidden">
                          <img
                            src={media.url}
                            alt={media.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-guarawatch-bg rounded flex items-center justify-center">
                          <FileIcon size={32} className="text-guarawatch-secondary" />
                        </div>
                      )}
                      <button
                        onClick={() => removeInsertedMedia(media.id)}
                        className="absolute top-1 right-1 bg-guarawatch-danger text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                      <p className="text-xs text-guarawatch-muted mt-1 truncate">{media.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Upload + Preview */}
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="bg-white rounded-lg p-6 border-2 border-guarawatch-accent border-dashed">
              <h3 className="font-semibold text-guarawatch-primary mb-4 flex items-center gap-2">
                <Upload size={18} />
                Upload
              </h3>

              {/* Image Upload */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-guarawatch-primary mb-2 block">
                  Imagens
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileUpload(e, 'image')}
                  className="w-full text-xs text-guarawatch-muted file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-guarawatch-accent file:text-guarawatch-primary file:font-semibold hover:file:opacity-90"
                />
              </div>

              {/* File Upload */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-guarawatch-primary mb-2 block">
                  Arquivos
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFileUpload(e, 'file')}
                  className="w-full text-xs text-guarawatch-muted file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-guarawatch-secondary file:text-white file:font-semibold hover:file:opacity-90"
                />
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs font-semibold text-guarawatch-primary mb-3">
                    Disponíveis ({uploadedFiles.length})
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 p-2 bg-guarawatch-bg rounded border border-gray-200"
                      >
                        {file.type === 'image' ? (
                          <ImageIcon size={14} className="text-guarawatch-accent flex-shrink-0" />
                        ) : (
                          <FileIcon size={14} className="text-guarawatch-secondary flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-guarawatch-primary truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-guarawatch-muted">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => insertMedia(file)}
                          className="px-2 py-1 text-xs bg-guarawatch-accent text-guarawatch-primary rounded font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="text-guarawatch-muted hover:text-guarawatch-danger transition-colors flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Preview Section */}
            <div>
              <label className="block text-sm font-semibold text-guarawatch-primary mb-2">
                Preview
              </label>
              <div className="h-96 p-4 border-2 border-guarawatch-secondary rounded-lg overflow-y-auto bg-white prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-bold text-guarawatch-primary mt-3 mb-2 border-b-2 border-guarawatch-accent pb-1">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl font-bold text-guarawatch-primary mt-3 mb-2">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-lg font-semibold text-guarawatch-primary mt-2 mb-1">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-guarawatch-text mb-2 leading-relaxed text-sm">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-2 text-guarawatch-text space-y-1 text-sm">
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => <li className="ml-2">{children}</li>,
                    code: ({ children }) => (
                      <code className="bg-guarawatch-bg text-guarawatch-accent px-1 py-0.5 rounded font-mono text-xs">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-guarawatch-bg p-3 rounded overflow-x-auto mb-2 border-l-4 border-guarawatch-accent text-xs">
                        {children}
                      </pre>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-guarawatch-accent pl-3 italic text-guarawatch-muted mb-2 text-sm">
                        {children}
                      </blockquote>
                    ),
                    a: ({ children, href }) => (
                      <a
                        href={href}
                        className="text-guarawatch-accent hover:text-guarawatch-primary underline text-sm"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {markdown}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <button
            onClick={() => setLocation('/educativo')}
            className="px-8 py-3 border-2 border-guarawatch-primary text-guarawatch-primary font-heading font-semibold rounded-lg hover:bg-guarawatch-bg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handlePublish}
            className="px-8 py-3 bg-guarawatch-accent text-guarawatch-primary font-heading font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Publicar Post
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
