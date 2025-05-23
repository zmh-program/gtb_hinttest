import { NextResponse } from "next/server";
import { getUUIDFromPlayer } from "@/lib/api/get_uuid_from_player";
import { getHypixelStats } from "@/lib/api/get_hypixel_stats";

export const dynamic = "force-dynamic";
export const revalidate = 120;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    const api_key = searchParams.get("api_key");

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 },
      );
    }

    const apiKey = api_key?.trim() || process.env.HYPIXEL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Hypixel API key is required" },
        { status: 400 },
      );
    }

    // Get UUID from username
    const uuidResponse = await getUUIDFromPlayer(username);
    if (uuidResponse.error) {
      return NextResponse.json(
        { error: uuidResponse.error },
        { status: uuidResponse.error.includes("404") ? 404 : 500 },
      );
    }

    // Get Hypixel stats using UUID
    const statsResponse = await getHypixelStats(uuidResponse.id, apiKey);
    if (statsResponse.error) {
      return NextResponse.json(
        { error: statsResponse.error },
        { status: statsResponse.error.includes("404") ? 404 : 500 },
      );
    }

    return NextResponse.json(statsResponse.data, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
