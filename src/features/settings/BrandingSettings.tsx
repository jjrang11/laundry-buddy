"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";
import { updateShopName, updateLogoUrl } from "./branding.actions";
import type { BrandingActionState } from "./branding.actions";
import type { ShopBranding } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Upload, X, ImageIcon } from "lucide-react";

interface BrandingSettingsProps {
  initialBranding: ShopBranding;
}

export function BrandingSettings({ initialBranding }: BrandingSettingsProps) {
  const router = useRouter();

  // Zone A — Shop Name
  const [shopName, setShopName] = useState(initialBranding.shop_name ?? "");
  const [state, formAction, isPending] = useActionState<
    BrandingActionState,
    FormData
  >(updateShopName, null);

  useEffect(() => {
    setShopName(initialBranding.shop_name ?? "");
  }, [initialBranding.shop_name]);

  useEffect(() => {
    if (!state) return;
    if ("success" in state) toast.success("Shop name updated.");
    if ("error" in state) toast.error(state.error);
  }, [state]);

  // Zone B — Logo Upload
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(
    initialBranding.logo_url
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedFileRef = useRef<File | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2 MB.");
      e.target.value = "";
      return;
    }

    selectedFileRef.current = file;
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleCancel() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    selectedFileRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpload() {
    const file = selectedFileRef.current;
    if (!file) return;

    setIsUploading(true);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const sanitizedFilename = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, "-");

    const path = `logos/${Date.now()}-${sanitizedFilename}`;

    const { error: uploadError } = await supabase.storage
      .from("shop-assets")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      toast.error("Upload failed.");
      setIsUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("shop-assets")
      .getPublicUrl(path);

    const publicUrl = urlData.publicUrl;

    const result = await updateLogoUrl(publicUrl);

    if (result && "error" in result) {
      toast.error(result.error);
      setIsUploading(false);
      return;
    }

    toast.success("Logo updated.");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setCurrentLogoUrl(publicUrl);
    setPreviewUrl(null);
    selectedFileRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
    router.refresh();

    setIsUploading(false);
  }

  async function handleRemove() {
    const result = await updateLogoUrl(null);
    if (result && "error" in result) {
      toast.error(result.error);
      return;
    }
    setCurrentLogoUrl(null);
    toast.success("Logo removed.");
    router.refresh();
  }

  return (
    <>
      {/* Zone A — Shop Name */}
      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="shop_name">Shop Name</Label>
          <div className="flex gap-2">
            <Input
              id="shop_name"
              name="shop_name"
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              disabled={isPending}
              placeholder="e.g. Sunshine Laundry"
              className="max-w-[280px]"
            />
            <Button
              type="submit"
              disabled={isPending}
              size="sm"
              className="gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                "Update Name"
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            Displayed in the header across the dashboard.
          </p>
        </div>
      </form>

      <Separator className="my-4" />

      {/* Zone B — Logo Upload */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Shop Logo</Label>
          <p className="text-xs text-gray-400">PNG, JPG, or WebP. Max 2 MB.</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex items-center gap-3">
          {/* Logo preview area */}
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Logo preview"
              className="w-16 h-16 rounded-lg object-cover border border-gray-200"
            />
          ) : currentLogoUrl ? (
            <img
              src={currentLogoUrl}
              alt="Shop logo"
              className="w-16 h-16 rounded-lg object-cover border border-gray-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {previewUrl ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  disabled={isUploading}
                  onClick={handleUpload}
                  className="gap-1.5"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" /> Save Logo
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isUploading}
                  onClick={handleCancel}
                  className="gap-1.5"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </>
            ) : currentLogoUrl ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1.5"
                >
                  <Upload className="h-4 w-4" />
                  Replace Logo
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleRemove}
                  className="gap-1.5 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                  Remove
                </Button>
              </>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5"
              >
                <Upload className="h-4 w-4" />
                Upload Logo
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
