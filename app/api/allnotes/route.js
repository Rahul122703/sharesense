// app/api/notes/route.js

import { NextResponse } from "next/server";
// import { supabase } from "../../../lib/supabase";
import { supabase } from "../../../lib/supabase";
export async function GET() {
  try {
    const { data: notes, error } = await supabase
      .from("notes")
      .select(
        `
        *,
        users:created_by_id (
          id,
          name,
          email
        )
      `,
      )
      .order("timing", { ascending: false });

    if (error) throw error;

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 },
    );
  }
}
