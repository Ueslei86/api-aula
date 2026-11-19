import { useEffect, useState, FormEvent } from 'react';
import './App.css';
import {
  Post,
  registerUser,
  loginUser,
  getAllPosts,
  getMyPosts,
  createPost,
  updatePost,
  deletePost,
} from './services/api';

type Tab = 'all' | 'mine' | 'auth';

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [activeTab, setActiveTab] = useState<Tab>('all');

  // Listas de posts
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);

  // Feedback ao usuário
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Formulário Auth (Login / Cadastro)
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Formulário Criar Post
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  // Estado de Edição de Post
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  function clearMessages() {
    setError('');
    setSuccess('');
  }

  async function loadAllPosts() {
    try {
      const data = await getAllPosts();
      setAllPosts(data);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function loadMyPosts() {
    if (!token) return;
    try {
      const data = await getMyPosts();
      setMyPosts(data);
    } catch (err: any) {
      setError(err.message);
      if (err.message.toLowerCase().includes('token') || err.message.includes('401')) {
        handleLogout();
      }
    }
  }

  useEffect(() => {
    loadAllPosts();
  }, []);

  useEffect(() => {
    if (token) {
      loadMyPosts();
    } else {
      setMyPosts([]);
    }
  }, [token]);

  async function handleAuthSubmit(e: FormEvent) {
    e.preventDefault();
    clearMessages();
    try {
      if (isRegisterMode) {
        await registerUser(email, name, password);
        setSuccess('Cadastro realizado com sucesso! Faça login para continuar.');
        setIsRegisterMode(false);
        setPassword('');
      } else {
        const res = await loginUser(email, password);
        localStorage.setItem('token', res.token);
        setToken(res.token);
        setSuccess('Login realizado com sucesso!');
        setEmail('');
        setPassword('');
        setActiveTab('mine');
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    setToken(null);
    setActiveTab('all');
    clearMessages();
  }

  async function handleCreatePost(e: FormEvent) {
    e.preventDefault();
    clearMessages();
    if (!newTitle.trim()) {
      setError('O título é obrigatório.');
      return;
    }
    try {
      await createPost(newTitle, newContent);
      setNewTitle('');
      setNewContent('');
      setSuccess('Post criado com sucesso!');
      await Promise.all([loadMyPosts(), loadAllPosts()]);
    } catch (err: any) {
      setError(err.message);
    }
  }

  function startEditing(post: Post) {
    setEditingId(post.id);
    setEditTitle(post.title);
    setEditContent(post.content || '');
    clearMessages();
  }

  async function handleSaveEdit(id: number) {
    clearMessages();
    try {
      await updatePost(id, { title: editTitle, content: editContent });
      setEditingId(null);
      setSuccess('Post atualizado com sucesso!');
      await Promise.all([loadMyPosts(), loadAllPosts()]);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleTogglePublish(post: Post) {
    clearMessages();
    try {
      await updatePost(post.id, { published: !post.published });
      setSuccess(post.published ? 'Post marcado como rascunho.' : 'Post publicado!');
      await Promise.all([loadMyPosts(), loadAllPosts()]);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDeletePost(id: number) {
    clearMessages();
    try {
      const res = await deletePost(id);
      setSuccess(res.message);
      await Promise.all([loadMyPosts(), loadAllPosts()]);
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="container">
      <header>
        <h1>Blog API - Front-end</h1>
        <nav>
          <button
            className={`btn-secondary ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => { clearMessages(); setActiveTab('all'); loadAllPosts(); }}
          >
            Todos os Posts
          </button>

          {token ? (
            <>
              <button
                className={`btn-secondary ${activeTab === 'mine' ? 'active' : ''}`}
                onClick={() => { clearMessages(); setActiveTab('mine'); loadMyPosts(); }}
              >
                Meus Posts
              </button>
              <button className="btn-danger" onClick={handleLogout}>
                Sair
              </button>
            </>
          ) : (
            <button
              className={`btn-primary ${activeTab === 'auth' ? 'active' : ''}`}
              onClick={() => { clearMessages(); setActiveTab('auth'); }}
            >
              Entrar / Cadastrar
            </button>
          )}
        </nav>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* ABA: LOGIN / CADASTRO */}
      {activeTab === 'auth' && !token && (
        <div className="card">
          <h2>{isRegisterMode ? 'Criar Conta' : 'Acessar Conta'}</h2>
          <form onSubmit={handleAuthSubmit}>
            <div className="form-group">
              {isRegisterMode && (
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              )}
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn-primary">
                {isRegisterMode ? 'Cadastrar' : 'Entrar'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { clearMessages(); setIsRegisterMode(!isRegisterMode); }}
              >
                {isRegisterMode ? 'Já tenho conta (Login)' : 'Não tenho conta (Cadastrar)'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ABA: TODOS OS POSTS (GET /posts/all) */}
      {activeTab === 'all' && (
        <div className="card">
          <h2>Feed Geral ({allPosts.length})</h2>
          {allPosts.length === 0 ? (
            <p>Nenhum post encontrado.</p>
          ) : (
            allPosts.map((post) => (
              <div key={post.id} className="post-item">
                <div className="post-header">
                  <h3>{post.title}</h3>
                  <span className={`badge ${post.published ? 'badge-published' : 'badge-draft'}`}>
                    {post.published ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>
                <p className="post-meta">
                  Autor: {post.author?.name || `Usuário #${post.authorId}`}
                </p>
                <p>{post.content || 'Sem conteúdo.'}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* ABA: MEUS POSTS + CRIAR / EDITAR / DELETAR */}
      {activeTab === 'mine' && token && (
        <>
          <div className="card">
            <h2>Novo Post</h2>
            <form onSubmit={handleCreatePost}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Título do post"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
                <textarea
                  placeholder="Conteúdo do post..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary">
                Criar Post
              </button>
            </form>
          </div>

          <div className="card">
            <h2>Meus Posts ({myPosts.length})</h2>
            {myPosts.length === 0 ? (
              <p>Você ainda não criou nenhum post.</p>
            ) : (
              myPosts.map((post) => (
                <div key={post.id} className="post-item">
                  {editingId === post.id ? (
                    <div className="form-group">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                      />
                      <div className="post-actions">
                        <button className="btn-success" onClick={() => handleSaveEdit(post.id)}>
                          Salvar
                        </button>
                        <button className="btn-secondary" onClick={() => setEditingId(null)}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="post-header">
                        <h3>{post.title}</h3>
                        <span className={`badge ${post.published ? 'badge-published' : 'badge-draft'}`}>
                          {post.published ? 'Publicado' : 'Rascunho'}
                        </span>
                      </div>
                      <p>{post.content || 'Sem conteúdo.'}</p>
                      <div className="post-actions">
                        <button className="btn-warning" onClick={() => startEditing(post)}>
                          Editar
                        </button>
                        <button className="btn-secondary" onClick={() => handleTogglePublish(post)}>
                          {post.published ? 'Despublicar' : 'Publicar'}
                        </button>
                        <button className="btn-danger" onClick={() => handleDeletePost(post.id)}>
                          Excluir
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;