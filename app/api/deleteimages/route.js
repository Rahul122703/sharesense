// app/api/deleteimages/route.js

import { NextResponse } from "next/server";
import { getUserFromAuthHeader } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";

export async function POST(req) {
  try {
    const userPayload = getUserFromAuthHeader(req);

    const { images } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 },
      );
    }

    const deletedImages = [];

    for (const img of images) {
      const { publicId, id } = img;

      if (!publicId || !id) continue;

      // 🔹 Fetch file first (to verify ownership)
      const { data: file, error: fetchError } = await supabase
        .from("files")
        .select("id, public_id, uploaded_by_id")
        .eq("id", id)
        .single();

      if (fetchError || !file) continue;

      // 🔹 Ownership check (important)
      if (file.uploaded_by_id && userPayload?.id !== file.uploaded_by_id) {
        continue; // skip unauthorized
      }

      // 🔹 Delete from Supabase Storage
      const { error: storageError } = await supabase.storage
        .from("uploads")
        .remove([file.public_id]);

      if (storageError) {
        console.error(
          `Storage delete error for ${file.public_id}:`,
          storageError,
        );
        continue;
      }

      // 🔹 Delete from database
      const { error: deleteError } = await supabase
        .from("files")
        .delete()
        .eq("id", id);

      if (deleteError) {
        console.error(`DB delete error for ${id}:`, deleteError);
        continue;
      }

      deletedImages.push(id);
    }

    return NextResponse.json({
      success: true,
      deleted: deletedImages,
    });
  } catch (err) {
    console.error("Delete images error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete images" },
      { status: 500 },
    );
  }
}
