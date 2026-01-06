import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import {
    CreateStorageRoomDto, UpdateStorageRoomDto,
    CreateFreezerDto, UpdateFreezerDto,
    CreateShelfDto, UpdateShelfDto,
    CreateBoxDto, UpdateBoxDto,
} from './dto';
import { StorageRoom, Freezer, Shelf, Box, StoragePosition } from '@prisma/client';

export interface BoxWithPositions extends Box {
    positions: (StoragePosition & { sample?: { id: string; barcode: string; patientCode: string } | null })[];
}

export interface StorageOccupancy {
    total: number;
    occupied: number;
    blocked: number;
    available: number;
    percentage: number;
}

@Injectable()
export class StorageService {
    constructor(private readonly prisma: PrismaService) { }

    // ==================== STORAGE ROOMS ====================

    async findAllRooms(laboratoryId: string): Promise<StorageRoom[]> {
        return this.prisma.storageRoom.findMany({
            where: { laboratoryId, isActive: true },
            include: {
                freezers: {
                    where: { isActive: true },
                    orderBy: { name: 'asc' },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findRoomById(id: string, laboratoryId: string): Promise<StorageRoom> {
        const room = await this.prisma.storageRoom.findFirst({
            where: { id, laboratoryId },
            include: {
                freezers: {
                    where: { isActive: true },
                    include: {
                        shelves: {
                            where: { isActive: true },
                            orderBy: { positionNumber: 'asc' },
                        },
                    },
                    orderBy: { name: 'asc' },
                },
            },
        });

        if (!room) {
            throw new NotFoundException(`Storage room with ID ${id} not found`);
        }

        return room;
    }

    async createRoom(dto: CreateStorageRoomDto, laboratoryId: string): Promise<StorageRoom> {
        const existing = await this.prisma.storageRoom.findUnique({
            where: { laboratoryId_code: { laboratoryId, code: dto.code } },
        });

        if (existing) {
            throw new ConflictException(`Storage room with code ${dto.code} already exists`);
        }

        return this.prisma.storageRoom.create({
            data: {
                ...dto,
                laboratoryId,
            },
        });
    }

    async updateRoom(id: string, dto: UpdateStorageRoomDto, laboratoryId: string): Promise<StorageRoom> {
        await this.findRoomById(id, laboratoryId);

        return this.prisma.storageRoom.update({
            where: { id },
            data: dto,
        });
    }

    // ==================== FREEZERS ====================

    async findAllFreezers(laboratoryId: string): Promise<Freezer[]> {
        return this.prisma.freezer.findMany({
            where: { laboratoryId, isActive: true },
            include: {
                storageRoom: { select: { id: true, name: true } },
                shelves: {
                    where: { isActive: true },
                    orderBy: { positionNumber: 'asc' },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findFreezerById(id: string, laboratoryId: string): Promise<Freezer> {
        const freezer = await this.prisma.freezer.findFirst({
            where: { id, laboratoryId },
            include: {
                storageRoom: true,
                shelves: {
                    where: { isActive: true },
                    include: {
                        boxes: {
                            where: { isActive: true },
                            orderBy: { name: 'asc' },
                        },
                    },
                    orderBy: { positionNumber: 'asc' },
                },
            },
        });

        if (!freezer) {
            throw new NotFoundException(`Freezer with ID ${id} not found`);
        }

        return freezer;
    }

    async createFreezer(dto: CreateFreezerDto, laboratoryId: string): Promise<Freezer> {
        const existing = await this.prisma.freezer.findUnique({
            where: { laboratoryId_code: { laboratoryId, code: dto.code } },
        });

        if (existing) {
            throw new ConflictException(`Freezer with code ${dto.code} already exists`);
        }

        return this.prisma.freezer.create({
            data: {
                ...dto,
                laboratoryId,
            },
        });
    }

    async updateFreezer(id: string, dto: UpdateFreezerDto, laboratoryId: string): Promise<Freezer> {
        await this.findFreezerById(id, laboratoryId);

        return this.prisma.freezer.update({
            where: { id },
            data: dto,
        });
    }

    // ==================== SHELVES ====================

    async createShelf(dto: CreateShelfDto, laboratoryId: string): Promise<Shelf> {
        return this.prisma.shelf.create({
            data: {
                ...dto,
                laboratoryId,
            },
        });
    }

    async updateShelf(id: string, dto: UpdateShelfDto, laboratoryId: string): Promise<Shelf> {
        const shelf = await this.prisma.shelf.findFirst({
            where: { id, laboratoryId },
        });

        if (!shelf) {
            throw new NotFoundException(`Shelf with ID ${id} not found`);
        }

        return this.prisma.shelf.update({
            where: { id },
            data: dto,
        });
    }

    // ==================== BOXES ====================

    async findAllBoxes(laboratoryId: string): Promise<Box[]> {
        return this.prisma.box.findMany({
            where: { laboratoryId, isActive: true },
            include: {
                shelf: {
                    include: {
                        freezer: {
                            include: {
                                storageRoom: { select: { id: true, name: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findBoxById(id: string, laboratoryId: string): Promise<BoxWithPositions> {
        const box = await this.prisma.box.findFirst({
            where: { id, laboratoryId },
            include: {
                shelf: {
                    include: {
                        freezer: {
                            include: {
                                storageRoom: true,
                            },
                        },
                    },
                },
                positions: {
                    include: {
                        samples: {
                            where: { deletedAt: null },
                            select: { id: true, barcode: true, patientCode: true },
                        },
                    },
                    orderBy: [{ rowNumber: 'asc' }, { columnNumber: 'asc' }],
                },
            },
        });

        if (!box) {
            throw new NotFoundException(`Box with ID ${id} not found`);
        }

        // Transform positions to include single sample (since one position = one sample)
        const transformedBox = {
            ...box,
            positions: box.positions.map(pos => ({
                ...pos,
                sample: pos.samples[0] || null,
            })),
        };

        return transformedBox as BoxWithPositions;
    }

    async createBox(dto: CreateBoxDto, laboratoryId: string): Promise<Box> {
        const existing = await this.prisma.box.findUnique({
            where: { laboratoryId_code: { laboratoryId, code: dto.code } },
        });

        if (existing) {
            throw new ConflictException(`Box with code ${dto.code} already exists`);
        }

        // Create box and positions in transaction
        return this.prisma.$transaction(async (tx) => {
            const box = await tx.box.create({
                data: {
                    shelfId: dto.shelfId,
                    laboratoryId,
                    name: dto.name,
                    code: dto.code,
                    boxType: dto.boxType,
                    rows: dto.rows ?? 9,
                    columns: dto.columns ?? 9,
                },
            });

            // Create positions for the box
            const positions: { boxId: string; laboratoryId: string; rowNumber: number; columnNumber: number; positionLabel: string }[] = [];
            const rows = dto.rows ?? 9;
            const columns = dto.columns ?? 9;

            for (let row = 1; row <= rows; row++) {
                for (let col = 1; col <= columns; col++) {
                    positions.push({
                        boxId: box.id,
                        laboratoryId,
                        rowNumber: row,
                        columnNumber: col,
                        positionLabel: `${String.fromCharCode(64 + row)}${col}`, // A1, A2, B1, etc.
                    });
                }
            }

            await tx.storagePosition.createMany({
                data: positions,
            });

            return box;
        });
    }

    async updateBox(id: string, dto: UpdateBoxDto, laboratoryId: string): Promise<Box> {
        await this.findBoxById(id, laboratoryId);

        return this.prisma.box.update({
            where: { id },
            data: dto,
        });
    }

    // ==================== POSITIONS ====================

    async findAvailablePositions(laboratoryId: string, boxId?: string): Promise<StoragePosition[]> {
        return this.prisma.storagePosition.findMany({
            where: {
                laboratoryId,
                isOccupied: false,
                isBlocked: false,
                ...(boxId && { boxId }),
            },
            include: {
                box: {
                    include: {
                        shelf: {
                            include: {
                                freezer: {
                                    include: {
                                        storageRoom: { select: { name: true } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: [{ boxId: 'asc' }, { rowNumber: 'asc' }, { columnNumber: 'asc' }],
            take: 100, // Limit results
        });
    }

    async togglePositionBlock(positionId: string, isBlocked: boolean, laboratoryId: string): Promise<StoragePosition> {
        const position = await this.prisma.storagePosition.findFirst({
            where: { id: positionId, laboratoryId },
        });

        if (!position) {
            throw new NotFoundException(`Position with ID ${positionId} not found`);
        }

        return this.prisma.storagePosition.update({
            where: { id: positionId },
            data: { isBlocked },
        });
    }

    // ==================== OCCUPANCY STATS ====================

    async getOccupancyStats(laboratoryId: string): Promise<StorageOccupancy> {
        const stats = await this.prisma.storagePosition.groupBy({
            by: ['isOccupied', 'isBlocked'],
            where: { laboratoryId },
            _count: true,
        });

        let total = 0;
        let occupied = 0;
        let blocked = 0;

        stats.forEach(stat => {
            total += stat._count;
            if (stat.isOccupied) occupied += stat._count;
            if (stat.isBlocked) blocked += stat._count;
        });

        const available = total - occupied - blocked;
        const percentage = total > 0 ? Math.round((occupied / total) * 100) : 0;

        return { total, occupied, blocked, available, percentage };
    }

    async getStorageHierarchy(laboratoryId: string): Promise<StorageRoom[]> {
        return this.prisma.storageRoom.findMany({
            where: { laboratoryId, isActive: true },
            include: {
                freezers: {
                    where: { isActive: true },
                    include: {
                        shelves: {
                            where: { isActive: true },
                            include: {
                                boxes: {
                                    where: { isActive: true },
                                    include: {
                                        _count: {
                                            select: { positions: true },
                                        },
                                    },
                                    orderBy: { name: 'asc' },
                                },
                            },
                            orderBy: { positionNumber: 'asc' },
                        },
                    },
                    orderBy: { name: 'asc' },
                },
            },
            orderBy: { name: 'asc' },
        });
    }
}
