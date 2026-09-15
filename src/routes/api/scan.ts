import { createFileRoute } from "@tanstack/react-router";
import { scanAccount } from "@/lib/roach/scan";

export const Route = createFileRoute("/api/scan")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const address = url.searchParams.get("address");
        const price = Number(url.searchParams.get("price") || "0") || null;
        if (!address) {
          return Response.json({ error: "address required" }, { status: 400 });
        }
        const tokens = await scanAccount(address, price);
        return Response.json({
          tokens: tokens.map((t) => ({
            ...t,
            rawValue: t.rawValue.toString(),
          })),
        });
      },
    },
  },
});
