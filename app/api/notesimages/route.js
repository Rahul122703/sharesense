// app/api/notesimages/route.js

import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET() {
  try {
    // 🔹 Fetch image files only
    const { data: files, error } = await supabase
      .from("files")
      .select("url")
      .like("mime_type", "image/%")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // 🔹 Extract URLs
    const imageUrls = files.map((f) => f.url);

    return NextResponse.json({ images: imageUrls });

  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json(
      { error: "Error fetching images" },
      { status: 500 }
    );
  }
}