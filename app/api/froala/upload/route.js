// app/api/froala/upload/route.js

import { NextResponse } from "next/server";
import { getUserFromAuthHeader } from "../../../../lib/auth";
import { supabase } from "../../../../lib/supabase";

export async function POST(req) {
  try {
    const userPayload = getUserFromAuthHeader(req);

    const formData = await req.formData();
    const file = formData.get("file"); // Froala sends file in "file"

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueName = `${Date.now()}_${safeFileName}`;

    // 🔹 Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(uniqueName, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // 🔹 Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from("uploads")
      .getPublicUrl(uniqueName);

    const publicUrl = publicUrlData.publicUrl;

    // 🔹 Insert metadata into Supabase DB
    const { error: insertError } = await supabase.from("files").insert({
      filename: file.name,
      mime_type: file.type || "application/octet-stream",
      size: buffer.length,
      url: publicUrl,
      public_id: uniqueName,
      uploaded_by_id: userPayload?.id ?? null,
    });

    if (insertError) throw insertError;

    // 🔹 Froala requires { link: "<url>" }
    return NextResponse.json({ link: publicUrl });
  } catch (err) {
    console.error("Froala upload error:", err);
    return NextResponse.json(
      { error: err.message || "Upload failed" },
      { status: 500 },
    );
  }
}
