"use client";

import { Upload } from "lucide-react";

interface PageFileDropOverlayProps {
  isDragActive: boolean;
  message: string;
  subtitle?: string;
}

export function PageFileDropOverlay({
  isDragActive,
  message,
  subtitle,
}: PageFileDropOverlayProps) {
  if (!isDragActive) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="m-8 flex h-full w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary">
        <Upload className="mb-4 h-12 w-12 text-primary" />
        <p className="text-lg font-medium text-foreground">{message}</p>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
