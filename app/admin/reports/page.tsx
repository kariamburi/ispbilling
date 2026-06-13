import { prisma } from "@/lib/prisma";

type Props = {
    searchParams: Promise<{
        from?: string;
        to?: string;
    }>;
};

export default async function ReportsPage({ searchParams }: Props) {
    const params = await searchParams;

    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const from = params.from ? new Date(params.from) : null;
    const to = params.to ? new Date(params.to) : null;

    if (to) to.setHours(23, 59, 59, 999);

    const paidPayments = await prisma.payment.findMany({
        where: {
            status: "PAID",
            ...(from || to
                ? {
                    createdAt: {
                        ...(from ? { gte: from } : {}),
                        ...(to ? { lte: to } : {}),
                    },
                }
                : {}),
        },
        orderBy: { createdAt: "desc" },
    });

    const packages = await prisma.internetPackage.findMany();

    const packageRows = packages.map((pkg) => {
        const packagePayments = paidPayments.filter((p) => p.packageId === pkg.id);

        return {
            name: pkg.name,
            count: packagePayments.length,
            revenue: packagePayments.reduce((sum, p) => sum + p.amount, 0),
        };
    });

    const today = paidPayments.filter((p) => p.createdAt >= startOfToday);
    const month = paidPayments.filter((p) => p.createdAt >= startOfMonth);

    const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const todayRevenue = today.reduce((sum, p) => sum + p.amount, 0);
    const monthRevenue = month.reduce((sum, p) => sum + p.amount, 0);

    return (
        <main className="p-6">
            <div className="mx-auto max-w-6xl">
                <div className="mb-6 rounded-3xl bg-slate-950 p-6 text-white">
                    <h1 className="text-3xl font-black">Reports</h1>
                    <p className="mt-1 text-slate-300">Revenue summary</p>
                </div>

                <form className="mb-6 grid gap-3 rounded-3xl bg-white p-4 shadow md:grid-cols-3">
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

                    <button className="rounded-2xl cursor-pointer bg-emerald-500 px-4 py-3 font-black text-slate-950">
                        Filter
                    </button>
                </form>
                <a
                    href={`/admin/reports/export?from=${params.from || ""}&to=${params.to || ""}`}
                    className="mb-6 inline-block rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white"
                >
                    Export CSV
                </a>
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-3xl bg-white p-6 shadow">
                        <p className="text-sm font-bold text-slate-500">Today</p>
                        <p className="mt-3 text-3xl font-black">KES {todayRevenue}</p>
                        <p className="text-sm text-slate-500">{today.length} payments</p>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow">
                        <p className="text-sm font-bold text-slate-500">This Month</p>
                        <p className="mt-3 text-3xl font-black">KES {monthRevenue}</p>
                        <p className="text-sm text-slate-500">{month.length} payments</p>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow">
                        <p className="text-sm font-bold text-slate-500">Filtered Total</p>
                        <p className="mt-3 text-3xl font-black">KES {totalRevenue}</p>
                        <p className="text-sm text-slate-500">
                            {paidPayments.length} payments
                        </p>
                    </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow">
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
                                    <td className="p-4">KES {row.revenue}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <a href="/admin" className="mt-5 block text-sm font-bold underline">
                    Back to Dashboard
                </a>
            </div>
        </main>
    );
}