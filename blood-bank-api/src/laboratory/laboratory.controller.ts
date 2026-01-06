import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { LaboratoryService } from './laboratory.service';
import { CreateLaboratoryDto, UpdateLaboratoryDto } from './dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth';
import type { AuthenticatedUser } from '../auth/interfaces';

@Controller('laboratories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LaboratoryController {
    constructor(private readonly laboratoryService: LaboratoryService) { }

    @Get()
    @Roles('Global Admin', 'Laboratory Admin')
    async findAll() {
        return this.laboratoryService.findAll();
    }

    @Get('current')
    async getCurrentLaboratory(@CurrentUser() user: AuthenticatedUser) {
        if (!user.laboratoryId) {
            return null;
        }
        return this.laboratoryService.findOne(user.laboratoryId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.laboratoryService.findOne(id);
    }

    @Get(':id/statistics')
    async getStatistics(@Param('id') id: string) {
        return this.laboratoryService.getStatistics(id);
    }

    @Post()
    @Roles('Global Admin')
    async create(@Body() dto: CreateLaboratoryDto) {
        return this.laboratoryService.create(dto);
    }

    @Patch(':id')
    @Roles('Global Admin', 'Laboratory Admin')
    async update(@Param('id') id: string, @Body() dto: UpdateLaboratoryDto) {
        return this.laboratoryService.update(id, dto);
    }

    @Delete(':id')
    @Roles('Global Admin')
    async deactivate(@Param('id') id: string) {
        return this.laboratoryService.deactivate(id);
    }
}
