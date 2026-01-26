export interface UserPushResponse {
  id: string;
  username: string;
  passname: string;
}

export interface UserPushRequest {
  username: string;
  password: string;
}