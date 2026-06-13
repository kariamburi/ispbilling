"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
    BarChart3,
    CreditCard,
    Gauge,
    Menu,
    MessageSquare,
    Package,
    Rocket,
    Router,
    Settings,
    Users,
    Wifi,
    X,
} from "lucide-react";

export default function AdminSidebar() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const links = [
        { href: "/admin", label: "Dashboard", icon: Gauge },
        { href: "/admin/payments", label: "Payments", icon: CreditCard },
        { href: "/admin/sessions", label: "Sessions", icon: Wifi },
        { href: "/admin/customers", label: "Customers", icon: Users },
        { href: "/admin/packages", label: "Packages", icon: Package },
        { href: "/admin/router", label: "Router", icon: Router },
        { href: "/admin/router/monitor", label: "Monitor", icon: Gauge },
        { href: "/admin/reports", label: "Reports", icon: BarChart3 },
        { href: "/admin/sms", label: "SMS Logs", icon: MessageSquare },
        { href: "/admin/deployment", label: "Deployment", icon: Rocket },
        { href: "/admin/settings", label: "Settings", icon: Settings },
    ];

    return (
        <>
            <button
                onClick={() => setOpen(!open)}
                className="m-4 rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white md:hidden"
            >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <aside
                className={`bg-slate-950 p-4 text-white md:block md:min-h-screen md:w-64 ${open ? "block" : "hidden"
                    }`}
            >
                <div className="mb-6 rounded-3xl bg-emerald-500 p-4 text-slate-950">
                    <h1 className="text-xl font-black">Craft Billing</h1>
                    <p className="text-xs font-bold">ISP Hotspot Manager</p>
                </div>

                <nav className="space-y-2">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const active =
                            pathname === link.href ||
                            (link.href !== "/admin" && pathname.startsWith(link.href));

                        return (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={() => setOpen(false)}
                                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold ${active
                                    ? "bg-emerald-500 text-slate-950"
                                    : "text-slate-200 hover:bg-white/10"
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                                {link.label}
                            </a>
                        );
                    })}
                </nav>

                <form action="/api/auth/logout" method="POST" className="mt-6">
                    <button className="w-full rounded-2xl bg-red-500 px-4 py-3 text-sm font-bold text-white">
                        Logout
                    </button>
                </form>
            </aside>
        </>
    );
}