"use client";
import { useState } from "react";
import { Scanner, type IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { CheckCircle2, XCircle, AlertTriangle, Ticket, RotateCcw } from "lucide-react";
import { scanTicket, type ScanOutcome } from "@/lib/admin.actions";
import { Button } from "@/components/ui/button";

type ScanResult = ScanOutcome;

export function ScanPage() {
  const [busy, setBusy] = useState(false);
  const [paused, setPaused] = useState(false);
  const [last, setLast] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function parseSlug(raw: string): string | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    // Accept a raw slug, a /checkin/<slug> URL (what ticket QRs encode),
    // or a legacy ?qr=<slug> link.
    try {
      const u = new URL(trimmed);
      const checkin = u.pathname.match(/\/checkin\/([^/?#]+)/);
      if (checkin) return decodeURIComponent(checkin[1]);
      const m = u.pathname.match(/qr=([^/?&]+)/);
      if (m) return m[1];
      const qs = u.searchParams.get("qr");
      if (qs) return qs;
    } catch {
      /* not a url */
    }
    return trimmed;
  }

  async function handleDetect(codes: IDetectedBarcode[]) {
    if (busy || paused || codes.length === 0) return;
    const raw = codes[0].rawValue;
    const slug = parseSlug(raw);
    if (!slug) return;
    setBusy(true);
    setPaused(true);
    setError(null);
    try {
      const res = await scanTicket({ qrSlug: slug });
      if (!res.ok) throw new Error(res.error);
      setLast(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setBusy(false);
    }
  }

  function resume() {
    setLast(null);
    setError(null);
    setPaused(false);
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-3xl text-gradient-gold">Door scan</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Point camera at a guest's QR code. Each scan consumes one entry slot.
      </p>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-black aspect-square">
        {!paused ? (
          <Scanner
            onScan={handleDetect}
            onError={(e) => setError(e instanceof Error ? e.message : String(e))}
            constraints={{ facingMode: "environment" }}
            components={{ finder: true, torch: true }}
            styles={{ container: { width: "100%", height: "100%" } }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Paused
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {last && <ResultCard result={last} onContinue={resume} />}
    </div>
  );
}

function ResultCard({ result, onContinue }: { result: ScanResult; onContinue: () => void }) {
  if (result.outcome === "UNKNOWN") {
    return (
      <Card tone="error" icon={<XCircle className="h-6 w-6" />} title="Unknown ticket">
        <p className="text-sm">This QR code does not match any ticket.</p>
        <Button onClick={onContinue} className="mt-3 w-full">
          <RotateCcw className="mr-2 h-4 w-4" /> Scan next
        </Button>
      </Card>
    );
  }
  if (result.outcome === "UNPAID") {
    return (
      <Card tone="error" icon={<XCircle className="h-6 w-6" />} title="Payment not confirmed">
        <p className="text-sm">
          Buyer: <span className="font-medium">{result.buyerName}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Ask them to settle at the admin desk.</p>
        <Button onClick={onContinue} className="mt-3 w-full">
          Scan next
        </Button>
      </Card>
    );
  }
  // OK
  const duplicate = result.fullyUsed && !result.justFilled;
  if (duplicate) {
    return (
      <Card tone="warn" icon={<AlertTriangle className="h-6 w-6" />} title="Already fully used">
        <p className="text-sm">
          {result.buyerName} · {result.tierLabel}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {result.slotsUsed}/{result.slotsTotal} slots already consumed.
        </p>
        <Button onClick={onContinue} className="mt-3 w-full">
          Scan next
        </Button>
      </Card>
    );
  }
  return (
    <Card tone="ok" icon={<CheckCircle2 className="h-6 w-6" />} title="Admit guest">
      <p className="text-sm flex items-center gap-2">
        <Ticket className="h-4 w-4 text-gold" />
        <span className="font-medium">{result.buyerName}</span> · {result.tierLabel}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Slot {result.slotsUsed} of {result.slotsTotal} used.
      </p>
      <Button onClick={onContinue} className="mt-3 w-full">
        Scan next
      </Button>
    </Card>
  );
}

function Card({
  tone,
  icon,
  title,
  children,
}: {
  tone: "ok" | "warn" | "error";
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const cls =
    tone === "ok"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
      : tone === "warn"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
        : "border-rose-500/40 bg-rose-500/10 text-rose-100";
  return (
    <div className={`mt-4 rounded-2xl border p-4 ${cls}`}>
      <div className="flex items-center gap-2 font-display text-xl">
        {icon}
        {title}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
