"use server";

import { prisma } from "@/lib/prisma";
import { createHotspotUser } from "@/lib/mikrotik";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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