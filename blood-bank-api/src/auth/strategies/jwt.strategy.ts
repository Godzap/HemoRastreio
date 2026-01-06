import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, AuthenticatedUser } from '../interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET')!,
        });
    }

    async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
        return {
            id: payload.sub,
            username: payload.username,
            email: payload.email,
            fullName: '', // Will be populated from DB if needed
            laboratoryId: payload.laboratoryId,
            isGlobalAdmin: payload.isGlobalAdmin,
            roles: payload.roles,
            permissions: payload.permissions,
        };
    }
}
