import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { StorageService } from './storage.service';
import {
    CreateStorageRoomDto, UpdateStorageRoomDto,
    CreateFreezerDto, UpdateFreezerDto,
    CreateShelfDto, UpdateShelfDto,
    CreateBoxDto, UpdateBoxDto,
    BlockPositionDto,
} from './dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth';
import type { AuthenticatedUser } from '../auth/interfaces';

@Controller('storage')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StorageController {
    constructor(private readonly storageService: StorageService) { }

    // ==================== STORAGE HIERARCHY ====================

    @Get('hierarchy')
    async getHierarchy(@CurrentUser() user: AuthenticatedUser) {
        return this.storageService.getStorageHierarchy(user.laboratoryId!);
    }

    @Get('occupancy')
    async getOccupancy(@CurrentUser() user: AuthenticatedUser) {
        return this.storageService.getOccupancyStats(user.laboratoryId!);
    }

    // ==================== ROOMS ====================

    @Get('rooms')
    async findAllRooms(@CurrentUser() user: AuthenticatedUser) {
        return this.storageService.findAllRooms(user.laboratoryId!);
    }

    @Get('rooms/:id')
    async findRoom(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
        return this.storageService.findRoomById(id, user.laboratoryId!);
    }

    @Post('rooms')
    @Roles('Laboratory Admin')
    async createRoom(@Body() dto: CreateStorageRoomDto, @CurrentUser() user: AuthenticatedUser) {
        return this.storageService.createRoom(dto, user.laboratoryId!);
    }

    @Patch('rooms/:id')
    @Roles('Laboratory Admin')
    async updateRoom(
        @Param('id') id: string,
        @Body() dto: UpdateStorageRoomDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.storageService.updateRoom(id, dto, user.laboratoryId!);
    }

    // ==================== FREEZERS ====================

    @Get('freezers')
    async findAllFreezers(@CurrentUser() user: AuthenticatedUser) {
        return this.storageService.findAllFreezers(user.laboratoryId!);
    }

    @Get('freezers/:id')
    async findFreezer(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
        return this.storageService.findFreezerById(id, user.laboratoryId!);
    }

    @Post('freezers')
    @Roles('Laboratory Admin')
    async createFreezer(@Body() dto: CreateFreezerDto, @CurrentUser() user: AuthenticatedUser) {
        return this.storageService.createFreezer(dto, user.laboratoryId!);
    }

    @Patch('freezers/:id')
    @Roles('Laboratory Admin')
    async updateFreezer(
        @Param('id') id: string,
        @Body() dto: UpdateFreezerDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.storageService.updateFreezer(id, dto, user.laboratoryId!);
    }

    // ==================== SHELVES ====================

    @Post('shelves')
    @Roles('Laboratory Admin', 'Laboratory Technician')
    async createShelf(@Body() dto: CreateShelfDto, @CurrentUser() user: AuthenticatedUser) {
        return this.storageService.createShelf(dto, user.laboratoryId!);
    }

    @Patch('shelves/:id')
    @Roles('Laboratory Admin')
    async updateShelf(
        @Param('id') id: string,
        @Body() dto: UpdateShelfDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.storageService.updateShelf(id, dto, user.laboratoryId!);
    }

    // ==================== BOXES ====================

    @Get('boxes')
    async findAllBoxes(@CurrentUser() user: AuthenticatedUser) {
        return this.storageService.findAllBoxes(user.laboratoryId!);
    }

    @Get('boxes/:id')
    async findBox(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
        return this.storageService.findBoxById(id, user.laboratoryId!);
    }

    @Post('boxes')
    @Roles('Laboratory Admin', 'Laboratory Technician')
    async createBox(@Body() dto: CreateBoxDto, @CurrentUser() user: AuthenticatedUser) {
        return this.storageService.createBox(dto, user.laboratoryId!);
    }

    @Patch('boxes/:id')
    @Roles('Laboratory Admin')
    async updateBox(
        @Param('id') id: string,
        @Body() dto: UpdateBoxDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.storageService.updateBox(id, dto, user.laboratoryId!);
    }

    // ==================== POSITIONS ====================

    @Get('positions/available')
    async findAvailablePositions(
        @CurrentUser() user: AuthenticatedUser,
        @Query('boxId') boxId?: string,
    ) {
        return this.storageService.findAvailablePositions(user.laboratoryId!, boxId);
    }

    @Patch('positions/:id/block')
    @Roles('Laboratory Admin')
    async toggleBlock(
        @Param('id') id: string,
        @Body() dto: BlockPositionDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.storageService.togglePositionBlock(id, dto.isBlocked, user.laboratoryId!);
    }
}
