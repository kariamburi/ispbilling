"use server";

import { prisma } from "@/lib/prisma";
import { createHotspotUser } from "@/lib/mikrotik";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
export async function deleteExpiredSession(formData: FormData) {
    const sessionId = String(formData.get("sessionId"));

    const session = await prisma.internetSession.findUnique({
        where: { id: sessionId },
    });

    if (!session) {
        redirect("/admin/sessions");
    }

    const now = new Date();
    const expired = session.expiresAt <= now || !session.active;

    if (!expired) {
        redirect("/admin/sessions");
    }

    await prisma.internetSession.delete({
        where: { id: sessionId },
    });

    revalidatePath("/admin/sessions");
    redirect("/admin/sessions");
}
export async function renewExpiredSession(formData: FormData) {
    const sessionId = String(formData.get("sessionId"));

    const session = await prisma.internetSession.findUnique({
        where: { id: sessionId },
    });

    if (!session) redirect("/admin/sessions");

    const pkg = await prisma.internetPackage.findUnique({
        where: { id: session.packageId },
    });

    if (!pkg) redirect("/admin/sessions");

    const username = `${session.username?.split("-")[0] || "user"}-${Date.now()
        .toString()
        .slice(-5)}`;

    const password = String(Math.floor(1000 + Math.random() * 9000));
    const expiresAt = new Date(Date.now() + pkg.durationMin * 60 * 1000);

    const renewed = await prisma.internetSession.create({
        data: {
            customerId: session.customerId,
            packageId: pkg.id,
            mac: session.mac || null,
            username,
            password,
            expiresAt,
            active: true,
            activationStatus: "PENDING",
            activationError: null,
        },
    });

    try {
        await createHotspotUser({
            username,
            password,
            durationMinutes: pkg.durationMin,
            speedLimit: pkg.speedLimit,
        });

        await prisma.internetSession.update({
            where: { id: renewed.id },
            data: {
                activationStatus: "ACTIVATED",
                activationError: null,
            },
        });
    } catch (error: any) {
        await prisma.internetSession.update({
            where: { id: renewed.id },
            data: {
                activationStatus: "FAILED",
                activationError: error?.message || "Activation failed",
            },
        });
    }

    revalidatePath("/admin/sessions");
    redirect("/admin/sessions");
}
export async function retryActivation(formData: FormData) {
    const sessionId = String(formData.get("sessionId"));

    const session = await prisma.internetSession.findUnique({
        where: { id: sessionId },
    });

    if (!session || !session.username || !session.password) {
        redirect("/admin/sessions");
    }

    const pkg = await prisma.internetPackage.findUnique({
        where: { id: session.packageId },
    });

    if (!pkg) {
        redirect("/admin/sessions");
    }

    try {
        await prisma.internetSession.update({
            where: { id: session.id },
            data: {
                activationStatus: "PENDING",
                activationError: null,
            },
        });

        await createHotspotUser({
            username: session.username!,
            password: session.password!,
            durationMinutes: pkg.durationMin,
            speedLimit: pkg.speedLimit,
        });

        await prisma.internetSession.update({
            where: { id: session.id },
            data: {
                activationStatus: "ACTIVATED",
                activationError: null,
            },
        });
    } catch (error: any) {
        await prisma.internetSession.update({
            where: { id: session.id },
            data: {
                activationStatus: "FAILED",
                activationError: error?.message || "Activation failed",
            },
        });
    }

    revalidatePath("/admin/sessions");
    redirect("/admin/sessions");
}
export async function deactivateSession(formData: FormData) {
    const sessionId = String(formData.get("sessionId"));

    await prisma.internetSession.update({
        where: { id: sessionId },
        data: {
            active: false,
            expiresAt: new Date(),
        },
    });

    revalidatePath("/admin/sessions");
    redirect("/admin/sessions");
}