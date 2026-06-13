import { prisma } from "@/lib/prisma";

export default async function DeploymentPage() {
    const settings = await prisma.appSetting.findUnique({
        where: { id: "main" },
    });

    const router = await prisma.router.findFirst({
        where: { active: true },
    });

    const checks = [
        {
            label: "Portal URL",
            ok: Boolean(settings?.portalUrl),
            value: settings?.portalUrl || "Not set",
        },
        {
            label: "Portal Name",
            ok: Boolean(settings?.portalName),
            value: settings?.portalName || "Not set",
        },
        {
            label: "Active Router",
            ok: Boolean(router),
            value: router ? `${router.name} (${router.host})` : "Not configured",
        },
        {
            label: "M-Pesa Callback URL",
            ok: Boolean(process.env.MPESA_CALLBACK_URL),
            value: process.env.MPESA_CALLBACK_URL || "Not set",
        },
        {
            label: "SMS API",
            ok: Boolean(process.env.SMS_USERNAME && process.env.SMS_PASSWORD),
            value: process.env.SMS_USERNAME ? "Configured" : "Not configured",
        },
        {
            label: "Cron Secret",
            ok: Boolean(process.env.CRON_SECRET),
            value: process.env.CRON_SECRET ? "Configured" : "Not configured",
        },
    ];

    return (
        <main className="p-6">
            <div className="mx-auto max-w-5xl">
                <div className="mb-6 rounded-3xl bg-slate-950 p-6 text-white">
                    <h1 className="text-3xl font-black">Deployment Checklist</h1>
                    <p className="mt-1 text-slate-300">
                        Confirm production readiness before VPS deployment
                    </p>
                </div>

                <div className="space-y-3">
                    {checks.map((check) => (
                        <div
                            key={check.label}
                            className="flex items-center justify-between rounded-3xl bg-white p-5 shadow"
                        >
                            <div>
                                <p className="font-black text-slate-950">{check.label}</p>
                                <p className="text-sm text-slate-500">{check.value}</p>
                            </div>

                            <span
                                className={`rounded-full px-3 py-1 text-xs font-black ${check.ok
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-red-100 text-red-700"
                                    }`}
                            >
                                {check.ok ? "READY" : "MISSING"}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}