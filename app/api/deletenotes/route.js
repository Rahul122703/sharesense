// app/api/notes/delete-multiple/route.js

import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function POST(req) {
  try {
    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "ids (array) is required" },
        { status: 400 },
      );
    }

    // ✅ Delete multiple notes
    const { data, error } = await supabase
      .from("notes")
      .delete()
      .in("id", ids)
      .select("id"); // return deleted rows

    if (error) throw error;

    return NextResponse.json({
      success: true,
      deleted: data?.length || 0,
    });
  } catch (error) {
    console.error("DeleteMultipleNotes API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
