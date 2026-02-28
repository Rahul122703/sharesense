import { NextResponse } from "next/server";
import { getUserFromAuthHeader } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";

export async function POST(req) {
  try {
    const userPayload = getUserFromAuthHeader(req); // may be null

    const formData = await req.formData();

    // Collect uploaded files
    const files = [];
    for (const value of formData.values()) {
      if (value instanceof File) files.push(value);
    }

    if (!files.length) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const saved = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const uniqueName = `${Date.now()}_${safeFileName}`;

      /* ---------- Upload to Supabase Storage ---------- */
      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(uniqueName, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("uploads")
        .getPublicUrl(uniqueName);

      const publicUrl = publicUrlData.publicUrl;

      /* ---------- Insert into files table ---------- */
      const { data: insertedFile, error: insertError } = await supabase
        .from("files")
        .insert({
          filename: file.name,
          mime_type: file.type || "application/octet-stream",
          size: buffer.length,
          url: publicUrl,
          public_id: uniqueName,
          uploaded_by_id: userPayload ? userPayload.id : null,
          is_anonymous: !userPayload,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      saved.push(insertedFile);
    }

    return NextResponse.json({ files: saved });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err.message || "Upload failed" },
      { status: 500 },
    );
  }
}
