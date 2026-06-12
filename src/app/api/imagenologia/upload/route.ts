import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "imagenologia-resultados";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const fileName = formData.get("fileName") as string | null;

        if (!file || !fileName) {
            return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
        }

        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { error } = await supabaseAdmin.storage
            .from(BUCKET)
            .upload(fileName, file, { cacheControl: "3600", upsert: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from(BUCKET)
            .getPublicUrl(fileName);

        return NextResponse.json({ publicUrl });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
