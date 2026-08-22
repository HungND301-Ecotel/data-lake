export interface UserLogin {
    username: string;
    password: string;
  }
  
  export interface LoginResponse {
    role: string;
    token: string;
    refreshToken: string;

    /**
     * Các trường bổ sung của module M01. Client cũ bỏ qua được.
     * Khi mfaRequired = true thì token rỗng và chỉ có mfaToken.
     */
    mfaRequired?: boolean;
    mfaToken?: string | null;
    roles?: string[];
    permissions?: string[];
    orgCode?: string | null;
    clearanceLevel?: number | null;
    expiresIn?: number;
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