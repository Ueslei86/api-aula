const API_URL = '/api';

export interface User {
  id: number;
  email: string;
  name?: string | null;
}

export interface Post {
  id: number;
  title: string;
  content?: string | null;
  published: boolean;
  authorId: number;
  author?: {
    id: number;
    name?: string | null;
  };
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Erro na requisição');
  }
  return data as T;
}

// POST /register
export async function registerUser(email: string, name: string, password: string): Promise<User> {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, password }),
  });
  return handleResponse<User>(res);
}

// POST /login
export async function loginUser(email: string, password: string): Promise<{ token: string }> {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<{ token: string }>(res);
}

// GET /posts/all (pública - todos os posts)
export async function getAllPosts(): Promise<Post[]> {
  const res = await fetch(`${API_URL}/posts/all`);
  return handleResponse<Post[]>(res);
}

// GET /posts (autenticada - posts do usuário logado)
export async function getMyPosts(): Promise<Post[]> {
  const res = await fetch(`${API_URL}/posts`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Post[]>(res);
}

// POST /posts (autenticada - criar post)
export async function createPost(title: string, content: string): Promise<Post> {
  const res = await fetch(`${API_URL}/posts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ title, content }),
  });
  return handleResponse<Post>(res);
}

// PATCH /posts/:id (autenticada - editar post do dono)
export async function updatePost(
  id: number,
  data: { title?: string; content?: string; published?: boolean }
): Promise<Post> {
  const res = await fetch(`${API_URL}/posts/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Post>(res);
}

// DELETE /posts/:id (autenticada - deletar post do dono)
export async function deletePost(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/posts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse<{ message: string }>(res);
}