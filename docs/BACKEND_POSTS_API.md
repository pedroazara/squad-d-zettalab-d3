# Documentação de Integração - Sistema de Posts Educativos

## Resumo
Frontend já tem a interface pronta para criar, visualizar e gerenciar posts com markdown e mídia. Precisa implementar no backend:
- Banco de dados para armazenar posts
- API de upload de mídia
- Endpoints CRUD para posts

---

## 1. Estrutura de Banco de Dados

### Tabela: `posts`
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  conteudo TEXT NOT NULL, -- Markdown
  autor_id UUID NOT NULL REFERENCES usuarios(id),
  status VARCHAR(20) DEFAULT 'rascunho', -- rascunho, publicado, arquivado
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  publicado_em TIMESTAMP
);
```

### Tabela: `posts_midia`
```sql
CREATE TABLE posts_midia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL, -- 'image' ou 'file'
  nome_original VARCHAR(255) NOT NULL,
  caminho_arquivo VARCHAR(500) NOT NULL, -- URL ou path no storage
  tamanho_bytes INT,
  mime_type VARCHAR(50),
  criado_em TIMESTAMP DEFAULT NOW()
);
```

---

## 2. Endpoints Necessários

### A. POST `/api/posts` - Criar novo post
**Request:**
```json
{
  "titulo": "Prevenção de Incêndios Florestais",
  "categoria": "Prevenção de Incêndios",
  "conteudo": "# Título\n\n## Introdução\n...",
  "status": "rascunho"
}
```

**Response (201):**
```json
{
  "id": "uuid-aqui",
  "titulo": "Prevenção de Incêndios Florestais",
  "categoria": "Prevenção de Incêndios",
  "conteudo": "...",
  "autor_id": "uuid-do-user",
  "status": "rascunho",
  "criado_em": "2026-04-24T10:30:00Z"
}
```

---

### B. POST `/api/posts/:postId/midia` - Upload de mídia
**Request:** (multipart/form-data)
```
POST /api/posts/{post_id}/midia
Content-Type: multipart/form-data

