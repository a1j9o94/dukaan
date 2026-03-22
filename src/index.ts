import { serve } from "bun";
import index from "./index.html";

const server = serve({
  routes: {
    "/*": index,
    "/api/config": () => {
      return Response.json({
        convexUrl: process.env.VITE_CONVEX_URL,
      });
    },
  },
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
