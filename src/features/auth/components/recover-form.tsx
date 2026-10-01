"use client";

import { useState, type FormEvent } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { AppError } from "@/types/result";
import { authRepository } from "../data/auth.repository";
import { isValidEmail } from "../domain/validation";
import { AuthScreen } from "./auth-screen";

export function RecoverForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email)) {
      setError("Escribe un correo válido.");
      return;
    }
    setSubmitting(true);
    try {
      await authRepository.requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof AppError ? err.message : "Algo no salió bien. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen
      backHref="/entrar"
      title={
        <>
          Siempre puedes <span className="text-lime">volver.</span>
        </>
      }
    >
      {sent ? (
        <>
          <p className="m-0 text-[15px] leading-[1.5] text-paper/80" role="status">
            Si existe una cuenta con <strong className="text-paper">{email.trim()}</strong>, te enviamos un enlace para
            crear una contraseña nueva. Ábrelo en este dispositivo.
          </p>
          <div className="flex-1" />
          <ButtonLink href="/entrar" variant="lime" size="lg" block>
            Volver a entrar
          </ButtonLink>
        </>
      ) : (
        <form className="flex flex-1 flex-col gap-4" onSubmit={onSubmit} noValidate>
          <p className="m-0 text-[15px] leading-[1.5] text-paper/75">
            Escribe tu correo y te enviaremos un enlace para crear una contraseña nueva.
          </p>
          <TextField
            label="Correo"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
          />
          <div className="flex-1" />
          <Button type="submit" variant="lime" size="lg" block loading={submitting} disabled={!email}>
            Enviar enlace
          </Button>
        </form>
      )}
    </AuthScreen>
  );
}
