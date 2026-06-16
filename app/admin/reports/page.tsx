import { prisma } from "@/lib/prisma";
import { Banknote, CalendarDays, CheckCircle2, Clock, Wifi } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
    searchParams: Promise<{
        from?: string;
        to?: string;
    }>;
};

function money(amount: number) {
    return `KES ${amount.toLocaleString("en-KE")}`;
}

export default async function ReportsPage({ searchParams }: Props) {
    const params = await searchParams;
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 6);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const from = params.from ? new Date(params.from) : null;
    const to = params.to ? new Date(params.to) : null;
    if (to) to.setHours(23, 59, 59, 999);

    const dateFilter =
        from || to
            ? {
                createdAt: {
                    ...(from ? { gte: from } : {}),
                    ...(to ? { lte: to } : {}),
                },
            }
            : {};

    const [paidPayments, packages, failedActivations, activeSessions] =
        await Promise.all([
            prisma.payment.findMany({
                where: {
                    status: "PAID",
                    ...dateFilter,
                },
                orderBy: { createdAt: "desc" },
                include: { customer: true },
            }),

            prisma.internetPackage.findMany(),

            prisma.internetSession.count({
                where: { activationStatus: "FAILED" },
            }),

            prisma.internetSession.count({
                where: {
                    active: true,
                    expiresAt: { gt: now },
                },
            }),
        ]);

    const todayPayments = paidPayments.filter((p) => p.createdAt >= startOfToday);
    const weekPayments = paidPayments.filter((p) => p.createdAt >= startOfWeek);
    const monthPayments = paidPayments.filter((p) => p.createdAt >= startOfMonth);

    const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const todayRevenue = todayPayments.reduce((sum, p) => sum + p.amount, 0);
    const weekRevenue = weekPayments.reduce((sum, p) => sum + p.amount, 0);
    const monthRevenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);

    const packageRows = packages
        .map((pkg) => {
            const packagePayments = paidPayments.filter((p) => p.packageId === pkg.id);

            return {
                name: pkg.name,
                count: packagePayments.length,
                revenue: packagePayments.reduce((sum, p) => sum + p.amount, 0),
            };
        })
        .sort((a, b) => b.revenue - a.revenue);

    const cards = [
        {
            label: "Today Revenue",
            value: money(todayRevenue),
            hint: `${todayPayments.length} payments`,
            icon: Banknote,
        },
        {
            label: "Last 7 Days",
            value: money(weekRevenue),
            hint: `${weekPayments.length} payments`,
            icon: CalendarDays,
        },
        {
            label: "This Month",
            value: money(monthRevenue),
            hint: `${monthPayments.length} payments`,
            icon: CheckCircle2,
        },
        {
            label: "Filtered Total",
            value: money(totalRevenue),
            hint: `${paidPayments.length} payments`,
            icon: Banknote,
        },
        {
            label: "Active Sessions",
            value: activeSessions,
            hint: "Currently valid sessions",
            icon: Wifi,
        },
        {
            label: "Failed Activations",
            value: failedActivations,
            hint: "Needs attention",
            icon: Clock,
        },
    ];

    return (
        <main className="p-6">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 rounded-3xl bg-slate-950 p-6 text-white">
                    <h1 className="text-3xl font-black">Reports</h1>
                    <p className="mt-1 text-slate-300">Revenue and package summary</p>
                </div>

                <form className="mb-6 grid gap-3 rounded-3xl bg-white p-4 shadow md:grid-cols-4">
                    <input
                        type="date"
                        name="from"
                        defaultValue={params.from || ""}
                        className="rounded-2xl border px-4 py-3"
                    />

                    <input
                        type="date"
                        name="to"
                        defaultValue={params.to || ""}
                        className="rounded-2xl border px-4 py-3"
                    />

                    <button className="cursor-pointer rounded-2xl bg-emerald-500 px-4 py-3 font-black text-slate-950">
                        Filter
                    </button>

                    <a
                        href="/admin/reports"
                        className="rounded-2xl bg-slate-100 px-4 py-3 text-center font-black text-slate-950"
                    >
                        Clear
                    </a>
                </form>

                <a
                    href={`/admin/reports/export?from=${params.from || ""}&to=${params.to || ""}`}
                    className="mb-6 inline-block rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white"
                >
                    Export CSV
                </a>

                <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                    {cards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <div key={card.label} className="rounded-3xl bg-white p-5 shadow">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-bold text-slate-500">
                                        {card.label}
                                    </p>
                                    <Icon className="h-5 w-5 text-slate-500" />
                                </div>

                                <p className="mt-3 text-2xl font-black text-slate-950">
                                    {card.value}
                                </p>

                                <p className="mt-1 text-xs font-bold text-slate-400">
                                    {card.hint}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="overflow-hidden rounded-3xl bg-white shadow">
                        <div className="border-b p-5">
                            <h2 className="text-xl font-black text-slate-950">
                                Package Performance
                            </h2>
                        </div>

                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-200">
                                <tr>
                                    <th className="p-4">Package</th>
                                    <th className="p-4">Sales</th>
                                    <th className="p-4">Revenue</th>
                                </tr>
                            </thead>

                            <tbody>
                                {packageRows.map((row) => (
                                    <tr key={row.name} className="border-t">
                                        <td className="p-4 font-bold">{row.name}</td>
                                        <td className="p-4">{row.count}</td>
                                        <td className="p-4 font-bold">{money(row.revenue)}</td>
                                    </tr>
                                ))}

                                {packageRows.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-6 text-center text-slate-500">
                                            No package sales yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="overflow-hidden rounded-3xl bg-white shadow">
                        <div className="border-b p-5">
                            <h2 className="text-xl font-black text-slate-950">
                                Recent Paid Payments
                            </h2>
                        </div>

                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-200">
                                <tr>
                                    <th className="p-4">Phone</th>
                                    <th className="p-4">Amount</th>
                                    <th className="p-4">M-Pesa</th>
                                    <th className="p-4">Date</th>
                                </tr>
                            </thead>

                            <tbody>
                                {paidPayments.slice(0, 10).map((p) => (
                                    <tr key={p.id} className="border-t">
                                        <td className="p-4 font-bold">
                                            {p.customerId ? (
                                                <a
                                                    href={`/admin/customers/${p.customerId}`}
                                                    className="underline"
                                                >
                                                    {p.phone}
                                                </a>
                                            ) : (
                                                p.phone
                                            )}
                                        </td>
                                        <td className="p-4">{money(p.amount)}</td>
                                        <td className="p-4">{p.mpesaCode || "-"}</td>
                                        <td className="p-4">
                                            {new Date(p.createdAt).toLocaleString("en-KE")}
                                        </td>
                                    </tr>
                                ))}

                                {paidPayments.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-6 text-center text-slate-500">
                                            No paid payments yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <a href="/admin" className="mt-5 block text-sm font-bold underline">
                    Back to Dashboard
                </a>
            </div>
        </main>
    );
}