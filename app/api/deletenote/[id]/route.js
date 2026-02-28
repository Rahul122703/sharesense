// app/api/notes/[id]/route.js

import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function DELETE(request, context) {
  const { id } = context.params;

  if (!id) {
    return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
  }

  try {
    // 1️⃣ Check if note exists
    const { data: existingNote, error: fetchError } = await supabase
      .from("notes")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // 2️⃣ Delete note
    const { error: deleteError } = await supabase
      .from("notes")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return NextResponse.json(
      { message: "Note deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
