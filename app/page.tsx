import { prisma } from "@/lib/prisma";
import LoadingLinkButton from "./LoadingLinkButton";
import LoginSubmitButton from "./LoginSubmitButton";

type Props = {
  searchParams: Promise<{
    error?: string;
    mac?: string;
    ip?: string;
    linkLogin?: string;
  }>;
};

function displaySpeed(profile: string | null) {
  if (profile === "trial") return "1M/1M";
  if (profile === "mini") return "1M/1M";
  if (profile === "daily") return "3M/3M";
  if (profile === "weekly") return "5M/5M";
  if (profile === "monthly") return "10M/10M";
  return profile || "Default";
}

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;

  const settings = await prisma.appSetting.findUnique({
    where: { id: "main" },
  });

  const packages = await prisma.internetPackage.findMany({
    where: { active: true },
    orderBy: { price: "asc" },
  });

  const activeSession = params.mac
    ? await prisma.internetSession.findFirst({
      where: {
        mac: params.mac,
        active: true,
        expiresAt: { gt: new Date() },
        activationStatus: "ACTIVATED",
        username: { not: null },
        password: { not: null },
      },
      orderBy: { expiresAt: "desc" },
      include: { customer: true },
    })
    : null;

  const errorMessage =
    params.error === "free_trial_used"
      ? "This phone number has already used the free trial."
      : params.error === "free_trial_device_used"
        ? "This device has already used the free trial."
        : params.error === "customer_blocked"
          ? "Your account has been blocked. Please contact support."
          : params.error === "missing_login"
            ? "Username and password are required."
            : params.error === "missing_phone"
              ? "Phone number is required."
              : params.error === "no_active_session"
                ? "No active session found for that phone number."
                : null;

  return (
    <main className="min-h-screen bg-[#061b13] text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">
              Internet Portal
            </p>
            <h1 className="mt-1 text-2xl font-black">
              {settings?.portalName || "CRAFT WIFI"}
            </h1>
          </div>
        </header>

        {errorMessage && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {errorMessage}
          </div>
        )}

        <section
          id="login-form"
          className="mb-6 scroll-mt-6 rounded-[2rem] border border-white/10 bg-white p-5 text-slate-950 shadow-xl"
        >
          {activeSession ? (
            <>
              <h2 className="text-lg font-black">Welcome Back</h2>

              <p className="mt-1 text-sm font-medium text-slate-500">
                We found an active internet session for this device.
              </p>

              <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                Active until{" "}
                {new Date(activeSession.expiresAt).toLocaleString("en-KE")}
              </div>

              <form action="/api/hotspot/login" method="POST" className="mt-4">
                <input type="hidden" name="username" value={activeSession.username || ""} />
                <input type="hidden" name="password" value={activeSession.password || ""} />
                <input type="hidden" name="mac" value={params.mac || ""} />
                <LoginSubmitButton label="Reconnect Internet" />
              </form>
            </>
          ) : (
            <>
              <h2 className="text-lg font-black">Already Have Access?</h2>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Enter your phone number and we will reconnect your active session.
              </p>

              <form action="/api/session/reconnect" method="POST" className="mt-4 space-y-3">
                <input
                  type="tel"
                  name="phone"
                  placeholder="07XXXXXXXX"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-emerald-500 focus:bg-white"
                />

                <input type="hidden" name="mac" value={params.mac || ""} />

                <LoginSubmitButton label="Reconnect Internet" />
              </form>
            </>
          )}
        </section>

        <section className="mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-black">Choose Package</h2>
            <p className="mt-1 text-sm text-slate-300">
              Select a package and pay securely.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {packages.map((pkg) => (
              <LoadingLinkButton
                key={pkg.id}
                href={`/pay?packageId=${pkg.id}${params.mac ? `&mac=${params.mac}` : ""}`}
                loadingText={pkg.price === 0 ? "Starting trial..." : "Opening payment..."}
                className="group block rounded-3xl border border-white/10 bg-white p-5 text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:shadow-2xl active:scale-[0.98]"
              >
                <div className="flex min-h-[120px] flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black">{pkg.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        Speed: {displaySpeed(pkg.speedLimit)}
                      </p>

                      {pkg.isFreeTrial && (
                        <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                          One-time free trial
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-right">
                      <p className="text-xs font-black text-emerald-700">
                        {pkg.price === 0 ? "TRIAL" : "KES"}
                      </p>
                      <p className="text-2xl font-black">
                        {pkg.price === 0 ? "FREE" : pkg.price}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white transition group-hover:bg-emerald-600">
                    {pkg.price === 0 ? "Start Free Trial" : "Buy Package"}
                  </div>
                </div>
              </LoadingLinkButton>
            ))}
          </div>
        </section>

        {settings?.whatsappPhone && (
          <LoadingLinkButton
            href={`https://wa.me/${settings.whatsappPhone.replace(/\D/g, "")}`}
            loadingText="Opening WhatsApp..."
            className="mb-6 block rounded-2xl border border-emerald-400/30 bg-white/10 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-white hover:text-slate-950"
          >
            Need help? Chat on WhatsApp
          </LoadingLinkButton>
        )}
      </div>
    </main>
  );
}