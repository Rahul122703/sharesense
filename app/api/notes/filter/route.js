// app/api/notes/filter/route.js

import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
/**
 * POST /api/notes/filter
 * Body: { mode: "general" | "user" | "both", userId?: string }
 */
export async function POST(req) {
  try {
    const { mode, userId } = await req.json();

    let query = supabase
      .from("notes")
      .select("*")
      .order("timing", { ascending: false });

    switch (mode) {
      case "general":
        query = query.eq("is_global", false).is("created_by_id", null);
        break;

      case "user":
        if (!userId) {
          return NextResponse.json(
            { error: "userId required for user mode" },
            { status: 400 },
          );
        }

        query = query
          .eq("is_global", false)
          .eq("created_by_id", userId)
          .not("author_name", "is", null);
        break;

      case "both":
        if (!userId) {
          return NextResponse.json(
            { error: "userId required for both mode" },
            { status: 400 },
          );
        }

        query = query
          .eq("is_global", true)
          .eq("created_by_id", userId)
          .not("author_name", "is", null);
        break;

      default:
        query = query.eq("is_global", false).is("created_by_id", null);
    }

    const { data: notes, error } = await query;

    if (error) throw error;

    return NextResponse.json(notes, { status: 200 });
  } catch (error) {
    console.error("Error filtering notes:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch filtered notes",
      },
      { status: 500 },
    );
  }
}
