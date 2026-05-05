export type UserRole = 'journalist' | 'editor';
export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    siteId: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    siteId: string | null;
}
export interface JWTPayload {
    userId: string;
    role: UserRole;
    siteId: string | null;
    iat: number;
    exp: number;
}
//# sourceMappingURL=user.d.ts.map