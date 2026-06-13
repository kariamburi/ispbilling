import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";

type Props = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;

  const token = (await cookies()).get("craft_token")?.value;

  if (token) {
    try {
      await verifyToken(token);
      redirect("/admin");
    } catch { }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <form
        action="/api/auth/login"
        method="POST"
        className="w-full max-w-md rounded-3xl bg-white p-6"
      >
        <h1 className="text-3xl font-black">Craft Billing</h1>

        {params.error === "invalid" && (
          <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">
            Invalid email or password.
          </p>
        )}

        <div className="mt-5">
          <input
            name="email"
            placeholder="Email"
            required
            className="w-full rounded-2xl border px-4 py-3"
          />
        </div>

        <div className="mt-3">
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
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