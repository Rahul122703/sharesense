// app/api/notes/route.js

import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function POST(req) {
  try {
    const body = await req.json();
    const { content, mode: rawMode, userId, userName } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 },
      );
    }

    const effectiveMode =
      !userId || rawMode === "general" ? "general" : rawMode;

    let note;

    if (effectiveMode === "general") {
      const { data, error } = await supabase
        .from("notes")
        .insert({
          content,
          is_global: false,
          author_name: userName ?? null,
          created_by_id: null,
        })
        .select()
        .single();

      if (error) throw error;
      note = data;
    } else if (effectiveMode === "user") {
      const { data, error } = await supabase
        .from("notes")
        .insert({
          content,
          is_global: false,
          author_name: userName ?? null,
          created_by_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      note = data;
    } else if (effectiveMode === "both") {
      const { data: globalNote, error: err1 } = await supabase
        .from("notes")
        .insert({
          content,
          is_global: true,
          author_name: userName ?? null,
          created_by_id: userId,
        })
        .select()
        .single();

      if (err1) throw err1;

      const { data: userNote, error: err2 } = await supabase
        .from("notes")
        .insert({
          content,
          is_global: false,
          author_name: userName ?? null,
          created_by_id: null,
        })
        .select()
        .single();

      if (err2) throw err2;

      note = { globalNote, userNote };
    }

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Error saving note:", error);
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("timing", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return NextResponse.json({ error: "No notes found" }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json(
      { error: "Failed to fetch note" },
      { status: 500 },
    );
  }
}
