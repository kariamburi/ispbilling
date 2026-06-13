import { prisma } from "@/lib/prisma";
import RevenueChart from "./components/RevenueChart";
import PackageChart from "./components/PackageChart";
import { AlertTriangle, Banknote, CalendarDays, CheckCircle2, Clock, Users, Wifi } from "lucide-react";

export default async function AdminDashboardPage() {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentPayments = await prisma.payment.findMany({
        where: {
            createdAt: { gte: sevenDaysAgo },
        },
    });

    const paymentsToday = recentPayments.filter(
        (p) => p.createdAt >= startOfToday
    );

    const paidToday = paymentsToday.filter((p) => p.status === "PAID");
    const pendingToday = paymentsToday.filter((p) => p.status === "PENDING");

    const revenueToday = paidToday.reduce((sum, p) => sum + p.amount, 0);

    const monthPayments = await prisma.payment.findMany({
        where: {
            status: "PAID",
            createdAt: { gte: startOfMonth },
        },
    });

    const monthRevenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);

    const activeSessions = await prisma.internetSession.count({
        where: {
            active: true,
            expiresAt: { gt: new Date() },
        },
    });

    const totalCustomers = await prisma.customer.count();

    const failedActivations = await prisma.internetSession.count({
        where: { activationStatus: "FAILED" },
    });

    const last7Days = Array.from({ length: 7 }).map((_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - index));
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayPayments = recentPayments.filter(
            (p) => p.status === "PAID" && p.createdAt >= date && p.createdAt < nextDate
        );

        return {
            day: date.toLocaleDateString("en-KE", { weekday: "short" }),
            revenue: dayPayments.reduce((sum, p) => sum + p.amount, 0),
        };
    });

    const packages = await prisma.internetPackage.findMany();

    const packageChartData = packages.map((pkg) => {
        const sales = recentPayments.filter(
            (p) => p.status === "PAID" && p.packageId === pkg.id
        ).length;

        return {
            name: pkg.name,
            sales,
        };
    });
    const recentPaidPayments = await prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
    });

    const recentSessions = await prisma.internetSession.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { customer: true },
    });
    const activeRouter = await prisma.router.findFirst({
        where: { active: true },
        orderBy: { createdAt: "desc" },
    });
    const cards = [
        { label: "Revenue Today", value: `KES ${revenueToday}`, icon: Banknote },
        { label: "Month Revenue", value: `KES ${monthRevenue}`, icon: CalendarDays },
        { label: "Paid Today", value: paidToday.length, icon: CheckCircle2 },
        { label: "Pending Today", value: pendingToday.length, icon: Clock },
        { label: "Active Sessions", value: activeSessions, icon: Wifi },
        { label: "Customers", value: totalCustomers, icon: Users },
        { label: "Failed Activations", value: failedActivations, icon: AlertTriangle },
        {
            label: "Router",
            value: activeRouter ? "Configured" : "Not Set",
            icon: Wifi,
        },
    ];

    return (
        <main className="p-6">
            <div className="mx-auto max-w-6xl">
                <div className="mb-6 rounded-3xl bg-slate-950 p-6 text-white">
                    <h1 className="text-3xl font-black">Craft Billing</h1>
                    <p className="mt-1 text-slate-300">Professional ISP Dashboard</p>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    {cards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <div key={card.label} className="rounded-3xl bg-white p-6 shadow">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-bold text-slate-500">{card.label}</p>
                                    <Icon className="h-6 w-6 text-slate-500" />
                                </div>

                                <p className="mt-3 text-2xl font-black text-slate-950">
                                    {card.value}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <RevenueChart data={last7Days} />
                    <PackageChart data={packageChartData} />
                </div>
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="rounded-3xl bg-white p-6 shadow">
                        <h2 className="text-xl font-black text-slate-950">Recent Payments</h2>

                        <div className="mt-4 space-y-3">
                            {recentPaidPayments.map((p) => (
                                <div key={p.id} className="rounded-2xl bg-slate-100 p-4">
                                    <p className="font-bold">{p.phone}</p>
                                    <p className="text-sm text-slate-600">
                                        KES {p.amount} • {p.status}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow">
                        <h2 className="text-xl font-black text-slate-950">Recent Sessions</h2>

                        <div className="mt-4 space-y-3">
                            {recentSessions.map((s) => (
                                <div key={s.id} className="rounded-2xl bg-slate-100 p-4">
                                    <p className="font-bold">{s.customer.phone}</p>
                                    <p className="text-sm text-slate-600">
                                        {s.activationStatus} • Expires {new Date(s.expiresAt).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-6 rounded-3xl bg-white p-6 shadow">
                    <h2 className="text-xl font-black text-slate-950">Quick Actions</h2>

                    <div className="mt-4 flex flex-wrap gap-3">
                        <a
                            href="/admin/sessions/new"
                            className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950"
                        >
                            Create Manual Session
                        </a>

                        <a
                            href="/"
                            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
                        >
                            Customer Portal
                        </a>

                        <a
                            href="/admin/reports"
                            className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 ring-1 ring-slate-200"
                        >
                            View Reports
                        </a>
                    </div>
                </div>
            </div>
        </main>
    );
}