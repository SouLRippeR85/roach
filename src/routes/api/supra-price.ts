import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/supra-price")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const res = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=supra&vs_currencies=usd",
            { headers: { accept: "application/json" } },
          );
          const data = (await res.json()) as { supra?: { usd?: number } };
          return Response.json({ usd: data?.supra?.usd ?? 0.000192 });
        } catch {
          return Response.json({ usd: 0.000192 });
        }
      },
    },
  },
});
