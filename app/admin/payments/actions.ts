"use server";

import { prisma } from "@/lib/prisma";
import { createHotspotUser } from "@/lib/mikrotik";
import { sendSms } from "@/lib/sms";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function formatDateTime(date: Date) {
    return new Intl.DateTimeFormat("en-KE", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(date);
}

export async function markPaymentPaid(formData: FormData) {
    const paymentId = String(formData.get("paymentId"));

    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
    });

    if (!payment) {
        redirect("/admin/payments");
    }

    if (payment.status === "PAID") {
        redirect("/admin/payments");
    }

    const paidPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
            status: "PAID",
            mpesaCode: `TEST-${Date.now()}`,
        },
    });

    const settings = await prisma.appSetting.findUnique({
        where: { id: "main" },
    });

    const portalName = settings?.portalName || "Craft Billing";
    const portalUrl =
        settings?.portalUrl || "https://billing.craftinventors.co.ke";

    if (paidPayment.customerId && paidPayment.packageId) {
        const pkg = await prisma.internetPackage.findUnique({
            where: { id: paidPayment.packageId },
        });

        if (pkg) {
            const username = paidPayment.phone;
            const password = String(Math.floor(1000 + Math.random() * 9000));
            const expiresAt = new Date(Date.now() + pkg.durationMin * 60 * 1000);

            const session = await prisma.internetSession.create({
                data: {
                    customerId: paidPayment.customerId,
                    packageId: pkg.id,
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
                    where: { id: session.id },
                    data: {
                        activationStatus: "ACTIVATED",
                        activationError: null,
                    },
                });
            } catch (error: any) {
                console.error("MikroTik activation failed:", error);

                await prisma.internetSession.update({
                    where: { id: session.id },
                    data: {
                        activationStatus: "FAILED",
                        activationError: error?.message || "MikroTik activation failed",
                    },
                });
            }

            try {
                await sendSms({
                    to: username,
                    message: `${portalName} payment received. Package: ${pkg.name
                        }. Username: ${username}. Password: ${password}. Expires: ${formatDateTime(
                            expiresAt
                        )}. Portal: ${portalUrl}`,
                });
            } catch (smsError) {
                console.error("SMS failed:", smsError);
            }
        }
    }

    revalidatePath("/admin/payments");
    revalidatePath("/admin/sessions");
    revalidatePath("/admin/customers");
    revalidatePath("/admin");

    redirect("/admin/payments");
}