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

  async function handleLogInWithEmail() {
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
    <div className="flex flex-col gap-6 justify-center items-center bg-gray absolute z-50 h-[100dvh] w-screen">
      <img width={250} height={250} src="/logo.png" alt="ChatScript logo" />

      <div className="flex flex-col gap-3 w-[250px]">
        <button
          className="py-[7px] px-[20px] border border-blue-400 hover:bg-blue-400 rounded-lg w-full flex items-center justify-center gap-2 bg-blue-500 text-white"
          onClick={handleLogInWithOauth}
        >
          <GoogleOutlined /> {t("Continuar con Google")}
        </button>

        <div className="border-b border-gray-line w-full" />

        <div>
          <T as="label" className="block text-md">
            Correo electrónico
          </T>
          <input
            className="py-[10px] px-[20px] h-[40px] border border-gray-line bg-white rounded-lg w-full"
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
            className="py-[10px] px-[20px] h-[40px] border border-gray-line bg-white rounded-lg w-full"
            placeholder="******"
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
          />
        </div>

        {message && (
          <div className="self-center text-red-500 text-md">{message}</div>
        )}

        <button
          className="py-[7px] px-[20px] border border-gray-dark hover:bg-white rounded-lg w-full flex items-center justify-center"
          onClick={handleLogInWithEmail}
        >
          {t("Entrar")}
        </button>
      </div>
    </div>
  )
}
