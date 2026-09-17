import { login } from "./actions";

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold">J.B. Pressure Washing</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your ops app.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
            {error}
          </div>
        )}

        <form action={login} className="space-y-4">
          <label className="block text-sm">
            <span className="text-slate-600 font-medium">Email</span>
            <input
              name="email"
              type="email"
              required
              autoFocus
              className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600 font-medium">Password</span>
            <input
              name="password"
              type="password"
              required
              className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </label>
          <button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg py-2 text-sm transition"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
