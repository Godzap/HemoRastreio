import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SampleService } from './sample.service';
import { CreateSampleDto, UpdateSampleDto, MoveSampleDto, ChangeStatusDto, SampleQueryDto } from './dto';
import { JwtAuthGuard, RolesGuard, Roles, Permissions, CurrentUser } from '../auth';
import type { AuthenticatedUser } from '../auth/interfaces';

@Controller('samples')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SampleController {
    constructor(private readonly sampleService: SampleService) { }

    @Get()
    async findAll(
        @CurrentUser() user: AuthenticatedUser,
        @Query() query: SampleQueryDto,
    ) {
        if (!user.laboratoryId && !user.isGlobalAdmin) {
            return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
        }
        return this.sampleService.findAll(user.laboratoryId!, query);
    }

    @Get('expiring')
    async getExpiringSoon(
        @CurrentUser() user: AuthenticatedUser,
        @Query('days') days?: string,
    ) {
        if (!user.laboratoryId) {
            return [];
        }
        return this.sampleService.getExpiringSoon(user.laboratoryId, days ? parseInt(days, 10) : 30);
    }

    @Get('barcode/:barcode')
    async findByBarcode(@Param('barcode') barcode: string) {
        return this.sampleService.findByBarcode(barcode);
    }

    @Get(':id')
    async findOne(
        @Param('id') id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.sampleService.findOne(id, user.laboratoryId!);
    }

    @Get(':id/history')
    async getHistory(
        @Param('id') id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.sampleService.getHistory(id, user.laboratoryId!);
    }

    @Post()
    @Roles('Laboratory Admin', 'Laboratory Technician')
    async create(
        @Body() dto: CreateSampleDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.sampleService.create(dto, user.laboratoryId!, user.id);
    }

    @Patch(':id')
    @Roles('Laboratory Admin', 'Laboratory Technician')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateSampleDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.sampleService.update(id, dto, user.laboratoryId!, user.id);
    }

    @Post(':id/move')
    @Roles('Laboratory Admin', 'Laboratory Technician')
    async move(
        @Param('id') id: string,
        @Body() dto: MoveSampleDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.sampleService.move(id, dto, user.laboratoryId!, user.id);
    }

    @Post(':id/status')
    @Roles('Laboratory Admin', 'Laboratory Technician')
    async changeStatus(
        @Param('id') id: string,
        @Body() dto: ChangeStatusDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.sampleService.changeStatus(id, dto, user.laboratoryId!, user.id);
    }

    @Delete(':id')
    @Roles('Laboratory Admin')
    async softDelete(
        @Param('id') id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        await this.sampleService.softDelete(id, user.laboratoryId!, user.id);
        return { message: 'Sample deleted successfully' };
    }
}
