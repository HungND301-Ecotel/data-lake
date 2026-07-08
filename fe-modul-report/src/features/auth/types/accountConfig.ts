export interface UserPushResponse {
  id: string;
  username: string;
  password: string;
  bukrs?: string;
}

export interface UserPushRequest {
  username: string;
  password?: string | null;
  bukrs?: string;
}