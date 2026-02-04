export interface UserPushResponse {
  id: string;
  username: string;
  password: string;
}

export interface UserPushRequest {
  username: string;
  password?: string | null;
}