"use client";

import { useRef, useState } from "react";
import { objectPosition } from "@/lib/appearance";

type Shape = "circle" | "banner" | "portrait";

export function FramedImage({
  src,
  x = 50,
  y = 50,
  alt = "",
  shape = "portrait",
  className = "",
}: {
  src?: string | null;
  x?: number;
  y?: number;
  alt?: string;
  shape?: Shape;
  className?: string;
}) {
  const frame =
    shape === "circle" ? "aspect-square rounded-full" : shape === "banner" ? "aspect-[16/6]" : "aspect-[4/5]";
  if (!src) {
    return <div className={`${frame} bg-[color:var(--surface)] ${className}`} />;
  }
  return (
    <div className={`${frame} overflow-hidden bg-[color:var(--surface)] ${className}`}>
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        style={{ objectPosition: objectPosition(x, y) }}
      />
    </div>
  );
}

export function ImageRepositioner({
  src,
  x,
  y,
  shape = "circle",
  onChange,
  onUpload,
  label,
  hint,
}: {
  src?: string | null;
  x: number;
  y: number;
  shape?: Shape;
  onChange: (next: { x: number; y: number }) => void;
  onUpload: (file: File) => Promise<void>;
  label: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const frame =
    shape === "circle"
      ? "h-36 w-36 rounded-full"
      : shape === "banner"
        ? "aspect-[16/6] w-full"
        : "aspect-[4/5] w-full max-w-xs";

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      await onUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload.");
    } finally {
      setBusy(false);
    }
  }

  function start(clientX: number, clientY: number) {
    drag.current = { px: clientX, py: clientY, x, y };
  }

  function move(clientX: number, clientY: number) {
    if (!drag.current) return;
    onChange({
      x: Math.min(100, Math.max(0, drag.current.x + (drag.current.px - clientX) / 2)),
      y: Math.min(100, Math.max(0, drag.current.y + (drag.current.py - clientY) / 2)),
    });
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">{label}</p>
          {hint && <p className="mt-1 text-xs text-[color:var(--muted)]">{hint}</p>}
        </div>
        <button type="button" className="button button-quiet" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? "Uploading…" : src ? "Replace photo" : "Upload photo"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => void pick(e.target.files?.[0])}
        />
      </div>

      <div
        className={`${frame} relative overflow-hidden border hairline bg-[color:var(--surface)] ${
          src ? "cursor-grab active:cursor-grabbing" : ""
        }`}
        onPointerDown={(e) => {
          if (!src) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          start(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => move(e.clientX, e.clientY)}
        onPointerUp={() => {
          drag.current = null;
        }}
      >
        {src ? (
          <img
            src={src}
            alt=""
            draggable={false}
            className="pointer-events-none h-full w-full select-none object-cover"
            style={{ objectPosition: objectPosition(x, y) }}
          />
        ) : (
          <p className="grid h-full place-items-center px-4 text-center text-xs text-[color:var(--muted)]">
            No photo yet
          </p>
        )}
      </div>

      {src && (
        <p className="text-xs text-[color:var(--muted)]">
          Drag the photo to centre the bit you want. It is cropped to this frame.
        </p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export async function uploadMedia(kind: "avatar" | "banner" | "product", file: File) {
  const form = new FormData();
  form.set("file", file);
  form.set("kind", kind);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error || "Upload failed.");
  return data.url;
}
