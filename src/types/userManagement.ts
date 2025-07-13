
export interface UserRole {
  user_id: string;
  role: string;
}

export interface ProfileUser {
  id: string;
  full_name: string | null;
  created_at: string;
  role: string | null;
  email?: string | null;
}

export interface ProfileData {
  id: string;
  full_name: string | null;
  created_at: string;
  role: string | null;
}

export interface AuthUser {
  id: string;
  email?: string;
}
