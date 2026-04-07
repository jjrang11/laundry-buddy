"use client";

import { useState, useTransition } from "react";
import { createShop } from "@/features/settings/shop.actions";
import { Loader2 } from "lucide-react";

export function OnboardingForm() {
  const [shopName, setShopName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createShop(shopName.trim());
      if (result && "error" in result) {
        setError(result.error);
      }
      // On success, createShop redirects to /login — no client-side nav needed
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="shop_name"
          className="block text-sm font-medium text-gray-700"
        >
          Shop Name
        </label>
        <input
          id="shop_name"
          type="text"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          disabled={isPending}
          placeholder="e.g. Sunshine Laundry"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:opacity-50"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || !shopName.trim()}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Creating Shop…
          </>
        ) : (
          "Create Shop"
        )}
      </button>
    </form>
  );
}
