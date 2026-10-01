"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { StateView } from "@/components/feedback/state-view";
import { AppError } from "@/types/result";
import { postAuthPath } from "@/features/churches/domain/pending-join";
import { useAuth } from "../hooks/use-auth";
import { AuthScreen } from "./auth-screen";
import { SocialButtons } from "./social-buttons";

export function SignInForm() {
  const { status, signInWithPassword } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace(postAuthPath());
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
    <AuthScreen
      title={
        <>
          Qué bueno <span className="text-lime">verte.</span>
        </>
      }
    >
      {status === "unconfigured" ? (
        <StateView kind="unconfigured" tone="dark" className="border border-paper/15" />
      ) : (
        <form className="flex flex-1 flex-col gap-4" onSubmit={onSubmit} noValidate>
          <TextField
            label="Correo"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Link
            href="/recuperar"
            className="self-end text-sm font-semibold text-lime underline-offset-4 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
          <p role="alert" className="m-0 min-h-5 text-sm text-coral">
            {error ?? ""}
          </p>
          <div className="flex-1" />
          <Button type="submit" variant="lime" size="lg" block loading={submitting} disabled={!email || !password}>
            Entrar
          </Button>
          <SocialButtons />
          <p className="m-0 text-center text-sm text-paper/70">
            ¿Aún no tienes cuenta?{" "}
            <Link href="/registro" className="font-semibold text-lime underline-offset-4 hover:underline">
              Crear mi cuenta
            </Link>
          </p>
        </form>
      )}
    </AuthScreen>
  );
}
