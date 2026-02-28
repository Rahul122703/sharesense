// app/api/notes/upload-to-end/route.js

import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function POST(req) {
  try {
    const { noteId, filterMode } = await req.json();

    if (!noteId) {
      return NextResponse.json(
        { error: "noteId is required" },
        { status: 400 },
      );
    }

    let note;

    // 🔹 1. Update timing
    const { data: updatedNote, error: updateError } = await supabase
      .from("notes")
      .update({ timing: new Date().toISOString() })
      .eq("id", noteId)
      .select()
      .single();

    if (updateError || !updatedNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (filterMode === "general") {
      note = updatedNote;
    } else if (filterMode === "user") {
      // 🔹 Create user-specific copy (no user info)
      const { data: userNote, error: userError } = await supabase
        .from("notes")
        .insert({
          content: updatedNote.content,
          is_global: false,
        })
        .select()
        .single();

      if (userError) throw userError;

      note = { updatedNote, userNote };
    } else if (filterMode === "both") {
      // 🔹 Create both copies
      const { data: globalNote, error: globalError } = await supabase
        .from("notes")
        .insert({
          content: updatedNote.content,
          is_global: true,
        })
        .select()
        .single();

      if (globalError) throw globalError;

      const { data: userNote, error: userError } = await supabase
        .from("notes")
        .insert({
          content: updatedNote.content,
          is_global: false,
        })
        .select()
        .single();

      if (userError) throw userError;

      note = { updatedNote, globalNote, userNote };
    }

    return NextResponse.json({ success: true, note });
  } catch (error) {
    console.error("UploadNoteToEnd API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
