import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function updatePackages(formData: FormData) {
    "use server";

    const ids = formData.getAll("id").map(String);

    for (const id of ids) {
        await prisma.internetPackage.update({
            where: { id },
            data: {
                name: String(formData.get(`name-${id}`) || ""),
                price: Number(formData.get(`price-${id}`) || 0),
                durationMin: Number(formData.get(`durationMin-${id}`) || 0),
                speedLimit: String(formData.get(`speedLimit-${id}`) || "default"),
                isFreeTrial: formData.get(`isFreeTrial-${id}`) === "on",
                active: formData.get(`active-${id}`) === "on",
            },
        });
    }

    redirect("/admin/packages?saved=1");
}

type Props = {
    searchParams: Promise<{
        saved?: string;
    }>;
};

function formatDuration(minutes: number) {
    if (minutes < 60) return `${minutes} min`;
    if (minutes % 1440 === 0) return `${minutes / 1440} day(s)`;
    if (minutes % 60 === 0) return `${minutes / 60} hour(s)`;
    return `${minutes} min`;
}

export default async function AdminPackagesPage({ searchParams }: Props) {
    const params = await searchParams;

    const packages = await prisma.internetPackage.findMany({
        orderBy: [{ price: "asc" }, { durationMin: "asc" }],
    });

    return (
        <main className="p-6">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 rounded-3xl bg-slate-950 p-6 text-white">
                    <h1 className="text-3xl font-black">Craft Billing</h1>
                    <p className="mt-1 text-slate-300">Package Management</p>
                </div>

                {params.saved && (
                    <div className="mb-4 rounded-2xl bg-emerald-100 p-4 text-sm font-black text-emerald-700">
                        Packages saved successfully.
                    </div>
                )}

                <div className="mb-6 rounded-3xl bg-white p-5 shadow">
                    <h2 className="text-xl font-black text-slate-950">
                        MikroTik Profiles
                    </h2>
                    <p className="mt-2 text-sm font-bold text-slate-500">
                        Make sure these profiles exist in MikroTik: trial, daily, weekly,
                        monthly.
                    </p>

                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                        <div className="rounded-2xl bg-slate-100 p-4">
                            <p className="font-black">trial</p>
                            <p className="text-sm text-slate-500">1M/1M</p>
                        </div>

                        <div className="rounded-2xl bg-slate-100 p-4">
                            <p className="font-black">daily</p>
                            <p className="text-sm text-slate-500">3M/3M</p>
                        </div>

                        <div className="rounded-2xl bg-slate-100 p-4">
                            <p className="font-black">weekly</p>
                            <p className="text-sm text-slate-500">5M/5M</p>
                        </div>

                        <div className="rounded-2xl bg-slate-100 p-4">
                            <p className="font-black">monthly</p>
                            <p className="text-sm text-slate-500">10M/10M</p>
                        </div>
                    </div>
                </div>

                <form action={updatePackages} className="space-y-4">
                    {packages.map((pkg) => (
                        <div key={pkg.id} className="rounded-3xl bg-white p-5 shadow">
                            <input type="hidden" name="id" value={pkg.id} />

                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-black text-slate-950">
                                        {pkg.name}
                                    </h2>
                                    <p className="text-sm font-bold text-slate-500">
                                        {pkg.price === 0 ? "FREE" : `KES ${pkg.price}`} •{" "}
                                        {formatDuration(pkg.durationMin)} • Profile:{" "}
                                        {pkg.speedLimit}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {pkg.isFreeTrial && (
                                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                                            FREE TRIAL
                                        </span>
                                    )}

                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-black ${pkg.active
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-red-100 text-red-700"
                                            }`}
                                    >
                                        {pkg.active ? "ACTIVE" : "INACTIVE"}
                                    </span>
                                </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-6">
                                <div>
                                    <label className="text-xs font-black text-slate-500">
                                        Name
                                    </label>
                                    <input
                                        name={`name-${pkg.id}`}
                                        defaultValue={pkg.name}
                                        className="mt-1 w-full rounded-xl border px-3 py-2"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-black text-slate-500">
                                        Price
                                    </label>
                                    <input
                                        name={`price-${pkg.id}`}
                                        type="number"
                                        defaultValue={pkg.price}
                                        className="mt-1 w-full rounded-xl border px-3 py-2"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-black text-slate-500">
                                        Duration Min
                                    </label>
                                    <input
                                        name={`durationMin-${pkg.id}`}
                                        type="number"
                                        defaultValue={pkg.durationMin}
                                        className="mt-1 w-full rounded-xl border px-3 py-2"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-black text-slate-500">
                                        MikroTik Profile
                                    </label>
                                    <select
                                        name={`speedLimit-${pkg.id}`}
                                        defaultValue={pkg.speedLimit}
                                        className="mt-1 w-full rounded-xl border px-3 py-2"
                                    >
                                        <option value="trial">trial - 1M/1M</option>
                                        <option value="daily">daily - 3M/3M</option>
                                        <option value="weekly">weekly - 5M/5M</option>
                                        <option value="monthly">monthly - 10M/10M</option>
                                        <option value="default">default</option>
                                    </select>
                                </div>

                                <label className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold">
                                    <input
                                        name={`isFreeTrial-${pkg.id}`}
                                        type="checkbox"
                                        defaultChecked={pkg.isFreeTrial}
                                    />
                                    Free Trial
                                </label>

                                <label className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold">
                                    <input
                                        name={`active-${pkg.id}`}
                                        type="checkbox"
                                        defaultChecked={pkg.active}
                                    />
                                    Active
                                </label>
                            </div>
                        </div>
                    ))}

                    <button className="sticky bottom-6 w-full cursor-pointer rounded-2xl bg-emerald-500 px-4 py-4 text-base font-black text-slate-950 shadow-lg">
                        Save All Packages
                    </button>
                </form>

                <div className="mt-5 flex gap-3">
                    <a href="/admin" className="text-sm font-bold underline">
                        Dashboard
                    </a>
                    <a href="/" className="text-sm font-bold underline">
                        Customer Portal
                    </a>
                </div>
            </div>
        </main>
    );
}