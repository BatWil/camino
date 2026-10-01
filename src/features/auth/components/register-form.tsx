"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { StateView } from "@/components/feedback/state-view";
import { analytics } from "@/lib/analytics";
import { AppError } from "@/types/result";
import { authRepository } from "../data/auth.repository";
import { isValidEmail, nameProblem, passwordProblem } from "../domain/validation";
import { postAuthPath } from "@/features/churches/domain/pending-join";
import { useAuth } from "../hooks/use-auth";
import { AuthScreen } from "./auth-screen";

/** "Crear mi cuenta" (from screen 4a). Email + password; onboarding collects the rest. */
export function RegisterForm() {
  const { status } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") router.replace(postAuthPath());
  }, [status, router]);

  const problems = {
    name: nameProblem(name),
    email: isValidEmail(email) ? null : "Escribe un correo válido.",
    password: passwordProblem(password),
  };
  const valid = !problems.name && !problems.email && !problems.password;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!valid) return;
    setSubmitting(true);
    try {
      const session = await authRepository.signUp({ email, password, displayName: name });
      analytics.track("sign_up", { method: "email" });
      if (!session) setSentTo(email.trim().toLowerCase());
      // With a session, AuthProvider updates and the effect above routes to onboarding.
    } catch (err) {
      setError(err instanceof AppError ? err.message : "Algo no salió bien. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sentTo) {
    return (
      <AuthScreen
        title={
          <>
            Revisa tu <span className="text-lime">correo.</span>
          </>
        }
      >
        <p className="m-0 text-[15px] leading-[1.5] text-paper/80">
          Te enviamos un enlace a <strong className="text-paper">{sentTo}</strong>. Ábrelo en este dispositivo para
          confirmar tu cuenta y empezar tu camino.
        </p>
        <span className="-rotate-3 self-start font-hand text-[26px] text-lime">paso a paso ✦</span>
        <div className="flex-1" />
        <ButtonLink href="/entrar" variant="lime" size="lg" block>
          Ya confirmé · Entrar
        </ButtonLink>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title={
        <>
          Empieza tu <span className="text-lime">camino.</span>
        </>
      }
    >
      {status === "unconfigured" ? (
        <StateView kind="unconfigured" tone="dark" className="border border-paper/15" />
      ) : (
        <form className="flex flex-1 flex-col gap-4" onSubmit={onSubmit} noValidate>
          <TextField
            label="¿Cómo te llamas?"
            autoComplete="given-name"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            error={touched ? problems.name : null}
          />
          <TextField
            label="Correo"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={touched ? problems.email : null}
          />
          <TextField
            label="Contraseña"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint="Mínimo 8 caracteres."
            error={touched ? problems.password : null}
          />
          <p role="alert" className="m-0 min-h-5 text-sm text-coral">
            {error ?? ""}
          </p>
          <div className="flex-1" />
          <Button type="submit" variant="lime" size="lg" block loading={submitting}>
            Crear mi cuenta
          </Button>
          <p className="m-0 text-center text-sm text-paper/70">
            ¿Ya tienes cuenta?{" "}
            <Link href="/entrar" className="font-semibold text-lime underline-offset-4 hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      )}
    </AuthScreen>
  );
}
