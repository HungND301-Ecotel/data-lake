export interface DepartmentSimple {
    id: string;
    name: string;
}

export interface EmployeeResponse {
    id: string;
    name: string;
    departments: DepartmentSimple[];
    position: string;
    phone: string;
    email: string;
    address: string;
    gender: string;
    birthday: string;
    keyAvatar: string | null;
    role: string | null;
}

export interface EmployeeRequest {
    id?: string | null;
    name: string;
    email: string;
    phone: string;
    address: string;
    birthday: string;
    gender: string;
    position: string;
    departmentIds: string[]; 
    avatarFile?: File | null;
}

