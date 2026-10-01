"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { SplashState } from "@/components/layout/splash-state";
import { AppError } from "@/types/result";
import { authRepository } from "../data/auth.repository";
import { passwordProblem } from "../domain/validation";
import { useAuth } from "../hooks/use-auth";
import { useAuthRedirect } from "../hooks/use-auth-redirect";
import { AuthScreen } from "./auth-screen";

/** Opened from the recovery email: exchanges the link code, then sets a new password. */
export function NewPasswordForm() {
  const redirect = useAuthRedirect();
  const { status } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (redirect.status === "working") return <SplashState />;

  const canSetPassword = redirect.status === "done" || status === "authenticated";
  if (!canSetPassword) {
    return (
      <AuthScreen
        backHref="/entrar"
        title={
          <>
            Enlace no válido<span className="text-lime">.</span>
          </>
        }
      >
        <p className="m-0 text-[15px] leading-[1.5] text-paper/80" role="alert">
          {redirect.status === "error" ? redirect.error.message : "Abre el enlace que te enviamos por correo."}
        </p>
        <div className="flex-1" />
        <ButtonLink href="/recuperar" variant="lime" size="lg" block>
          Pedir un enlace nuevo
        </ButtonLink>
      </AuthScreen>
    );
  }

  const problem = passwordProblem(password) ?? (password !== confirm ? "Las contraseñas no coinciden." : null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (problem) return;
    setSubmitting(true);
    try {
      await authRepository.updatePassword(password);
      router.replace("/inicio");
    } catch (err) {
      setError(err instanceof AppError ? err.message : "Algo no salió bien. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen
      backHref="/inicio"
      title={
        <>
          Nueva <span className="text-lime">contraseña.</span>
        </>
      }
    >
      <form className="flex flex-1 flex-col gap-4" onSubmit={onSubmit} noValidate>
        <TextField
          label="Contraseña nueva"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="Mínimo 8 caracteres."
        />
        <TextField
          label="Repite la contraseña"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={touched ? problem : null}
        />
        <p role="alert" className="m-0 min-h-5 text-sm text-coral">
          {error ?? ""}
        </p>
        <div className="flex-1" />
        <Button type="submit" variant="lime" size="lg" block loading={submitting}>
          Guardar contraseña
        </Button>
      </form>
    </AuthScreen>
  );
}
