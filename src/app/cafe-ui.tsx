"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
export function Modal({
  title,
  close,
  children,
  wide = false,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const old = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const els = ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input,select,textarea,a[href],[tabindex="0"]',
        );
        if (!els?.length) return;
        const first = els[0],
          last = els[els.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      old?.focus();
    };
  }, [close]);
  return (
    <div
      className="scrim"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <motion.div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={"modal " + (wide ? "wide" : "")}
        initial={{ opacity: 0, y: reduced ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <header>
          <h2>{title}</h2>
          <button onClick={close} aria-label="Close">
            <X size={20} />
          </button>
        </header>
        {children}
      </motion.div>
    </div>
  );
}
export function Scanner({ onScan }: { onScan: (value: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let stopped = false;
    let scanner: import("qr-scanner").default | undefined;
    import("qr-scanner").then(async ({ default: QR }) => {
      if (stopped || !video.current) return;
      scanner = new QR(video.current, (r) => onScan(r.data), {
        highlightScanRegion: true,
      });
      try {
        await scanner.start();
      } catch {
        setError("Camera unavailable. Upload a photo of the QR instead.");
      }
    });
    return () => {
      stopped = true;
      scanner?.destroy();
    };
  }, [onScan]);
  return (
    <div className="stack">
      <video
        ref={video}
        style={{ width: "100%", borderRadius: 12 }}
        playsInline
        muted
      />
      <p>{error || "Point your camera at the QR on your table."}</p>
      <label>
        Or choose a QR photo
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const { default: QR } = await import("qr-scanner");
              const result = await QR.scanImage(file, {
                returnDetailedScanResult: true,
              });
              onScan(result.data);
            } catch {
              setError("No QR found. Try a clearer photo.");
            }
          }}
        />
      </label>
    </div>
  );
}
