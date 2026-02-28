// app/api/deletefile/[id]/route.js

import { NextResponse } from "next/server";
import { getUserFromAuthHeader } from "../../../../lib/auth";
import { supabase } from "../../../../lib/supabase";

export async function POST(req, { params }) {
  try {
    const user = getUserFromAuthHeader(req);
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 },
      );
    }

    // 🔹 Find file in database
    const { data: file, error: fetchError } = await supabase
      .from("files")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // 🔹 Optional: Ownership check (important for security)
    if (file.uploaded_by_id && user?.id !== file.uploaded_by_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 🔹 Delete from Supabase Storage
    if (file.public_id) {
      const { error: storageError } = await supabase.storage
        .from("uploads")
        .remove([file.public_id]);

      if (storageError) {
        console.error("Supabase deletion error:", storageError);
        return NextResponse.json(
          { error: "Failed to delete file from storage" },
          { status: 500 },
        );
      }
    }

    // 🔹 Delete from database
    const { error: deleteError } = await supabase
      .from("files")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json(
      { error: err.message || "Delete failed" },
      { status: 500 },
    );
  }
}
