import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = `${process.env.DATABASE_URL}`;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({
      adapter,
      log: process.env.APP_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Set the current laboratory context for Row-Level Security
   * This should be called at the beginning of each request
   */
  async setLaboratoryContext(laboratoryId: string | null, isGlobalAdmin: boolean = false): Promise<void> {
    if (isGlobalAdmin) {
      await this.$executeRawUnsafe(`SET app.is_global_admin = 'true'`);
      await this.$executeRawUnsafe(`SET app.current_laboratory_id = ''`);
    } else if (laboratoryId) {
      await this.$executeRawUnsafe(`SET app.is_global_admin = 'false'`);
      await this.$executeRawUnsafe(`SET app.current_laboratory_id = '${laboratoryId}'`);
    }
  }

  /**
   * Clear the laboratory context
   */
  async clearLaboratoryContext(): Promise<void> {
    await this.$executeRawUnsafe(`RESET app.current_laboratory_id`);
    await this.$executeRawUnsafe(`RESET app.is_global_admin`);
  }
}
