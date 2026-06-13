import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";

export default async function LoginPage() {
  const token = (await cookies()).get("craft_token")?.value;

  if (token) {
    try {
      await verifyToken(token);
      redirect("/admin");
    } catch { }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950">
      <form
        action="/api/auth/login"
        method="POST"
        className="w-full max-w-md rounded-3xl bg-white p-6"
      >
        <h1 className="text-3xl font-black">
          Craft Billing
        </h1>

        <div className="mt-5">
          <input
            name="email"
            placeholder="Email"
            className="w-full rounded-2xl border px-4 py-3"
          />
        </div>

        <div className="mt-3">
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full rounded-2xl border px-4 py-3"
          />
        </div>

        <button className="mt-5 w-full cursor-pointer rounded-2xl bg-emerald-500 px-4 py-3 font-black">
          Login
        </button>
      </form>
    </main>
  );
}