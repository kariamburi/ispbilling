import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-100 md:flex">
            <AdminSidebar />

            <section className="flex-1">
                <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur md:px-6">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-600">
                                Craft Billing
                            </p>
                            <h1 className="text-xl font-black text-slate-950">
                                ISP Hotspot Manager
                            </h1>
                        </div>

                        <a
                            href="/"
                            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-600"
                        >
                            Customer Portal
                        </a>
                    </div>
                </div>

                {children}
            </section>
        </div>
    );
}