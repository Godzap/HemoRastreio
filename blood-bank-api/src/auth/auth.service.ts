import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma';
import { LoginDto, ChangePasswordDto } from './dto';
import { JwtPayload, AuthenticatedUser, TokenPair, LoginResponse } from './interfaces';

@Injectable()
export class AuthService {
    private readonly maxLoginAttempts: number;
    private readonly lockoutDurationMinutes: number;
    private readonly bcryptSaltRounds: number;

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {
        this.maxLoginAttempts = this.configService.get<number>('MAX_LOGIN_ATTEMPTS', 5);
        this.lockoutDurationMinutes = this.configService.get<number>('LOCKOUT_DURATION_MINUTES', 30);
        this.bcryptSaltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 12);
    }

    async validateUser(username: string, password: string): Promise<AuthenticatedUser | null> {
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { username: username },
                    { email: username },
                ],
                deletedAt: null,
            },
            include: {
                userRoles: {
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    include: {
                                        permission: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            return null;
        }

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new UnauthorizedException('Account is locked. Please try again later.');
        }

        // Check if account is active
        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated. Please contact administrator.');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            // Increment failed login attempts
            const newAttempts = user.failedLoginAttempts + 1;
            const updateData: { failedLoginAttempts: number; lockedUntil?: Date } = {
                failedLoginAttempts: newAttempts,
            };

            // Lock account if max attempts reached
            if (newAttempts >= this.maxLoginAttempts) {
                updateData.lockedUntil = new Date(Date.now() + this.lockoutDurationMinutes * 60 * 1000);
            }

            await this.prisma.user.update({
                where: { id: user.id },
                data: updateData,
            });

            return null;
        }

        // Reset failed login attempts on successful login
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
                lastLoginAt: new Date(),
            },
        });

        // Extract roles and permissions
        const roles = user.userRoles.map(ur => ur.role.name);
        const permissions = [...new Set(
            user.userRoles.flatMap(ur =>
                ur.role.permissions.map(rp => rp.permission.code)
            )
        )];

        return {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            laboratoryId: user.laboratoryId,
            isGlobalAdmin: user.isGlobalAdmin,
            roles,
            permissions,
        };
    }

    async login(loginDto: LoginDto): Promise<LoginResponse> {
        const user = await this.validateUser(loginDto.username, loginDto.password);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const tokens = await this.generateTokens(user);

        // Create session record
        const tokenHash = await bcrypt.hash(tokens.refreshToken, 10);
        await this.prisma.userSession.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        // Log the login action
        await this.logAuditEvent(user.id, user.laboratoryId, 'user', user.id, 'login');

        return {
            user,
            tokens,
        };
    }

    async refreshTokens(refreshToken: string): Promise<TokenPair> {
        try {
            const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub, deletedAt: null },
                include: {
                    userRoles: {
                        include: {
                            role: {
                                include: {
                                    permissions: {
                                        include: {
                                            permission: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            if (!user || !user.isActive) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // Extract roles and permissions for new token
            const roles = user.userRoles.map(ur => ur.role.name);
            const permissions = [...new Set(
                user.userRoles.flatMap(ur =>
                    ur.role.permissions.map(rp => rp.permission.code)
                )
            )];

            const authenticatedUser: AuthenticatedUser = {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                laboratoryId: user.laboratoryId,
                isGlobalAdmin: user.isGlobalAdmin,
                roles,
                permissions,
            };

            return this.generateTokens(authenticatedUser);
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async logout(userId: string, refreshToken?: string): Promise<void> {
        if (refreshToken) {
            // Revoke specific session
            const sessions = await this.prisma.userSession.findMany({
                where: { userId, revokedAt: null },
            });

            for (const session of sessions) {
                const isMatch = await bcrypt.compare(refreshToken, session.tokenHash);
                if (isMatch) {
                    await this.prisma.userSession.update({
                        where: { id: session.id },
                        data: { revokedAt: new Date() },
                    });
                    break;
                }
            }
        } else {
            // Revoke all sessions
            await this.prisma.userSession.updateMany({
                where: { userId, revokedAt: null },
                data: { revokedAt: new Date() },
            });
        }
    }

    async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
            throw new BadRequestException('Current password is incorrect');
        }

        const newPasswordHash = await bcrypt.hash(dto.newPassword, this.bcryptSaltRounds);

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash: newPasswordHash,
                passwordChangedAt: new Date(),
            },
        });

        // Revoke all existing sessions for security
        await this.prisma.userSession.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });

        // Log password change
        await this.logAuditEvent(userId, user.laboratoryId, 'user', userId, 'password_change');
    }

    private async generateTokens(user: AuthenticatedUser): Promise<TokenPair> {
        const payload: JwtPayload = {
            sub: user.id,
            username: user.username,
            email: user.email,
            laboratoryId: user.laboratoryId,
            isGlobalAdmin: user.isGlobalAdmin,
            roles: user.roles,
            permissions: user.permissions,
        };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_SECRET'),
                expiresIn: this.configService.get<string>('JWT_EXPIRATION', '15m') as any,
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d') as any,
            }),
        ]);

        return {
            accessToken,
            refreshToken,
            expiresIn: 15 * 60, // 15 minutes in seconds
        };
    }

    private async logAuditEvent(
        userId: string | null,
        laboratoryId: string | null,
        entityType: string,
        entityId: string,
        action: string,
    ): Promise<void> {
        await this.prisma.auditLog.create({
            data: {
                id: uuidv4(),
                userId,
                laboratoryId,
                entityType,
                entityId,
                action,
                createdAt: new Date(),
            },
        });
    }
}
