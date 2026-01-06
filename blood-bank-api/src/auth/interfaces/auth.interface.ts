export interface JwtPayload {
    sub: string; // User ID
    username: string;
    email: string;
    laboratoryId: string | null;
    isGlobalAdmin: boolean;
    roles: string[];
    permissions: string[];
    iat?: number;
    exp?: number;
}

export interface AuthenticatedUser {
    id: string;
    username: string;
    email: string;
    fullName: string;
    laboratoryId: string | null;
    isGlobalAdmin: boolean;
    roles: string[];
    permissions: string[];
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface LoginResponse {
    user: AuthenticatedUser;
    tokens: TokenPair;
}
