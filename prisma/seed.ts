import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
            email: 'test@example.com',
            name: 'Test Operator',
            role: UserRole.OWNER,
        },
    });

    const site = await prisma.site.upsert({
        where: { id: 'demo123' },
        update: {},
        create: {
            id: 'demo123',
            name: 'Demo Site',
            domain: 'localhost',
            ownerId: user.id,
            apiKey: 'demo-api-key',
        },
    });

    console.log('Seeded database with test user and site demo123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
