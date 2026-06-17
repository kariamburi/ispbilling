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
            <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3 text-white md:hidden">
                <div>
                    <p className="text-xs font-bold text-emerald-300">Craft Billing</p>
                    <h1 className="text-sm font-black">Admin Menu</h1>
                </div>

                <button
                    onClick={() => setOpen(!open)}
                    className="rounded-2xl bg-white/10 p-3 text-white"
                >
                    {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            <aside
                className={`z-50 bg-[#061b13] p-4 text-white md:sticky md:top-0 md:block md:min-h-screen md:w-72 ${open ? "block" : "hidden"
                    }`}
            >
                <div className="mb-6 rounded-[2rem] bg-gradient-to-br from-emerald-400 via-emerald-500 to-lime-400 p-5 text-slate-950 shadow-xl">
                    <p className="text-xs font-black uppercase tracking-[0.25em]">
                        Admin
                    </p>
                    <h1 className="mt-2 text-2xl font-black">Craft Billing</h1>
                    <p className="mt-1 text-xs font-bold">ISP Hotspot Manager</p>
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
                                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${active
                                    ? "bg-emerald-500 text-slate-950 shadow-lg"
                                    : "text-slate-200 hover:bg-white/10 hover:text-white"
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                                {link.label}
                            </a>
                        );
                    })}
                </nav>

                <form action="/api/auth/logout" method="POST" className="mt-6">
                    <button className="w-full cursor-pointer rounded-2xl bg-red-500 px-4 py-3 text-sm font-black text-white transition hover:bg-red-600">
                        Logout
                    </button>
                </form>
            </aside>
        </>
    );
}