"use client";

import { ReactNode } from "react";
import "./globals.css";
import "@radix-ui/themes/styles.css";
import { useAppInit } from "@/hooks/useAppInitializer";
import { useEscKeyManagement } from "@/hooks/useEscKeyManagement";
import useWebNotifications from "@/hooks/useWebNotifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TranslationProvider } from "react-dialect";

const queryClient = new QueryClient();

/**
 * The App Initializer component is responsible for initializing the app
 * in the environment of a tanstack query client to be cable of running
 * queries.
 */
function AppInitializer() {
  useWebNotifications();
  useAppInit();
  useEscKeyManagement();

  return null;
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <TranslationProvider languages={["es", "en", "pt"]} baseLanguage="es">
      <QueryClientProvider client={queryClient}>
        <html lang="es">
          <head>
            <link rel="manifest" href="/manifest.json" />
            <link rel="apple-touch-icon" href="/logo.png" />
            <meta name="theme-color" content="#000000" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0, interactive-widget=resizes-content"
            />
          </head>
          <body>
            <AppInitializer />
            {children}
          </body>
        </html>
      </QueryClientProvider>
    </TranslationProvider>
  );
}
