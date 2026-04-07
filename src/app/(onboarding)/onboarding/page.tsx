import { redirect } from "next/navigation";
import { getUser } from "@/features/auth/auth.actions";
import { getUserShopId } from "@/lib/auth-utils";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const shopId = getUserShopId(user);
  if (shopId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#f7f6f3] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm px-8 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome to Laundry Buddy
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Set up your shop to get started.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}
