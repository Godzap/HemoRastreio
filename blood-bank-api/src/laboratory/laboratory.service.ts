import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateLaboratoryDto, UpdateLaboratoryDto } from './dto';
import { Laboratory } from '@prisma/client';

@Injectable()
export class LaboratoryService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(): Promise<Laboratory[]> {
        return this.prisma.laboratory.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string): Promise<Laboratory> {
        const laboratory = await this.prisma.laboratory.findUnique({
            where: { id },
        });

        if (!laboratory) {
            throw new NotFoundException(`Laboratory with ID ${id} not found`);
        }

        return laboratory;
    }

    async findByCode(code: string): Promise<Laboratory | null> {
        return this.prisma.laboratory.findUnique({
            where: { code },
        });
    }

    async create(dto: CreateLaboratoryDto): Promise<Laboratory> {
        // Check if code already exists
        const existing = await this.findByCode(dto.code);
        if (existing) {
            throw new ConflictException(`Laboratory with code ${dto.code} already exists`);
        }

        return this.prisma.laboratory.create({
            data: {
                name: dto.name,
                code: dto.code,
                organizationId: dto.organizationId,
                address: dto.address,
                phone: dto.phone,
                email: dto.email,
                licenseNumber: dto.licenseNumber,
                timezone: dto.timezone ?? 'America/Sao_Paulo',
                settings: dto.settings ?? {},
            },
        });
    }

    async update(id: string, dto: UpdateLaboratoryDto): Promise<Laboratory> {
        await this.findOne(id); // Verify exists

        return this.prisma.laboratory.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.address !== undefined && { address: dto.address }),
                ...(dto.phone !== undefined && { phone: dto.phone }),
                ...(dto.email !== undefined && { email: dto.email }),
                ...(dto.licenseNumber !== undefined && { licenseNumber: dto.licenseNumber }),
                ...(dto.timezone && { timezone: dto.timezone }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
                ...(dto.settings && { settings: dto.settings }),
            },
        });
    }

    async deactivate(id: string): Promise<Laboratory> {
        await this.findOne(id); // Verify exists

        return this.prisma.laboratory.update({
            where: { id },
            data: { isActive: false },
        });
    }

    async getStatistics(laboratoryId: string): Promise<{
        totalSamples: number;
        samplesByStatus: Record<string, number>;
        storageOccupancy: { total: number; occupied: number; percentage: number };
        pendingTransfers: number;
    }> {
        const [
            totalSamples,
            samplesByStatus,
            storagePositions,
            pendingTransfers,
        ] = await Promise.all([
            this.prisma.sample.count({
                where: { laboratoryId, deletedAt: null },
            }),
            this.prisma.sample.groupBy({
                by: ['status'],
                where: { laboratoryId, deletedAt: null },
                _count: true,
            }),
            this.prisma.storagePosition.aggregate({
                where: { laboratoryId },
                _count: { id: true },
                _sum: { isOccupied: true },
            }),
            this.prisma.transferRequest.count({
                where: {
                    OR: [
                        { fromLaboratoryId: laboratoryId },
                        { toLaboratoryId: laboratoryId },
                    ],
                    status: { in: ['PENDING', 'APPROVED', 'IN_TRANSIT'] },
                },
            }),
        ]);

        const statusCounts: Record<string, number> = {};
        samplesByStatus.forEach(item => {
            statusCounts[item.status] = item._count;
        });

        const totalPositions = storagePositions._count?.id ?? 0;
        const occupiedPositions = await this.prisma.storagePosition.count({
            where: { laboratoryId, isOccupied: true },
        });

        return {
            totalSamples,
            samplesByStatus: statusCounts,
            storageOccupancy: {
                total: totalPositions,
                occupied: occupiedPositions,
                percentage: totalPositions > 0
                    ? Math.round((occupiedPositions / totalPositions) * 100)
                    : 0,
            },
            pendingTransfers,
        };
    }
}
