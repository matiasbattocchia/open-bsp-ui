import { useState } from "react";

import { supabase } from "@/supabase/client";

import { Translate as T, useTranslation } from "@/hooks/useTranslation";
import { GoogleOutlined } from "@ant-design/icons";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const { translate: t } = useTranslation();

  async function handleLogInWithOauth() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/conversations`,
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
      setMessage(t("¡Credenciales inválidas!") as string);
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
          className="py-[7px] px-[20px] hover:bg-blue-400/90 rounded-lg w-full flex items-center justify-center gap-2 bg-blue-500 text-white"
          onClick={handleLogInWithOauth}
        >
          <GoogleOutlined /> {t("Continuar con Google")}
        </button>

        <div className="border-b border-border w-full" />

        <form onSubmit={handleLogInWithEmail} className="flex flex-col gap-3">
          <div>
            <T as="label" className="block text-md">
              Correo electrónico
            </T>
            <input
              className="py-[10px] px-[20px] h-[40px] border border-border bg-incoming-chat-bubble rounded-lg w-full"
              placeholder="gori@gmail.com"
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
            />
          </div>

          <div>
            <T as="label" className="block text-md">
              Contraseña
            </T>
            <input
              className="py-[10px] px-[20px] h-[40px] border border-border bg-incoming-chat-bubble rounded-lg w-full"
              placeholder="******"
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
            />
          </div>

          {message && (
            <div className="self-center text-destructive text-md">{message}</div>
          )}

          <button
            type="submit"
            className="py-[7px] px-[20px] mt-[16px] text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg w-full flex items-center justify-center"
          >
            {t("Entrar")}
          </button>
        </form>
      </div>
    </div>
  );
}
