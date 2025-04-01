import { NextResponse } from "next/server";
import { getUUIDFromPlayer } from "@/lib/api/get_uuid_from_player";
import { getHypixelStats } from "@/lib/api/get_hypixel_stats";

interface RequestBody {
  username: string;
  api_key: string;
}

export async function POST(request: Request) {
  try {
    const { username, api_key }: RequestBody = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 },
      );
    }

    if (!api_key) {
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
    const statsResponse = await getHypixelStats(uuidResponse.id, api_key);
    if (statsResponse.error) {
      return NextResponse.json(
        { error: statsResponse.error },
        { status: statsResponse.error.includes("404") ? 404 : 500 },
      );
    }

    return NextResponse.json(statsResponse.data);
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
