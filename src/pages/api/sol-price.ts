import type { NextApiRequest, NextApiResponse } from "next";

const PLISIO_API_KEY = "zPKYvV3WLqKsbVyb-AwF6HohSWZpVq4xeddCjOIc4oG52mF3NdSO6S5RZmugyU6T";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const response = await fetch(
      `https://api.plisio.net/api/v1/currencies?api_key=${PLISIO_API_KEY}`,
      { headers: { "Accept": "application/json" } }
    );

    if (!response.ok) {
      return res.status(502).json({ error: "Plisio API error", status: response.status });
    }

    const data = await response.json();
    const currencies: any[] = data?.data ?? [];
    const sol = currencies.find((c: any) => c.cid === "SOL");

    if (!sol) {
      return res.status(404).json({ error: "SOL not found in response" });
    }

    // Cache 30 detik di browser, 60 detik di CDN
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");

    return res.status(200).json({
      cid: sol.cid,
      price_usd: parseFloat(sol.price_usd),
      rate_usd: parseFloat(sol.rate_usd),
      precision: sol.precision,
      icon: sol.icon,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal error", message: err?.message });
  }
}