/** User identity attached by the auth middleware. */
export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

export interface ApiContext {
  user: AuthUser;
}