Form Data:
- file: <arquivo binário>
- tipo: "image" | "file"
```

**Response (201):**
```json
{
  "id": "media-uuid",
  "post_id": "post-uuid",
  "tipo": "image",
  "nome_original": "foto.png",
  "caminho_arquivo": "/storage/posts/abc123.png",
  "tamanho_bytes": 245000,
  "mime_type": "image/png"
}
```

---

### C. GET `/api/posts` - Listar todos os posts
**Query Parameters:**
- `categoria` (opcional): filtrar por categoria
- `status` (opcional): "rascunho", "publicado", "arquivado"
- `page` (opcional, default=1): paginação
- `limit` (opcional, default=10): itens por página

**Response (200):**
```json
{
  "dados": [
    {
      "id": "uuid-1",
      "titulo": "Prevenção de Incêndios",
      "categoria": "Prevenção de Incêndios",
      "conteudo": "...",
      "status": "publicado",
      "autor_id": "uuid-user",
      "criado_em": "2026-04-24T10:30:00Z",
      "atualizado_em": "2026-04-24T10:30:00Z",
      "publicado_em": "2026-04-24T11:00:00Z",
      "midia": [
        {
          "id": "media-uuid-1",
          "tipo": "image",
          "nome_original": "imagem1.png",
          "caminho_arquivo": "/storage/posts/img1.png"
        }
      ]
    }
  ],
  "total": 45,
  "pagina": 1,
  "limite": 10
}
```

---

### D. GET `/api/posts/:postId` - Obter um post específico
**Response (200):**
```json
{
  "id": "uuid",
  "titulo": "...",
  "categoria": "...",
  "conteudo": "...",
  "status": "publicado",
  "autor_id": "uuid",
  "criado_em": "2026-04-24T10:30:00Z",
  "atualizado_em": "2026-04-24T10:30:00Z",
  "publicado_em": "2026-04-24T11:00:00Z",
  "midia": [
    {
      "id": "media-uuid-1",
      "tipo": "image",
      "nome_original": "imagem1.png",
      "caminho_arquivo": "/storage/posts/img1.png",
      "tamanho_bytes": 245000
    },
    {
      "id": "media-uuid-2",
      "tipo": "file",
      "nome_original": "documento.pdf",
      "caminho_arquivo": "/storage/posts/doc1.pdf",
      "tamanho_bytes": 512000
    }
  ]
}
```

---

### E. PATCH `/api/posts/:postId` - Atualizar post
**Request:**
```json
{
  "titulo": "Novo título (opcional)",
  "categoria": "Nova categoria (opcional)",
  "conteudo": "Novo markdown (opcional)",
  "status": "publicado" (opcional)
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "titulo": "...",
  "categoria": "...",
  "conteudo": "...",
  "status": "publicado",
  "atualizado_em": "2026-04-24T14:00:00Z",
  "publicado_em": "2026-04-24T14:00:00Z"
}
```

---

### F. DELETE `/api/posts/:postId` - Deletar post
**Response (204 No Content)**

*Nota: Deve deletar em cascade o posts_midia associado*

---

### G. DELETE `/api/posts/:postId/midia/:midiaId` - Remover uma mídia
**Response (204 No Content)**

---

## 3. Categorias Válidas
Frontend usa estas categorias (validar no backend):
- Prevenção de Incêndios
- Impacto Ambiental
- Biodiversidade em Risco
- Como Usar o Sistema
- Metodologia dos Dados

---

## 4. Autenticação
- Todos os endpoints (exceto GET) requerem autenticação
- Enviar token JWT no header: `Authorization: Bearer <token>`
- POST/PATCH/DELETE: validar que `autor_id` == `user_id` do token (ou admin)

---

## 5. Armazenamento de Mídia
**Opções:**
1. **Pasta local** (`/storage/posts/`)
   - Simples para dev
   - Não recomendado para produção

2. **AWS S3**
   - Recomendado
   - Retornar URL pública na resposta

3. **Firebase Storage / Google Cloud Storage**
   - Alternativa a S3

**Requisito:** Retornar URL pública/acessível da mídia no response

---

## 6. Validações Necessárias
- ✓ Título: obrigatório, max 255 caracteres
- ✓ Categoria: deve ser uma das 5 categorias válidas
- ✓ Conteúdo (markdown): obrigatório, min 10 caracteres
- ✓ Arquivo: max 10MB por arquivo
- ✓ Formatos permitidos:
  - Imagens: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
  - Arquivos: `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.txt`

---

## 7. Exemplo de Fluxo Frontend → Backend

```
1. User clica "Publicar Post"
   ↓
2. POST /api/posts
   { titulo, categoria, conteudo, status: "rascunho" }
   ← POST criado com ID
   ↓
3. User faz upload de imagens
   POST /api/posts/{postId}/midia
   ← Múltiplas requisições (uma por arquivo)
   ↓
4. User clica "Publicar"
   PATCH /api/posts/{postId}
   { status: "publicado" }
   ← Post publicado com timestamp
```

---

## 8. Observações
- O conteúdo é armazenado como **texto markdown puro** (sem HTML)
- Frontend renderiza o markdown usando `react-markdown`
- Mídia é referenciada por URL no storage (não inserida no markdown)
- O backend deve validar MIME types corretamente
- Implementar paginação em GET `/api/posts`

---

## Exemplo de Request/Response cURL

```bash
# 1. Criar post
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "titulo": "Biodiversidade em Risco",
    "categoria": "Biodiversidade em Risco",
    "conteudo": "# Biodiversidade\n\n## Ameaças\nQueimadas ameaçam...",
    "status": "rascunho"
  }'

# 2. Upload de imagem
curl -X POST http://localhost:3000/api/posts/{postId}/midia \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@imagem.png" \
  -F "tipo=image"

# 3. Publicar post
curl -X PATCH http://localhost:3000/api/posts/{postId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "status": "publicado"
  }'

# 4. Listar posts
curl -X GET "http://localhost:3000/api/posts?categoria=Biodiversidade%20em%20Risco&status=publicado" \
  -H "Authorization: Bearer TOKEN"
```

---

**Pronto!** Passe esse documento para o time de backend e eles terão tudo que precisam. 🚀
