import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { createHotspotUser } from "@/lib/mikrotik";
import { sendSms } from "@/lib/sms";

function formatDateTime(date: Date) {
    return new Intl.DateTimeFormat("en-KE", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(date);
}

async function createManualSession(formData: FormData) {
    "use server";

    const phone = String(formData.get("phone")).trim();
    const packageId = String(formData.get("packageId"));

    const pkg = await prisma.internetPackage.findUnique({
        where: { id: packageId },
    });

    if (!pkg) redirect("/admin/sessions/new");

    const settings = await prisma.appSetting.findUnique({
        where: { id: "main" },
    });

    const portalName = settings?.portalName || "Craft Billing";
    const portalUrl =
        settings?.portalUrl || "https://billing.craftinventors.co.ke";

    const customer = await prisma.customer.upsert({
        where: { phone },
        update: {},
        create: { phone },
    });

    const username = phone;
    const password = String(Math.floor(1000 + Math.random() * 9000));
    const expiresAt = new Date(Date.now() + pkg.durationMin * 60 * 1000);

    const session = await prisma.internetSession.create({
        data: {
            customerId: customer.id,
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
            data: { activationStatus: "ACTIVATED", activationError: null },
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

    try {
        await sendSms({
            to: username,
            message: `${portalName} access created. Package: ${pkg.name
                }. Username: ${username}. Password: ${password}. Expires: ${formatDateTime(
                    expiresAt
                )}. Portal: ${portalUrl}`,
        });
    } catch (smsError) {
        console.error("SMS failed:", smsError);
    }

    redirect("/admin/sessions");
}

export default async function NewSessionPage() {
    const packages = await prisma.internetPackage.findMany({
        where: { active: true },
        orderBy: { price: "asc" },
    });

    return (
        <main className="min-h-screen bg-slate-100 p-6">
            <div className="mx-auto max-w-xl">
                <div className="mb-6 rounded-3xl bg-slate-950 p-6 text-white">
                    <h1 className="text-3xl font-black">Manual Session</h1>
                    <p className="mt-1 text-slate-300">Create internet access manually</p>
                </div>

                <form
                    action={createManualSession}
                    className="rounded-3xl bg-white p-6 shadow"
                >
                    <label className="text-sm font-bold">Phone Number</label>
                    <input
                        name="phone"
                        required
                        placeholder="2547XXXXXXXX"
                        className="mt-2 w-full rounded-2xl border px-4 py-3"
                    />

                    <label className="mt-5 block text-sm font-bold">Package</label>
                    <select
                        name="packageId"
                        className="mt-2 w-full rounded-2xl border px-4 py-3"
                    >
                        {packages.map((pkg) => (
                            <option key={pkg.id} value={pkg.id}>
                                {pkg.name} - {pkg.price === 0 ? "FREE" : `KES ${pkg.price}`}
                            </option>
                        ))}
                    </select>

                    {packages.length === 0 && (
                        <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">
                            No packages found. Go to Admin → Packages or run seed again.
                        </p>
                    )}

                    <button className="mt-5 w-full rounded-2xl bg-emerald-500 px-4 py-3 font-black text-slate-950">
                        Create Session
                    </button>
                </form>

                <a
                    href="/admin/sessions"
                    className="mt-5 block text-sm font-bold underline"
                >
                    Back to Sessions
                </a>
            </div>
        </main>
    );
}