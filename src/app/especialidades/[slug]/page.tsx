
import { notFound } from "next/navigation";
import { getSpecialtyBySlug } from "@/data/specialties-data";
import { getDoctorsBySpecialtySlug } from "@/app/actions/doctors";
import SpecialtyDetailClient from "./SpecialtyDetailClient";

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function SpecialtyDetailPage({ params }: PageProps) {
    const { slug } = await params;
    const specialty = getSpecialtyBySlug(slug);

    if (!specialty) {
        notFound();
    }

    const doctors = await getDoctorsBySpecialtySlug(slug);

    return (
        <SpecialtyDetailClient
            specialty={specialty}
            doctors={doctors}
        />
    );
}
