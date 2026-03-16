export interface UserLogin {
    username: string;
    password: string;
  }
  
  export interface LoginResponse {
    role: string;
    token: string;
    refreshToken: string;
  }
export interface UserRequest {
    id?: string | null; 
    username: string;
    password?: string | null;  
    role: string;
    employeeId: string;
    status?: boolean | null;  
  }
  
  export interface UserResponse {
    id: string;
    username: string;
    role: string;
    status: boolean;
  }
  
  export interface ChangePasswordRequest {
    oldPassword: string;
    newPassword: string;
  }