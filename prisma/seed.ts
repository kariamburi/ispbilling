import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    const password = await bcrypt.hash("5050Paul.com", 10);

    await prisma.adminUser.upsert({
        where: { email: "admin@craftinventors.co.ke" },
        update: {
            password,
            role: "SUPER_ADMIN",
        },
        create: {
            name: "Admin",
            email: "admin@craftinventors.co.ke",
            password,
            role: "SUPER_ADMIN",
        },
    });

    await prisma.router.upsert({
        where: { id: "office-mikrotik" },
        update: {
            name: "Office MikroTik",
            host: "192.168.88.1",
            username: "admin",
            password: "5050Paul.com",
            port: 8728,
            location: "Manguo Office",
            active: true,
        },
        create: {
            id: "office-mikrotik",
            name: "Office MikroTik",
            host: "192.168.88.1",
            username: "admin",
            password: "5050Paul.com",
            port: 8728,
            location: "Manguo Office",
            active: true,
        },
    });

    const packages = [
        {
            name: "Free Trial",
            price: 0,
            durationMin: 10,
            speedLimit: "trial",
            isFreeTrial: true,
        },
        {
            name: "30 Minutes",
            price: 5,
            durationMin: 30,
            speedLimit: "mini",
            isFreeTrial: false,
        },
        {
            name: "1 Hour",
            price: 9,
            durationMin: 60,
            speedLimit: "daily",
            isFreeTrial: false,
        },
        {
            name: "3 Hours",
            price: 19,
            durationMin: 180,
            speedLimit: "daily",
            isFreeTrial: false,
        },
        {
            name: "1 Day",
            price: 49,
            durationMin: 1440,
            speedLimit: "daily",
            isFreeTrial: false,
        },
        {
            name: "1 Week",
            price: 199,
            durationMin: 10080,
            speedLimit: "weekly",
            isFreeTrial: false,
        },
        {
            name: "1 Month",
            price: 499,
            durationMin: 43200,
            speedLimit: "monthly",
            isFreeTrial: false,
        },
    ];
    for (const pkg of packages) {
        await prisma.internetPackage.upsert({
            where: { name: pkg.name },
            update: pkg,
            create: pkg,
        });
    }
    await prisma.appSetting.upsert({
        where: { id: "main" },
        update: {
            portalName: "CRAFT WIFI",
            subtitle: "Fast internet for Manguo Estate",
            supportPhone: "+254728820092",
            whatsappPhone: "+254728820092",
        },
        create: {
            id: "main",
            portalName: "CRAFT WIFI",
            subtitle: "Fast internet for Manguo Estate",
            supportPhone: "+254728820092",
            whatsappPhone: "+254728820092",
        },
    });
    console.log("Craft Billing seed completed");
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });