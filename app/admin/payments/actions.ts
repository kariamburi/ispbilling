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

export async function deletePendingPayment(formData: FormData) {
    const paymentId = String(
        formData.get("paymentId") || ""
    ).trim();

    if (!paymentId) {
        redirect("/admin/payments");
    }

    const payment = await prisma.payment.findUnique({
        where: {
            id: paymentId,
        },
    });

    if (!payment || payment.status !== "PENDING") {
        redirect("/admin/payments");
    }

    await prisma.payment.delete({
        where: {
            id: paymentId,
        },
    });

    revalidatePath("/admin/payments");
    revalidatePath("/admin");

    redirect("/admin/payments");
}

export async function sendPaymentRetrySms(
    formData: FormData
) {
    const paymentId = String(
        formData.get("paymentId") || ""
    ).trim();

    if (!paymentId) {
        redirect(
            "/admin/payments?error=payment_missing"
        );
    }

    const payment = await prisma.payment.findUnique({
        where: {
            id: paymentId,
        },
        include: {
            customer: true,
        },
    });

    if (!payment) {
        redirect(
            "/admin/payments?error=payment_missing"
        );
    }

    if (payment.status === "PAID") {
        redirect(
            "/admin/payments?error=already_paid"
        );
    }

    if (!payment.packageId) {
        redirect(
            "/admin/payments?error=package_missing"
        );
    }

    const pkg =
        await prisma.internetPackage.findUnique({
            where: {
                id: payment.packageId,
            },
        });

    if (!pkg) {
        redirect(
            "/admin/payments?error=package_missing"
        );
    }

    const settings =
        await prisma.appSetting.findUnique({
            where: {
                id: "main",
            },
        });

    const portalName =
        settings?.portalName || "CRAFT WIFI";

    const portalUrl =
        settings?.portalUrl ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://billing.craftinventors.co.ke";

    const retryUrl = new URL("/pay", portalUrl);

    retryUrl.searchParams.set(
        "packageId",
        pkg.id
    );

    if (payment.customer?.mac) {
        retryUrl.searchParams.set(
            "mac",
            payment.customer.mac
        );
    }

    try {
        await sendSms({
            to: payment.phone,
            message:
                `${portalName}: We have resolved the payment problem. ` +
                `Please try purchasing the ${pkg.name} package again here: ` +
                `${retryUrl.toString()}`,
        });
    } catch (error) {
        console.error(
            "Payment retry SMS failed:",
            error
        );

        redirect(
            "/admin/payments?error=sms_failed"
        );
    }

    revalidatePath("/admin/payments");

    redirect(
        "/admin/payments?success=retry_sms_sent"
    );
}

export async function markPaymentPaid(
    formData: FormData
) {
    const paymentId = String(
        formData.get("paymentId") || ""
    ).trim();

    if (!paymentId) {
        redirect("/admin/payments");
    }

    const payment = await prisma.payment.findUnique({
        where: {
            id: paymentId,
        },
    });

    if (!payment) {
        redirect("/admin/payments");
    }

    if (payment.status === "PAID") {
        redirect("/admin/payments");
    }

    const paidPayment =
        await prisma.payment.update({
            where: {
                id: paymentId,
            },
            data: {
                status: "PAID",
                mpesaCode: `TEST-${Date.now()}`,
            },
        });

    const settings =
        await prisma.appSetting.findUnique({
            where: {
                id: "main",
            },
        });

    const portalName =
        settings?.portalName ||
        "Craft Billing";

    const portalUrl =
        settings?.portalUrl ||
        "https://billing.craftinventors.co.ke";

    if (
        paidPayment.customerId &&
        paidPayment.packageId
    ) {
        const pkg =
            await prisma.internetPackage.findUnique({
                where: {
                    id: paidPayment.packageId,
                },
            });

        if (pkg) {
            const username =
                `${paidPayment.phone}-` +
                `${Date.now()
                    .toString()
                    .slice(-5)}`;

            const password = String(
                Math.floor(
                    1000 + Math.random() * 9000
                )
            );

            const expiresAt = new Date(
                Date.now() +
                pkg.durationMin * 60 * 1000
            );

            const session =
                await prisma.internetSession.create({
                    data: {
                        customerId:
                            paidPayment.customerId,
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
                    durationMinutes:
                        pkg.durationMin,
                    speedLimit:
                        pkg.speedLimit,
                });

                await prisma.internetSession.update({
                    where: {
                        id: session.id,
                    },
                    data: {
                        activationStatus:
                            "ACTIVATED",
                        activationError: null,
                    },
                });
            } catch (error: any) {
                console.error(
                    "MikroTik activation failed:",
                    error
                );

                await prisma.internetSession.update({
                    where: {
                        id: session.id,
                    },
                    data: {
                        activationStatus:
                            "FAILED",
                        activationError:
                            error?.message ||
                            "MikroTik activation failed",
                    },
                });
            }

            try {
                const loginLink =
                    `${portalUrl}/auto-login` +
                    `?sessionId=${session.id}`;

                await sendSms({
                    to: paidPayment.phone,
                    message:
                        `${portalName} payment received. ` +
                        `Package: ${pkg.name}. ` +
                        `Tap to connect: ${loginLink}. ` +
                        `Expires: ${formatDateTime(
                            expiresAt
                        )}. ` +
                        `If the link does not open, use ` +
                        `Username: ${username} ` +
                        `Password: ${password}`,
                });
            } catch (smsError) {
                console.error(
                    "SMS failed:",
                    smsError
                );
            }
        }
    }

    revalidatePath("/admin/payments");
    revalidatePath("/admin/sessions");
    revalidatePath("/admin/customers");
    revalidatePath("/admin");

    redirect("/admin/payments");
}