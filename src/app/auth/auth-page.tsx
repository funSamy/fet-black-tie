"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { signIn, signUp, getSessionInfo } from "@/lib/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthPage({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // If already signed in, bounce.
  useEffect(() => {
    getSessionInfo().then((session) => {
      if (session) router.replace(redirectTo ?? "/admin");
    });
  }, [router, redirectTo]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const res = await signIn({ email, password });
        if (!res.ok) throw new Error(res.error);
      } else {
        const res = await signUp({ email, password });
        if (!res.ok) throw new Error(res.error);
        toast.success("Account created. You can now sign in.");
        setMode("signin");
        return;
      }
      router.replace(redirectTo ?? "/admin");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-gold/40 bg-card/95 p-6 sm:p-8 shadow-gold"
      >
        <h1 className="font-display text-3xl text-gradient-gold">Staff access</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to manage orders and scan tickets at the door.
        </p>
        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="pwd">Password</Label>
            <Input
              id="pwd"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>
        <Button
          type="submit"
          disabled={busy}
          className="mt-6 w-full bg-gradient-to-r from-[var(--color-gold-dark)] via-[var(--color-gold)] to-[var(--color-gold-light)] text-background font-condensed uppercase tracking-widest"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : mode === "signin" ? (
            "Sign in"
          ) : (
            "Create account"
          )}
        </Button>
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}
