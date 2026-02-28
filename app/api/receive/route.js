// app/api/notes/last-general/route.js

import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET() {
  try {
    const { data: lastNote, error } = await supabase
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
      .is("created_by_id", null)
      .order("timing", { ascending: false })
      .limit(1)
      .single();

    if (error || !lastNote) {
      return NextResponse.json(
        { error: "No matching note found" },
        { status: 404 },
      );
    }

    return NextResponse.json(lastNote, { status: 200 });
  } catch (error) {
    console.error("Error fetching last note:", error);
    return NextResponse.json(
      { error: "Failed to fetch last note" },
      { status: 500 },
    );
  }
}
