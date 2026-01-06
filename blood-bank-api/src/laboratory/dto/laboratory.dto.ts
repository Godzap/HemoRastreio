import { IsString, IsOptional, IsBoolean, IsEmail, MaxLength, IsObject } from 'class-validator';

export class CreateLaboratoryDto {
    @IsString()
    @MaxLength(255)
    name: string;

    @IsString()
    @MaxLength(50)
    code: string;

    @IsString()
    @IsOptional()
    organizationId?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    @MaxLength(50)
    phone?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    licenseNumber?: string;

    @IsString()
    @IsOptional()
    timezone?: string;

    @IsObject()
    @IsOptional()
    settings?: Record<string, unknown>;
}

export class UpdateLaboratoryDto {
    @IsString()
    @IsOptional()
    @MaxLength(255)
    name?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    @MaxLength(50)
    phone?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    licenseNumber?: string;

    @IsString()
    @IsOptional()
    timezone?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsObject()
    @IsOptional()
    settings?: Record<string, unknown>;
}
