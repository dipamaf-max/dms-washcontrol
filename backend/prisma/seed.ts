import { PrismaClient, Role, SubscriptionPlanType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.subscriptionPlan.upsert({
    where: { type: SubscriptionPlanType.STARTER },
    update: {},
    create: {
      type: SubscriptionPlanType.STARTER,
      name: 'Starter',
      monthlyPrice: 10000,
      maxEmployees: 3,
      maxStations: 1,
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { type: SubscriptionPlanType.BUSINESS },
    update: {},
    create: {
      type: SubscriptionPlanType.BUSINESS,
      name: 'Business',
      monthlyPrice: 20000,
      maxEmployees: 10,
      maxStations: 3,
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { type: SubscriptionPlanType.PREMIUM },
    update: {},
    create: {
      type: SubscriptionPlanType.PREMIUM,
      name: 'Premium',
      monthlyPrice: 35000,
      maxEmployees: null,
      maxStations: null,
    },
  });

  const adminEmail = 'admin@dmswashcontrol.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        fullName: 'Administrateur DMS',
        role: Role.ADMIN,
      },
    });
    // eslint-disable-next-line no-console
    console.log(`Compte admin créé: ${adminEmail} / Admin@123`);
  }
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
