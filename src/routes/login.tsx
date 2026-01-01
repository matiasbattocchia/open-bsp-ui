import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { GoogleOutlined } from "@ant-design/icons";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const { redirect } = Route.useSearch();

  const { translate: t } = useTranslation();

  async function handleLogInWithOauth() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + redirect,
      },
    });
  }

  async function handleLogInWithEmail(e?: React.FormEvent) {
    if (e) e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(t("¡Credenciales inválidas!"));
    } else {
      setEmail("");
      setPassword("");
    }
  }

  return (
    <div className="flex flex-col gap-9 justify-center items-center bg-background text-foreground h-dvh w-screen">
      <div className="text-primary tracking-tighter font-bold text-[36px]">
        Open BSP
      </div>

      <div className="flex flex-col gap-3 w-[250px]">
        <button
          type="button"
          className="primary bg-blue-500 hover:bg-blue-400 text-white w-full border-none"
          onClick={handleLogInWithOauth}
        >
          <GoogleOutlined /> {t("Continuar con Google")}
        </button>

        <div className="border-b border-border w-full" />

        <form onSubmit={handleLogInWithEmail} className="login-form">
          <label>
            <div className="label">{t("Correo electrónico")}</div>
            <input
              className="text"
              placeholder="gori@gmail.com"
              type="text"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
            />
          </label>

          <label>
            <div className="label">{t("Contraseña")}</div>
            <input
              className="text"
              placeholder="******"
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
            />
          </label>

          {message && (
            <div className="self-center text-destructive text-md">{message}</div>
          )}

          <button
            type="submit"
            className="primary w-full mt-[16px]"
          >
            {t("Entrar")}
          </button>
        </form>
      </div>
    </div>
  );
}