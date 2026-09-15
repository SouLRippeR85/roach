import { createFileRoute } from "@tanstack/react-router";
import { fetchUserStakes, fetchVaultStats } from "@/lib/roach/vault";

export const Route = createFileRoute("/api/vault")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const user = url.searchParams.get("user");
        const stats = await fetchVaultStats();
        const stakes = user ? await fetchUserStakes(user) : [];
        return Response.json({
          totalLocked: stats.totalLocked.toString(),
          paused: stats.paused,
          admin: stats.admin,
          stakes: stakes.map((s) => ({
            ...s,
            amount: s.amount.toString(),
          })),
        });
      },
    },
  },
});
