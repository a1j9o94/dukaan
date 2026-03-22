import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";

declare const __CONVEX_URL__: string | undefined;

interface AppConfig {
  convexUrl: string;
}

async function getConfig(): Promise<AppConfig> {
  if (typeof __CONVEX_URL__ !== "undefined" && __CONVEX_URL__) {
    return { convexUrl: __CONVEX_URL__ };
  }
  const configResponse = await fetch("/api/config");
  if (!configResponse.ok) {
    throw new Error(`Failed to fetch config: ${String(configResponse.status)}`);
  }
  return (await configResponse.json()) as AppConfig;
}

async function init() {
  const config = await getConfig();

  if (!config.convexUrl) {
    throw new Error(
      "Convex URL is not configured. Run `bunx convex dev` and set VITE_CONVEX_URL environment variable."
    );
  }

  const convex = new ConvexReactClient(config.convexUrl);

  const elem = document.getElementById("root");
  if (!elem) {
    throw new Error("Root element not found");
  }

  createRoot(elem).render(
    <StrictMode>
      <ConvexProvider client={convex}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConvexProvider>
    </StrictMode>
  );
}

init().catch((error: unknown) => {
  console.error("Failed to initialize app:", error);
  const elem = document.getElementById("root");
  if (elem) {
    elem.innerHTML = `
      <div style="color: #ef4444; padding: 40px; font-family: 'Noto Sans Devanagari', system-ui, sans-serif;">
        <h1>कॉन्फ़िगरेशन त्रुटि</h1>
        <p>ऐप कॉन्फ़िगरेशन लोड करने में विफल।</p>
        <p style="color: #9ca3af; font-size: 14px;">
          कृपया <code>bunx convex dev</code> चलाएँ और .env फ़ाइल में VITE_CONVEX_URL सेट करें।
        </p>
      </div>
    `;
  }
});
