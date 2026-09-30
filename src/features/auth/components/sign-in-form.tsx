"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/ui/brand-mark";
import { StateView } from "@/components/feedback/state-view";
import { AppError } from "@/types/result";
import { useAuth } from "../hooks/use-auth";

const inputClass =
  "h-14 w-full rounded-[22px] border-[1.5px] border-paper/20 bg-white/[.08] px-5 text-base text-paper placeholder:text-paper/40 focus:border-lime focus:outline-none";

/** Email/password sign-in (M0 base). Registration, OAuth and recovery arrive in M1. */
export function SignInForm() {
  const { status, signInWithPassword } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  useEffect(() => {
    if (status === "authenticated") router.replace("/inicio");
  }, [status, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithPassword(email, password);
    } catch (err) {
      setError(err instanceof AppError ? err.message : "Algo no salió bien. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="pt-safe pb-safe flex min-h-dvh flex-col bg-ink text-paper">
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-6 px-6 pt-4 pb-8">
        <Link
          href="/bienvenida"
          aria-label="Volver"
          className="flex size-10 items-center justify-center rounded-full bg-white/10"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <BrandMark />
        <h1 className="m-0 font-display-x text-[40px] leading-[.88] tracking-[-.03em]">
          Qué bueno <span className="text-lime">verte.</span>
        </h1>

        {status === "unconfigured" ? (
          <StateView kind="unconfigured" tone="dark" className="border border-paper/15" />
        ) : (
          <form className="flex flex-1 flex-col gap-4" onSubmit={onSubmit} noValidate>
            <div className="flex flex-col gap-2">
              <label htmlFor={emailId} className="text-sm font-semibold">
                Correo
              </label>
              <input
                id={emailId}
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                aria-describedby={error ? errorId : undefined}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor={passwordId} className="text-sm font-semibold">
                Contraseña
              </label>
              <input
                id={passwordId}
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                aria-describedby={error ? errorId : undefined}
              />
            </div>
            <p id={errorId} role="alert" className="m-0 min-h-5 text-sm text-coral">
              {error ?? ""}
            </p>
            <div className="flex-1" />
            <Button type="submit" variant="lime" size="lg" block loading={submitting} disabled={!email || !password}>
              Entrar
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
