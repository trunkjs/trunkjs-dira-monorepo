export interface User {
  id: string;
  name: string;
  role: 'admin' | 'user';
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface AuthToken {
  token: string;
  expiresAt: string;
}
