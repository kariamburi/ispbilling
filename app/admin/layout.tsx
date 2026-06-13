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
                <div className="border-b bg-white px-6 py-4">
                    <div className="mx-auto flex max-w-6xl items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-500">
                                Craft Billing
                            </p>
                            <h1 className="text-xl font-black text-slate-950">
                                ISP Hotspot Manager
                            </h1>
                        </div>

                        <a
                            href="/"
                            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white"
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