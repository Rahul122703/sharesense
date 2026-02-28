// app/api/notes/[id]/route.js

import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function GET(req, { params }) {
  try {
    const { id } = params;

    const { data: note, error } = await supabase
      .from("notes")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const { content } = await req.json();

    if (!id || !content) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { data: updatedNote, error } = await supabase
      .from("notes")
      .update({ content })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      note: updatedNote,
    });
  } catch (error) {
    console.error("AutoSave API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
