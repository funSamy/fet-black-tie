"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import Image from "next/image";

interface Props {
  value: string;
  size?: number;
}

export function QRDisplay({ value, size = 240 }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark: "#0A0A0E", light: "#FFFFFF" },
      errorCorrectionLevel: "H",
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => void 0);
    return () => {
      active = false;
    };
  }, [value, size]);

  return (
    <div
      className="relative inline-block rounded-xl bg-white p-3 shadow-gold ring-gold"
      style={{ animation: "scale-in 0.5s ease-out" }}
    >
      {dataUrl ? (
        <Image src={dataUrl} alt="Your ticket QR code" width={size} height={size} className="block" />
      ) : (
        <div style={{ width: size, height: size }} className="animate-pulse rounded bg-muted" />
      )}
    </div>
  );
}
