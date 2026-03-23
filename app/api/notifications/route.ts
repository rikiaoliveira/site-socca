import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function GET() {
  try {
    const raw: string[] = (await redis.lrange("notifications:history", 0, 29)) || [];
    const notifications = raw.map((item) => {
      try {
        return typeof item === "string" ? JSON.parse(item) : item;
      } catch {
        return null;
      }
    }).filter(Boolean);
    return NextResponse.json(notifications, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
