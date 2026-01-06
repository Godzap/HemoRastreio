import { PrismaClient, SampleStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // ==================== SAMPLE TYPES ====================
    const sampleTypes = await Promise.all([
        prisma.sampleType.upsert({
            where: { code: 'WHOLE_BLOOD' },
            update: {},
            create: {
                code: 'WHOLE_BLOOD',
                name: 'Sangue Total',
                description: 'Amostra de sangue total com anticoagulante',
                storageRequirements: { temperature: '2-6°C', container: 'EDTA' },
                defaultExpirationDays: 35,
            },
        }),
        prisma.sampleType.upsert({
            where: { code: 'SERUM' },
            update: {},
            create: {
                code: 'SERUM',
                name: 'Soro',
                description: 'Soro sanguíneo após centrifugação',
                storageRequirements: { temperature: '-20°C', container: 'Tubo seco' },
                defaultExpirationDays: 365,
            },
        }),
        prisma.sampleType.upsert({
            where: { code: 'PLASMA' },
            update: {},
            create: {
                code: 'PLASMA',
                name: 'Plasma',
                description: 'Plasma sanguíneo',
                storageRequirements: { temperature: '-20°C', container: 'Citrato' },
                defaultExpirationDays: 365,
            },
        }),
        prisma.sampleType.upsert({
            where: { code: 'BUFFY_COAT' },
            update: {},
            create: {
                code: 'BUFFY_COAT',
                name: 'Buffy Coat',
                description: 'Camada leucocitária',
                storageRequirements: { temperature: '-80°C', container: 'Criotubo' },
                defaultExpirationDays: 730,
            },
        }),
    ]);
    console.log(`✅ Created ${sampleTypes.length} sample types`);

    // ==================== ROLES ====================
    const roles = await Promise.all([
        prisma.role.upsert({
            where: { id: '00000000-0000-0000-0000-000000000001' },
            update: {},
            create: {
                id: '00000000-0000-0000-0000-000000000001',
                name: 'Global Admin',
                description: 'Administrador global com acesso a todos os laboratórios',
                isGlobal: true,
            },
        }),
        prisma.role.upsert({
            where: { id: '00000000-0000-0000-0000-000000000002' },
            update: {},
            create: {
                id: '00000000-0000-0000-0000-000000000002',
                name: 'Laboratory Admin',
                description: 'Administrador do laboratório',
                isGlobal: false,
            },
        }),
        prisma.role.upsert({
            where: { id: '00000000-0000-0000-0000-000000000003' },
            update: {},
            create: {
                id: '00000000-0000-0000-0000-000000000003',
                name: 'Supervisor',
                description: 'Supervisor/Auditor com acesso de leitura e relatórios',
                isGlobal: false,
            },
        }),
        prisma.role.upsert({
            where: { id: '00000000-0000-0000-0000-000000000004' },
            update: {},
            create: {
                id: '00000000-0000-0000-0000-000000000004',
                name: 'Laboratory Technician',
                description: 'Técnico de laboratório',
                isGlobal: false,
            },
        }),
        prisma.role.upsert({
            where: { id: '00000000-0000-0000-0000-000000000005' },
            update: {},
            create: {
                id: '00000000-0000-0000-0000-000000000005',
                name: 'Viewer',
                description: 'Acesso somente leitura',
                isGlobal: false,
            },
        }),
    ]);
    console.log(`✅ Created ${roles.length} roles`);

    // ==================== PERMISSIONS ====================
    const permissions = await Promise.all([
        // Laboratory permissions
        prisma.permission.upsert({
            where: { code: 'laboratories.view' },
            update: {},
            create: { code: 'laboratories.view', name: 'Ver Laboratórios', module: 'laboratories' },
        }),
        prisma.permission.upsert({
            where: { code: 'laboratories.create' },
            update: {},
            create: { code: 'laboratories.create', name: 'Criar Laboratório', module: 'laboratories' },
        }),
        prisma.permission.upsert({
            where: { code: 'laboratories.manage' },
            update: {},
            create: { code: 'laboratories.manage', name: 'Gerenciar Laboratório', module: 'laboratories' },
        }),
        // User permissions
        prisma.permission.upsert({
            where: { code: 'users.view' },
            update: {},
            create: { code: 'users.view', name: 'Ver Usuários', module: 'users' },
        }),
        prisma.permission.upsert({
            where: { code: 'users.manage' },
            update: {},
            create: { code: 'users.manage', name: 'Gerenciar Usuários', module: 'users' },
        }),
        // Sample permissions
        prisma.permission.upsert({
            where: { code: 'samples.view' },
            update: {},
            create: { code: 'samples.view', name: 'Ver Amostras', module: 'samples' },
        }),
        prisma.permission.upsert({
            where: { code: 'samples.create' },
            update: {},
            create: { code: 'samples.create', name: 'Registrar Amostras', module: 'samples' },
        }),
        prisma.permission.upsert({
            where: { code: 'samples.move' },
            update: {},
            create: { code: 'samples.move', name: 'Movimentar Amostras', module: 'samples' },
        }),
        prisma.permission.upsert({
            where: { code: 'samples.discard' },
            update: {},
            create: { code: 'samples.discard', name: 'Descartar Amostras', module: 'samples' },
        }),
        // Storage permissions
        prisma.permission.upsert({
            where: { code: 'storage.view' },
            update: {},
            create: { code: 'storage.view', name: 'Ver Armazenamento', module: 'storage' },
        }),
        prisma.permission.upsert({
            where: { code: 'storage.manage' },
            update: {},
            create: { code: 'storage.manage', name: 'Gerenciar Armazenamento', module: 'storage' },
        }),
        // Transfer permissions
        prisma.permission.upsert({
            where: { code: 'transfers.create' },
            update: {},
            create: { code: 'transfers.create', name: 'Criar Transferências', module: 'transfers' },
        }),
        prisma.permission.upsert({
            where: { code: 'transfers.approve' },
            update: {},
            create: { code: 'transfers.approve', name: 'Aprovar Transferências', module: 'transfers' },
        }),
        // Audit permissions
        prisma.permission.upsert({
            where: { code: 'audit.view' },
            update: {},
            create: { code: 'audit.view', name: 'Ver Logs de Auditoria', module: 'audit' },
        }),
        // Report permissions
        prisma.permission.upsert({
            where: { code: 'reports.export' },
            update: {},
            create: { code: 'reports.export', name: 'Exportar Relatórios', module: 'reports' },
        }),
    ]);
    console.log(`✅ Created ${permissions.length} permissions`);

    // ==================== ORGANIZATION ====================
    const organization = await prisma.organization.upsert({
        where: { code: 'REDE_LABORATORIOS' },
        update: {},
        create: {
            code: 'REDE_LABORATORIOS',
            name: 'Rede de Laboratórios',
            isActive: true,
        },
    });
    console.log(`✅ Created organization: ${organization.name}`);

    // ==================== LABORATORY ====================
    const laboratory = await prisma.laboratory.upsert({
        where: { code: 'LAB_CENTRAL' },
        update: {},
        create: {
            code: 'LAB_CENTRAL',
            name: 'Laboratório Central',
            organizationId: organization.id,
            address: 'Av. Principal, 100 - Centro',
            phone: '(11) 1234-5678',
            email: 'central@laboratorio.com',
            licenseNumber: 'CRM-12345',
            timezone: 'America/Sao_Paulo',
            isActive: true,
        },
    });
    console.log(`✅ Created laboratory: ${laboratory.name}`);

    // ==================== ADMIN USER ====================
    const passwordHash = await bcrypt.hash('admin123', 12);

    const adminUser = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            email: 'admin@laboratorio.com',
            username: 'admin',
            passwordHash,
            fullName: 'Administrador do Sistema',
            isActive: true,
            isGlobalAdmin: true,
            laboratoryId: null, // Global admin has no specific lab
        },
    });
    console.log(`✅ Created admin user: ${adminUser.username}`);

    // Lab admin user
    const labAdminHash = await bcrypt.hash('labadmin123', 12);
    const labAdmin = await prisma.user.upsert({
        where: { username: 'labadmin' },
        update: {},
        create: {
            email: 'labadmin@laboratorio.com',
            username: 'labadmin',
            passwordHash: labAdminHash,
            fullName: 'Administrador do Laboratório',
            isActive: true,
            isGlobalAdmin: false,
            laboratoryId: laboratory.id,
        },
    });

    // Assign lab admin role
    await prisma.userRole.upsert({
        where: {
            userId_roleId_laboratoryId: {
                userId: labAdmin.id,
                roleId: roles[1].id, // Laboratory Admin
                laboratoryId: laboratory.id,
            },
        },
        update: {},
        create: {
            userId: labAdmin.id,
            roleId: roles[1].id,
            laboratoryId: laboratory.id,
        },
    });
    console.log(`✅ Created lab admin user: ${labAdmin.username}`);

    // Technician user
    const techHash = await bcrypt.hash('tech123', 12);
    const techUser = await prisma.user.upsert({
        where: { username: 'tecnico' },
        update: {},
        create: {
            email: 'tecnico@laboratorio.com',
            username: 'tecnico',
            passwordHash: techHash,
            fullName: 'Técnico de Laboratório',
            registrationNumber: 'TEC-001',
            isActive: true,
            isGlobalAdmin: false,
            laboratoryId: laboratory.id,
        },
    });

    // Assign technician role
    await prisma.userRole.upsert({
        where: {
            userId_roleId_laboratoryId: {
                userId: techUser.id,
                roleId: roles[3].id, // Laboratory Technician
                laboratoryId: laboratory.id,
            },
        },
        update: {},
        create: {
            userId: techUser.id,
            roleId: roles[3].id,
            laboratoryId: laboratory.id,
        },
    });
    console.log(`✅ Created technician user: ${techUser.username}`);

    // ==================== STORAGE STRUCTURE ====================
    const storageRoom = await prisma.storageRoom.upsert({
        where: { laboratoryId_code: { laboratoryId: laboratory.id, code: 'SALA_FRIO' } },
        update: {},
        create: {
            laboratoryId: laboratory.id,
            code: 'SALA_FRIO',
            name: 'Sala de Armazenamento Frio',
            description: 'Sala principal de armazenamento refrigerado',
        },
    });

    const freezer = await prisma.freezer.upsert({
        where: { laboratoryId_code: { laboratoryId: laboratory.id, code: 'FREEZER_01' } },
        update: {},
        create: {
            laboratoryId: laboratory.id,
            storageRoomId: storageRoom.id,
            code: 'FREEZER_01',
            name: 'Freezer Principal -20°C',
            equipmentType: 'freezer',
            targetTemperature: -20,
            minTemperature: -25,
            maxTemperature: -15,
        },
    });

    const shelf = await prisma.shelf.create({
        data: {
            laboratoryId: laboratory.id,
            freezerId: freezer.id,
            name: 'Prateleira 1',
            positionNumber: 1,
        },
    });

    const box = await prisma.box.upsert({
        where: { laboratoryId_code: { laboratoryId: laboratory.id, code: 'BOX_001' } },
        update: {},
        create: {
            laboratoryId: laboratory.id,
            shelfId: shelf.id,
            code: 'BOX_001',
            name: 'Caixa 001',
            boxType: '9x9',
            rows: 9,
            columns: 9,
        },
    });

    // Create positions for the box
    const existingPositions = await prisma.storagePosition.count({
        where: { boxId: box.id },
    });

    if (existingPositions === 0) {
        const positions = [];
        for (let row = 1; row <= 9; row++) {
            for (let col = 1; col <= 9; col++) {
                positions.push({
                    boxId: box.id,
                    laboratoryId: laboratory.id,
                    rowNumber: row,
                    columnNumber: col,
                    positionLabel: `${String.fromCharCode(64 + row)}${col}`,
                });
            }
        }
        await prisma.storagePosition.createMany({ data: positions });
        console.log(`✅ Created ${positions.length} storage positions for box ${box.code}`);
    }

    console.log(`✅ Created storage structure: ${storageRoom.name} > ${freezer.name} > ${box.name}`);

    console.log('\n🎉 Database seed completed successfully!');
    console.log('\n📝 Test credentials:');
    console.log('   Global Admin: admin / admin123');
    console.log('   Lab Admin: labadmin / labadmin123');
    console.log('   Technician: tecnico / tech123');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
