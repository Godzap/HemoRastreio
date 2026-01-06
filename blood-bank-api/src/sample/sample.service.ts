import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateSampleDto, UpdateSampleDto, MoveSampleDto, ChangeStatusDto, SampleQueryDto } from './dto';
import { Sample, SampleStatus, SampleMovement, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable()
export class SampleService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(
        laboratoryId: string,
        query: SampleQueryDto,
    ): Promise<PaginatedResult<Sample>> {
        const { search, status, sampleTypeId, collectionDateFrom, collectionDateTo, page = 1, limit = 20 } = query;

        const where: Prisma.SampleWhereInput = {
            laboratoryId,
            deletedAt: null,
            ...(search && {
                OR: [
                    { barcode: { contains: search, mode: 'insensitive' } },
                    { patientCode: { contains: search, mode: 'insensitive' } },
                    { requestCode: { contains: search, mode: 'insensitive' } },
                    { externalId: { contains: search, mode: 'insensitive' } },
                ],
            }),
            ...(status && { status }),
            ...(sampleTypeId && { sampleTypeId }),
            ...(collectionDateFrom && {
                collectionDatetime: { gte: new Date(collectionDateFrom) },
            }),
            ...(collectionDateTo && {
                collectionDatetime: { lte: new Date(collectionDateTo) },
            }),
        };

        const [data, total] = await Promise.all([
            this.prisma.sample.findMany({
                where,
                include: {
                    sampleType: true,
                    collectedBy: {
                        select: { id: true, fullName: true, username: true },
                    },
                    currentPosition: {
                        include: {
                            box: {
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
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.sample.count({ where }),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: string, laboratoryId: string): Promise<Sample> {
        const sample = await this.prisma.sample.findFirst({
            where: { id, laboratoryId, deletedAt: null },
            include: {
                sampleType: true,
                collectedBy: {
                    select: { id: true, fullName: true, username: true },
                },
                currentPosition: {
                    include: {
                        box: {
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
                            },
                        },
                    },
                },
            },
        });

        if (!sample) {
            throw new NotFoundException(`Sample with ID ${id} not found`);
        }

        return sample;
    }

    async findByBarcode(barcode: string): Promise<Sample | null> {
        return this.prisma.sample.findUnique({
            where: { barcode },
            include: {
                sampleType: true,
                laboratory: true,
            },
        });
    }

    async create(dto: CreateSampleDto, laboratoryId: string, userId: string): Promise<Sample> {
        // Check if barcode already exists
        const existing = await this.findByBarcode(dto.barcode);
        if (existing) {
            throw new ConflictException(`Sample with barcode ${dto.barcode} already exists`);
        }

        // If position specified, verify it's available
        if (dto.currentPositionId) {
            const position = await this.prisma.storagePosition.findFirst({
                where: {
                    id: dto.currentPositionId,
                    laboratoryId,
                    isOccupied: false,
                    isBlocked: false,
                },
            });

            if (!position) {
                throw new BadRequestException('Storage position is not available');
            }
        }

        // Create sample with movement record
        const sample = await this.prisma.$transaction(async (tx) => {
            const newSample = await tx.sample.create({
                data: {
                    barcode: dto.barcode,
                    externalId: dto.externalId,
                    patientCode: dto.patientCode,
                    requestCode: dto.requestCode,
                    sampleTypeId: dto.sampleTypeId,
                    volumeMl: dto.volumeMl,
                    collectionDatetime: new Date(dto.collectionDatetime),
                    collectedByUserId: userId,
                    laboratoryId,
                    currentPositionId: dto.currentPositionId,
                    expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : null,
                    notes: dto.notes,
                    status: dto.currentPositionId ? SampleStatus.STORED : SampleStatus.COLLECTED,
                },
                include: {
                    sampleType: true,
                    collectedBy: { select: { id: true, fullName: true, username: true } },
                },
            });

            // Create initial movement record
            await tx.sampleMovement.create({
                data: {
                    sampleId: newSample.id,
                    laboratoryId,
                    toPositionId: dto.currentPositionId,
                    newStatus: newSample.status,
                    performedByUserId: userId,
                    reason: 'Sample registered',
                },
            });

            // Mark position as occupied
            if (dto.currentPositionId) {
                await tx.storagePosition.update({
                    where: { id: dto.currentPositionId },
                    data: { isOccupied: true },
                });
            }

            // Log to audit
            await tx.auditLog.create({
                data: {
                    id: uuidv4(),
                    laboratoryId,
                    userId,
                    entityType: 'sample',
                    entityId: newSample.id,
                    action: 'create',
                    newValues: newSample as unknown as Prisma.JsonObject,
                },
            });

            return newSample;
        });

        return sample;
    }

    async update(id: string, dto: UpdateSampleDto, laboratoryId: string, userId: string): Promise<Sample> {
        const existing = await this.findOne(id, laboratoryId);

        const sample = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.sample.update({
                where: { id },
                data: {
                    ...(dto.externalId !== undefined && { externalId: dto.externalId }),
                    ...(dto.volumeMl !== undefined && { volumeMl: dto.volumeMl }),
                    ...(dto.expirationDate !== undefined && {
                        expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : null
                    }),
                    ...(dto.notes !== undefined && { notes: dto.notes }),
                },
                include: {
                    sampleType: true,
                    collectedBy: { select: { id: true, fullName: true, username: true } },
                },
            });

            // Log to audit
            await tx.auditLog.create({
                data: {
                    id: uuidv4(),
                    laboratoryId,
                    userId,
                    entityType: 'sample',
                    entityId: id,
                    action: 'update',
                    oldValues: existing as unknown as Prisma.JsonObject,
                    newValues: updated as unknown as Prisma.JsonObject,
                },
            });

            return updated;
        });

        return sample;
    }

    async move(
        id: string,
        dto: MoveSampleDto,
        laboratoryId: string,
        userId: string,
    ): Promise<Sample> {
        const sample = await this.findOne(id, laboratoryId);

        // Verify new position is available
        const newPosition = await this.prisma.storagePosition.findFirst({
            where: {
                id: dto.toPositionId,
                laboratoryId,
                isOccupied: false,
                isBlocked: false,
            },
        });

        if (!newPosition) {
            throw new BadRequestException('Target storage position is not available');
        }

        return this.prisma.$transaction(async (tx) => {
            // Free old position
            if (sample.currentPositionId) {
                await tx.storagePosition.update({
                    where: { id: sample.currentPositionId },
                    data: { isOccupied: false },
                });
            }

            // Update sample
            const updated = await tx.sample.update({
                where: { id },
                data: {
                    currentPositionId: dto.toPositionId,
                    status: SampleStatus.STORED,
                },
                include: {
                    sampleType: true,
                    currentPosition: true,
                },
            });

            // Mark new position as occupied
            await tx.storagePosition.update({
                where: { id: dto.toPositionId },
                data: { isOccupied: true },
            });

            // Create movement record
            await tx.sampleMovement.create({
                data: {
                    sampleId: id,
                    laboratoryId,
                    fromPositionId: sample.currentPositionId,
                    toPositionId: dto.toPositionId,
                    previousStatus: sample.status,
                    newStatus: SampleStatus.STORED,
                    performedByUserId: userId,
                    reason: dto.reason,
                    notes: dto.notes,
                },
            });

            return updated;
        });
    }

    async changeStatus(
        id: string,
        dto: ChangeStatusDto,
        laboratoryId: string,
        userId: string,
    ): Promise<Sample> {
        const sample = await this.findOne(id, laboratoryId);

        return this.prisma.$transaction(async (tx) => {
            // If discarding, free the position
            let positionUpdate = {};
            if (dto.status === SampleStatus.DISCARDED && sample.currentPositionId) {
                await tx.storagePosition.update({
                    where: { id: sample.currentPositionId },
                    data: { isOccupied: false },
                });
                positionUpdate = { currentPositionId: null };
            }

            const updated = await tx.sample.update({
                where: { id },
                data: {
                    status: dto.status,
                    ...positionUpdate,
                },
                include: {
                    sampleType: true,
                },
            });

            // Create movement record
            await tx.sampleMovement.create({
                data: {
                    sampleId: id,
                    laboratoryId,
                    fromPositionId: sample.currentPositionId,
                    toPositionId: dto.status === SampleStatus.DISCARDED ? null : sample.currentPositionId,
                    previousStatus: sample.status,
                    newStatus: dto.status,
                    performedByUserId: userId,
                    reason: dto.reason,
                    notes: dto.notes,
                },
            });

            return updated;
        });
    }

    async getHistory(id: string, laboratoryId: string): Promise<SampleMovement[]> {
        await this.findOne(id, laboratoryId);

        return this.prisma.sampleMovement.findMany({
            where: { sampleId: id },
            include: {
                performedBy: {
                    select: { id: true, fullName: true, username: true },
                },
                fromPosition: {
                    include: {
                        box: { select: { name: true, code: true } },
                    },
                },
                toPosition: {
                    include: {
                        box: { select: { name: true, code: true } },
                    },
                },
            },
            orderBy: { performedAt: 'desc' },
        });
    }

    async getExpiringSoon(laboratoryId: string, days: number = 30): Promise<Sample[]> {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        return this.prisma.sample.findMany({
            where: {
                laboratoryId,
                deletedAt: null,
                status: { notIn: [SampleStatus.DISCARDED, SampleStatus.ARCHIVED] },
                expirationDate: {
                    lte: futureDate,
                    gte: new Date(),
                },
            },
            include: {
                sampleType: true,
                currentPosition: {
                    include: {
                        box: true,
                    },
                },
            },
            orderBy: { expirationDate: 'asc' },
        });
    }

    async softDelete(id: string, laboratoryId: string, userId: string): Promise<void> {
        await this.findOne(id, laboratoryId);

        await this.prisma.$transaction(async (tx) => {
            await tx.sample.update({
                where: { id },
                data: { deletedAt: new Date() },
            });

            await tx.auditLog.create({
                data: {
                    id: uuidv4(),
                    laboratoryId,
                    userId,
                    entityType: 'sample',
                    entityId: id,
                    action: 'soft_delete',
                },
            });
        });
    }
}
