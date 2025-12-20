
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Verify Specialty
    const spec = await prisma.especialidad.findFirst({
        where: { nombre: 'Oftalmología' }
    });
    console.log("Specialty found:", spec);

    // 2. Verify Doctor
    if (spec) {
        const doctors = await prisma.medico.findMany({
            where: { especialidad: spec.nombre }, // Linked by string in denormalized model or relation if fixed
            include: { empleado: true }
        });
        console.log("Doctors found:", doctors.length);
        if (doctors.length > 0) {
            console.log("Doctor 1:", doctors[0].empleado.nombres);
        }
    }
    // Check Gabriela directly
    const gabriela = await prisma.user.findFirst({
        where: { name: { contains: "Gabriela" } },
        include: { doctor: { include: { speciality: true } } }
    });

    if (gabriela) {
        console.log(`\n🔍 Found Gabriela: ${gabriela.name} `);
        if (gabriela.doctor) {
            console.log(`   Is a doctor ? YES(ID: ${gabriela.doctor.id})`);
            console.log(`   Specialty: ${gabriela.doctor.speciality.name} `);
        } else {
            console.log("   Is a doctor? NO");
        }
    } else {
        console.log("\n❌ Gabriela not found in User table.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
