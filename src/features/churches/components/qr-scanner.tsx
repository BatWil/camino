"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
}
type BarcodeDetectorCtor = new (opts: { formats: string[] }) => BarcodeDetectorLike;

/**
 * Camera QR scanner for the church code. Uses the native BarcodeDetector when the
 * WebView/browser has it, otherwise lazily loads jsQR. Works on web (HTTPS/localhost),
 * PWA and inside Capacitor (CAMERA permission). Nothing is recorded or uploaded.
 */
export function QrScanner({ onResult, onClose }: { onResult: (text: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let frame = 0;
    let stopped = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Este dispositivo no permite usar la cámara aquí. Escribe el código de tu iglesia.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      } catch {
        setError("Necesitamos permiso de cámara para escanear. También puedes escribir el código.");
        return;
      }
      const video = videoRef.current;
      if (!video || stopped) return;
      video.srcObject = stream;
      await video.play().catch(() => {});

      const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
      const detector = Detector ? new Detector({ formats: ["qr_code"] }) : null;
      const jsQR = detector ? null : (await import("jsqr")).default;

      const tick = async () => {
        if (stopped || !video.videoWidth) {
          frame = requestAnimationFrame(tick);
          return;
        }
        let text: string | null = null;
        if (detector) {
          const codes = await detector.detect(video).catch(() => []);
          text = codes[0]?.rawValue ?? null;
        } else if (jsQR && ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          text = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" })?.data ?? null;
        }
        if (text && !stopped) {
          onResultRef.current(text);
          return;
        }
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    void start();
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Escanear código QR"
      className="fixed inset-0 z-[60] flex flex-col bg-ink text-paper"
    >
      <div className="pt-safe flex items-center justify-between px-5 py-3">
        <span className="eyebrow text-lime">Escanear QR</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="flex size-10 items-center justify-center rounded-full bg-white/10"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <div className="relative mx-5 flex-1 overflow-hidden rounded-[30px] bg-black">
        <video ref={videoRef} className="size-full object-cover" playsInline muted />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
          <div className="size-56 rounded-[26px] border-4 border-lime/90" />
        </div>
      </div>
      <div className="pb-safe flex flex-col gap-3 px-6 py-6">
        <p className="m-0 text-center text-[15px] text-paper/80" role={error ? "alert" : undefined}>
          {error ?? "Apunta al código QR de tu iglesia."}
        </p>
        {error ? (
          <Button variant="lime" size="md" block onClick={onClose}>
            Escribir el código
          </Button>
        ) : null}
      </div>
    </div>
  );
}
