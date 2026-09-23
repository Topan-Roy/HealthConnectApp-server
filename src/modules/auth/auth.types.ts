export interface TokenPayload {
  userId: string;
  role: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    isVerified: boolean;
    isActive: boolean;
  };
  accessToken: string;
}
