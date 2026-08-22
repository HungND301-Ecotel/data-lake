import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  role: string | null;
  /** Mã vai trò từ module M01; rỗng với token cũ chỉ có `role`. */
  roles: string[];
  /** Mã quyền hạt nhỏ, dùng để ẩn/hiện chức năng trên giao diện. */
  permissions: string[];
  orgCode: string | null;
  clearanceLevel: number | null;

  setRole: (role: string) => void;
  setAccess: (access: {
    role?: string | null;
    roles?: string[];
    permissions?: string[];
    orgCode?: string | null;
    clearanceLevel?: number | null;
  }) => void;
  clearRole: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role: null,
      roles: [],
      permissions: [],
      orgCode: null,
      clearanceLevel: null,

      setRole: (role) => set({ role }),

      setAccess: (access) =>
        set({
          role: access.role ?? null,
          roles: access.roles ?? [],
          permissions: access.permissions ?? [],
          orgCode: access.orgCode ?? null,
          clearanceLevel: access.clearanceLevel ?? null,
        }),

      clearRole: () =>
        set({
          role: null,
          roles: [],
          permissions: [],
          orgCode: null,
          clearanceLevel: null,
        }),
    }),
    {
      name: "auth-storage",
    }
  )
);

/**
 * Kiểm tra quyền để ẩn chức năng trên giao diện.
 *
 * <p>Đây chỉ là lớp trải nghiệm người dùng. Quyết định thật luôn do backend và
 * worker thực thi; giao diện không được coi là ranh giới bảo mật.
 */
export function useHasPermission(permission: string): boolean {
  return useAuthStore((state) => state.permissions.includes(permission));
}

export function hasPermission(permission: string): boolean {
  return useAuthStore.getState().permissions.includes(permission);
}
