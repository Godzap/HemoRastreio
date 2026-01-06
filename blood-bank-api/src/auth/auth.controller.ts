import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, ChangePasswordDto } from './dto';
import { Public } from './decorators';
import { CurrentUser } from './decorators';
import { JwtAuthGuard } from './guards';
import type { LoginResponse, TokenPair, AuthenticatedUser } from './interfaces';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
        return this.authService.login(loginDto);
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto): Promise<TokenPair> {
        return this.authService.refreshTokens(refreshTokenDto.refreshToken);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    async logout(
        @CurrentUser('id') userId: string,
        @Body('refreshToken') refreshToken?: string,
    ): Promise<void> {
        await this.authService.logout(userId, refreshToken);
    }

    @UseGuards(JwtAuthGuard)
    @Post('password/change')
    @HttpCode(HttpStatus.NO_CONTENT)
    async changePassword(
        @CurrentUser('id') userId: string,
        @Body() changePasswordDto: ChangePasswordDto,
    ): Promise<void> {
        await this.authService.changePassword(userId, changePasswordDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('me')
    @HttpCode(HttpStatus.OK)
    async getCurrentUser(@CurrentUser() user: AuthenticatedUser): Promise<AuthenticatedUser> {
        return user;
    }
}
