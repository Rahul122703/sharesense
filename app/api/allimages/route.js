// app/api/allimages/route.js

import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET(req) {
  try {
    const { data: images, error } = await supabase
      .from("files")
      .select(`
        *,
        users:uploaded_by_id (
          id,
          name,
          email
        )
      `)
      .like("mime_type", "image/%")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ images });
  } catch (err) {
    console.error("Fetch images error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch images" },
      { status: 500 }
    );
  }
}