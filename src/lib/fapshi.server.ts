// Server-only Fapshi client. NEVER import from client/route code directly.
// Always loaded via `await import(...)` inside a createServerFn handler or a server route.

const BASE = () => {
  const url = process.env.FAPSHI_BASE_URL;
  if (!url) {
    throw new Error(
      "FAPSHI_BASE_URL is required. Set it to https://live.fapshi.com for production or https://sandbox.fapshi.com for testing."
    );
  }
  return url;
};

function headers() {
  const apiuser = process.env.FAPSHI_API_USER;
  const apikey = process.env.FAPSHI_API_KEY;
  if (!apiuser || !apikey) {
    throw new Error("Fapshi credentials missing (FAPSHI_API_USER / FAPSHI_API_KEY).");
  }
  return {
    "Content-Type": "application/json",
    apiuser,
    apikey,
  };
}

export interface InitiatePayInput {
  amount: number; // integer XAF
  email: string;
  externalId: string;
  userId?: string;
  redirectUrl?: string;
  message?: string;
}

export interface InitiatePayResponse {
  message: string;
  link: string;
  transId: string;
  dateInitiated: string;
}

export async function initiatePayment(input: InitiatePayInput): Promise<InitiatePayResponse> {
  const res = await fetch(`${BASE()}/initiate-pay`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Fapshi initiate-pay failed (${res.status}): ${txt}`);
  }
  return (await res.json()) as InitiatePayResponse;
}

export interface PaymentStatus {
  transId: string;
  status: "CREATED" | "PENDING" | "SUCCESSFUL" | "FAILED" | "EXPIRED";
  medium?: string;
  serviceName?: string;
  amount?: number;
  revenue?: number;
  payerName?: string;
  email?: string;
  externalId?: string;
}

export async function getPaymentStatus(transId: string): Promise<PaymentStatus> {
  const res = await fetch(`${BASE()}/payment-status/${transId}`, {
    method: "GET",
    headers: headers(),
  });
  if (!res.ok) {
    throw new Error(`Fapshi payment-status failed (${res.status})`);
  }
  return (await res.json()) as PaymentStatus;
}
