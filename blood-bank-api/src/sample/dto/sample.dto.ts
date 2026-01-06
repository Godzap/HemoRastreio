import { IsString, IsOptional, IsUUID, IsNumber, IsDateString, IsEnum, MaxLength, Min } from 'class-validator';
import { SampleStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';

export class CreateSampleDto {
    @IsString()
    @MaxLength(100)
    barcode: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    externalId?: string;

    @IsString()
    @MaxLength(100)
    patientCode: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    requestCode?: string;

    @IsUUID()
    sampleTypeId: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Type(() => Number)
    volumeMl?: number;

    @IsDateString()
    collectionDatetime: string;

    @IsUUID()
    @IsOptional()
    currentPositionId?: string;

    @IsDateString()
    @IsOptional()
    expirationDate?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateSampleDto {
    @IsString()
    @IsOptional()
    @MaxLength(100)
    externalId?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Type(() => Number)
    volumeMl?: number;

    @IsDateString()
    @IsOptional()
    expirationDate?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class MoveSampleDto {
    @IsUUID()
    toPositionId: string;

    @IsString()
    @IsOptional()
    @MaxLength(255)
    reason?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class ChangeStatusDto {
    @IsEnum(SampleStatus)
    status: SampleStatus;

    @IsString()
    @IsOptional()
    @MaxLength(255)
    reason?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class SampleQueryDto {
    @IsString()
    @IsOptional()
    search?: string;

    @IsEnum(SampleStatus)
    @IsOptional()
    status?: SampleStatus;

    @IsUUID()
    @IsOptional()
    sampleTypeId?: string;

    @IsDateString()
    @IsOptional()
    collectionDateFrom?: string;

    @IsDateString()
    @IsOptional()
    collectionDateTo?: string;

    @IsNumber()
    @IsOptional()
    @Min(1)
    @Type(() => Number)
    @Transform(({ value }) => parseInt(value, 10))
    page?: number = 1;

    @IsNumber()
    @IsOptional()
    @Min(1)
    @Type(() => Number)
    @Transform(({ value }) => parseInt(value, 10))
    limit?: number = 20;
}
