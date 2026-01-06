import { IsString, IsOptional, IsUUID, IsNumber, IsBoolean, MaxLength, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// Storage Room DTOs
export class CreateStorageRoomDto {
    @IsString()
    @MaxLength(100)
    name: string;

    @IsString()
    @MaxLength(50)
    code: string;

    @IsString()
    @IsOptional()
    description?: string;
}

export class UpdateStorageRoomDto {
    @IsString()
    @IsOptional()
    @MaxLength(100)
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

// Freezer DTOs
export class CreateFreezerDto {
    @IsUUID()
    storageRoomId: string;

    @IsString()
    @MaxLength(100)
    name: string;

    @IsString()
    @MaxLength(50)
    code: string;

    @IsString()
    @IsOptional()
    @MaxLength(50)
    equipmentType?: string;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    targetTemperature?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    minTemperature?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    maxTemperature?: number;
}

export class UpdateFreezerDto {
    @IsString()
    @IsOptional()
    @MaxLength(100)
    name?: string;

    @IsString()
    @IsOptional()
    @MaxLength(50)
    equipmentType?: string;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    targetTemperature?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    minTemperature?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    maxTemperature?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

// Shelf DTOs
export class CreateShelfDto {
    @IsUUID()
    freezerId: string;

    @IsString()
    @MaxLength(100)
    name: string;

    @IsNumber()
    @Min(1)
    @Type(() => Number)
    positionNumber: number;
}

export class UpdateShelfDto {
    @IsString()
    @IsOptional()
    @MaxLength(100)
    name?: string;

    @IsNumber()
    @IsOptional()
    @Min(1)
    @Type(() => Number)
    positionNumber?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

// Box DTOs
export class CreateBoxDto {
    @IsUUID()
    shelfId: string;

    @IsString()
    @MaxLength(100)
    name: string;

    @IsString()
    @MaxLength(50)
    code: string;

    @IsString()
    @IsOptional()
    @MaxLength(50)
    boxType?: string;

    @IsNumber()
    @Min(1)
    @Max(20)
    @IsOptional()
    @Type(() => Number)
    rows?: number = 9;

    @IsNumber()
    @Min(1)
    @Max(20)
    @IsOptional()
    @Type(() => Number)
    columns?: number = 9;
}

export class UpdateBoxDto {
    @IsString()
    @IsOptional()
    @MaxLength(100)
    name?: string;

    @IsString()
    @IsOptional()
    @MaxLength(50)
    boxType?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

// Position DTOs
export class BlockPositionDto {
    @IsBoolean()
    isBlocked: boolean;
}
