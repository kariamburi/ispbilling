import { prisma } from "@/lib/prisma";
import RevenueChart from "./components/RevenueChart";
import PackageChart from "./components/PackageChart";
import {
    AlertTriangle,
    Banknote,
    CalendarDays,
    CheckCircle2,
    Clock,
    CreditCard,
    Router,
    Users,
    Wifi,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatMoney(amount: number) {
    return `KES ${amount.toLocaleString("en-KE")}`;
}

function startOfDay(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

export default async function AdminDashboardPage() {
    const now = new Date();
    const today = startOfDay(now);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
        revenueTodayAgg,
        revenueMonthAgg,
        paidToday,
        pendingToday,
        failedToday,
        activeSessions,
        expiredSessions,
        totalCustomers,
        failedActivations,
        activeRouter,
        recentPayments,
        recentSessions,
        packages,
        recent7DayPayments,
    ] = await Promise.all([
        prisma.payment.aggregate({
            where: { status: "PAID", createdAt: { gte: today } },
            _sum: { amount: true },
        }),
        prisma.payment.aggregate({
            where: { status: "PAID", createdAt: { gte: monthStart } },
            _sum: { amount: true },
        }),
        prisma.payment.count({
            where: { status: "PAID", createdAt: { gte: today } },
        }),
        prisma.payment.count({
            where: { status: "PENDING", createdAt: { gte: today } },
        }),
        prisma.payment.count({
            where: { status: "FAILED", createdAt: { gte: today } },
        }),
        prisma.internetSession.count({
            where: { active: true, expiresAt: { gt: now } },
        }),
        prisma.internetSession.count({
            where: { expiresAt: { lte: now } },
        }),
        prisma.customer.count(),
        prisma.internetSession.count({
            where: { activationStatus: "FAILED" },
        }),
        prisma.router.findFirst({
            where: { active: true },
            orderBy: { createdAt: "desc" },
        }),
        prisma.payment.findMany({
            orderBy: { createdAt: "desc" },
            take: 8,
        }),
        prisma.internetSession.findMany({
            orderBy: { createdAt: "desc" },
            take: 8,
            include: { customer: true },
        }),
        prisma.internetPackage.findMany(),
        prisma.payment.findMany({
            where: { createdAt: { gte: sevenDaysAgo } },
        }),
    ]);

    const revenueToday = revenueTodayAgg._sum.amount || 0;
    const monthRevenue = revenueMonthAgg._sum.amount || 0;

    const last7Days = Array.from({ length: 7 }).map((_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - index));
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayPayments = recent7DayPayments.filter(
            (p) => p.status === "PAID" && p.createdAt >= date && p.createdAt < nextDate
        );

        return {
            day: date.toLocaleDateString("en-KE", { weekday: "short" }),
            revenue: dayPayments.reduce((sum, p) => sum + p.amount, 0),
        };
    });

    const packageChartData = packages.map((pkg) => {
        const sales = recent7DayPayments.filter(
            (p) => p.status === "PAID" && p.packageId === pkg.id
        ).length;

        return {
            name: pkg.name,
            sales,
        };
    });

    const cards = [
        {
            label: "Revenue Today",
            value: formatMoney(revenueToday),
            hint: "Paid payments today",
            icon: Banknote,
            tone: "emerald",
        },
        {
            label: "Month Revenue",
            value: formatMoney(monthRevenue),
            hint: "Paid payments this month",
            icon: CalendarDays,
            tone: "emerald",
        },
        {
            label: "Paid Today",
            value: paidToday,
            hint: "Successful payments",
            icon: CheckCircle2,
            tone: "emerald",
        },
        {
            label: "Pending Today",
            value: pendingToday,
            hint: "Waiting for M-Pesa callback",
            icon: Clock,
            tone: "amber",
        },
        {
            label: "Failed Today",
            value: failedToday,
            hint: "Failed/cancelled payments",
            icon: CreditCard,
            tone: "red",
        },
        {
            label: "Active Sessions",
            value: activeSessions,
            hint: "Not expired",
            icon: Wifi,
            tone: "emerald",
        },
        {
            label: "Expired Sessions",
            value: expiredSessions,
            hint: "Past expiry time",
            icon: Clock,
            tone: "slate",
        },
        {
            label: "Customers",
            value: totalCustomers,
            hint: "Registered phone numbers",
            icon: Users,
            tone: "blue",
        },
        {
            label: "Failed Activations",
            value: failedActivations,
            hint: "Needs attention",
            icon: AlertTriangle,
            tone: "red",
        },
        {
            label: "Router",
            value: activeRouter ? "Online Setup" : "Not Set",
            hint: activeRouter ? activeRouter.host : "No active router",
            icon: Router,
            tone: activeRouter ? "emerald" : "red",
        },
    ];

    const toneClasses: Record<string, string> = {
        emerald: "bg-emerald-50 text-emerald-700",
        amber: "bg-amber-50 text-amber-700",
        red: "bg-red-50 text-red-700",
        blue: "bg-blue-50 text-blue-700",
        slate: "bg-slate-100 text-slate-700",
    };

    return (
        <main className="p-4 md:p-6">
            <div className="mx-auto max-w-7xl">
                <section className="mb-6 overflow-hidden rounded-[2rem] bg-[#061b13] p-6 text-white shadow-xl">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-300">
                                Dashboard
                            </p>
                            <h1 className="mt-2 text-3xl font-black">
                                Professional ISP Dashboard
                            </h1>
                            <p className="mt-2 text-sm font-medium text-slate-300">
                                Monitor payments, customers, sessions and router activity.
                            </p>
                        </div>

                        <div className="rounded-3xl bg-white/10 p-4">
                            <p className="text-xs font-bold text-slate-300">Today Revenue</p>
                            <p className="mt-1 text-2xl font-black text-emerald-300">
                                {formatMoney(revenueToday)}
                            </p>
                        </div>
                    </div>
                </section>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {cards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <div
                                key={card.label}
                                className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-black text-slate-500">
                                        {card.label}
                                    </p>
                                    <div
                                        className={`rounded-2xl p-2 ${toneClasses[card.tone] || toneClasses.slate
                                            }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </div>
                                </div>

                                <p className="mt-4 text-2xl font-black text-slate-950">
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
                    <RevenueChart data={last7Days} />
                    <PackageChart data={packageChartData} />
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-950">
                                Recent Payments
                            </h2>

                            <a
                                href="/admin/payments"
                                className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-emerald-100 hover:text-emerald-700"
                            >
                                View all
                            </a>
                        </div>

                        <div className="mt-4 space-y-3">
                            {recentPayments.map((p) => (
                                <div
                                    key={p.id}
                                    className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4"
                                >
                                    <div>
                                        <p className="font-black text-slate-950">{p.phone}</p>
                                        <p className="text-sm font-semibold text-slate-600">
                                            {formatMoney(p.amount)}
                                        </p>
                                        {p.mpesaCode && (
                                            <p className="text-xs font-bold text-slate-500">
                                                {p.mpesaCode}
                                            </p>
                                        )}
                                    </div>

                                    <div className="text-right">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-black ${p.status === "PAID"
                                                ? "bg-emerald-100 text-emerald-700"
                                                : p.status === "FAILED"
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-amber-100 text-amber-700"
                                                }`}
                                        >
                                            {p.status}
                                        </span>

                                        <p className="mt-2 text-xs font-bold text-slate-500">
                                            {new Date(p.createdAt).toLocaleString("en-KE")}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {recentPayments.length === 0 && (
                                <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
                                    No payments yet.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-950">
                                Recent Sessions
                            </h2>

                            <a
                                href="/admin/sessions"
                                className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-emerald-100 hover:text-emerald-700"
                            >
                                View all
                            </a>
                        </div>

                        <div className="mt-4 space-y-3">
                            {recentSessions.map((s) => {
                                const expired = s.expiresAt <= now;

                                return (
                                    <div key={s.id} className="rounded-2xl bg-slate-50 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-black text-slate-950">
                                                    {s.customer.phone}
                                                </p>
                                                <p className="text-sm font-semibold text-slate-600">
                                                    {s.username || "-"}
                                                </p>
                                            </div>

                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-black ${expired
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-emerald-100 text-emerald-700"
                                                    }`}
                                            >
                                                {expired ? "EXPIRED" : "ACTIVE"}
                                            </span>
                                        </div>

                                        <p className="mt-2 text-sm font-semibold text-slate-600">
                                            {s.activationStatus} • Expires{" "}
                                            {new Date(s.expiresAt).toLocaleString("en-KE")}
                                        </p>

                                        {s.activationError && (
                                            <p className="mt-2 rounded-xl bg-red-50 p-2 text-xs font-bold text-red-600">
                                                {s.activationError}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}

                            {recentSessions.length === 0 && (
                                <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
                                    No sessions yet.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-xl font-black text-slate-950">Quick Actions</h2>

                    <div className="mt-4 flex flex-wrap gap-3">
                        <a
                            href="/admin/sessions/new"
                            className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
                        >
                            Create Manual Session
                        </a>

                        <a
                            href="/"
                            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-600"
                        >
                            Customer Portal
                        </a>

                        <a
                            href="/admin/payments"
                            className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 ring-1 ring-slate-200 transition hover:bg-slate-50"
                        >
                            View Payments
                        </a>

                        <a
                            href="/admin/reports"
                            className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 ring-1 ring-slate-200 transition hover:bg-slate-50"
                        >
                            View Reports
                        </a>

                        <a
                            href="/admin/router/monitor"
                            className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 ring-1 ring-slate-200 transition hover:bg-slate-50"
                        >
                            Router Monitor
                        </a>
                    </div>
                </div>
            </div>
        </main>
    );
}