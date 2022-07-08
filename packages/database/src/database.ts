import { PrismaClient, Prisma } from '@prisma/client';

export interface DatabaseOption {
  url?: string;
}

export class Database {
  private readonly prisma = new PrismaClient();

  constructor(option: DatabaseOption) {
    if (option.url) {
      this.prisma = new PrismaClient({
        datasources: { db: { url: option.url } }
      });
    }
  }

  async createResource(payload: Prisma.ResourceCreateInput) {
    return await this.prisma.resource.create({ data: payload });
  }

  async createResources(payloads: Prisma.ResourceCreateInput[]) {
    return Promise.all(payloads.map((p) => this.createResource(p)));
  }

  async list() {
    return await this.prisma.resource.findMany();
  }

  async destroy() {
    await this.prisma.$disconnect();
  }
}
