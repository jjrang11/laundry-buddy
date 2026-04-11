import { LoginForm } from "@/features/auth/LoginForm";
import { WashingMachine } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="flex flex-col items-center mb-7 gap-3">
          <div className="flex items-center justify-center w-13 h-13 rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-900/50">
            <WashingMachine className="h-7 w-7" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Laundry Buddy
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Staff Operations Dashboard
            </p>
          </div>
        </div>

        {/* Form card — white on dark bg for clear contrast */}
        <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/10 p-6">
          <LoginForm />
        </div>

        <p className="text-center text-xs text-slate-600 mt-5">
          Contact your manager if you need access.
        </p>
      </div>
    </div>
  );
}
