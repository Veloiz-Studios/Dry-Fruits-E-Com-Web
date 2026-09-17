"use client";

import { useState } from "react";
import { uploadAdminImage } from "@/lib/admin.actions";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";

export function ImageUploader({ url, onChange }: { url: string; onChange: (url: string) => void }) {
    const [uploading, setUploading] = useState(false);

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (file.size > 5 * 1024 * 1024) return toast.error("File is too large (max 5MB)");
        if (!file.type.startsWith("image/")) return toast.error("Only image files are supported");

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const publicUrl = await uploadAdminImage(formData);
            onChange(publicUrl);
            toast.success("Image uploaded!");
        } catch (err: any) {
            toast.error(err.message || "Failed to upload image");
        } finally {
            setUploading(false);
            if (e.target) e.target.value = ''; // clear input
        }
    }

    return (
        <div className="flex flex-col gap-4">
            {url ? (
                <div className="relative group w-32 h-32 border editorial-rule rounded flex items-center justify-center overflow-hidden bg-secondary/10">
                    <img src={url} alt="Uploaded media" className="object-cover w-full h-full" />
                    <button
                        type="button"
                        onClick={() => onChange("")}
                        className="absolute inset-0 bg-background/80 items-center justify-center hidden group-hover:flex transition"
                    >
                        <X className="w-6 h-6 text-destructive" />
                    </button>
                    {uploading && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin" />
                        </div>
                    )}
                </div>
            ) : (
                <label className="relative w-32 h-32 border border-dashed editorial-rule flex flex-col items-center justify-center text-muted-foreground hover:bg-secondary/20 hover:text-ink-soft transition cursor-pointer bg-background">
                    {uploading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                        <>
                            <ImagePlus className="w-6 h-6 mb-2 opacity-50" />
                            <span className="text-xs uppercase tracking-widest text-center">Upload<br />Image</span>
                        </>
                    )}
                    <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" disabled={uploading} onChange={handleFile} />
                </label>
            )}
        </div>
    );
}
