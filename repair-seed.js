var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🛠️ Repairing seed data for Oftalmología...");
        let specialty = yield prisma.speciality.findUnique({
            where: { name: "Oftalmología" }
        });
        if (!specialty) {
            console.log("   Creating missing specialty: Oftalmología");
            specialty = yield prisma.speciality.create({
                data: {
                    name: "Oftalmología",
                    description: "Diagnóstico y tratamiento de enfermedades de los ojos, cirugía ocular y cuidado de la salud visual.",
                    icon: "👁️"
                }
            });
        }
        else {
            console.log("   Specialty 'Oftalmología' exists.");
        }
        const doctorName = "Gabriela Carolina Natera Pulgar";
        let doctorUser = yield prisma.user.findFirst({
            where: { name: { contains: "Gabriela" } },
            include: { doctor: true }
        });
        if (!doctorUser) {
            console.log("   Creating missing user: Gabriela");
            doctorUser = yield prisma.user.create({
                data: {
                    name: doctorName,
                    email: "gabynatera@yahoo.com",
                    password: "$2a$10$X7.1QZ.1111111111111111111111111111111111111111111111", // Dummy hash
                    role: "DOCTOR",
                    phone: "0412-1925181",
                    address: "Lechería",
                    idCard: "V-15.050.231"
                },
                include: { doctor: true }
            });
        }
        else {
            console.log(`   User 'Gabriela' exists (ID: ${doctorUser.id}).`);
        }
        if (!doctorUser.doctor) {
            console.log("   Linking user to Doctor profile...");
            yield prisma.doctor.create({
                data: {
                    userId: doctorUser.id,
                    specialityId: specialty.id,
                    license: "CM: 6389 / MSAS: 70260",
                    biography: "Oftalmóloga especialista.",
                    imageUrl: "/images/doctors/Dra-Gabriela-NAtera-Oftalmologa_14-240x300.jpeg"
                }
            });
            console.log("   ✅ Doctor creation repaired.");
        }
        else {
            console.log("   Doctor profile already exists. Updating image URL...");
            yield prisma.doctor.update({
                where: { id: doctorUser.doctor.id },
                data: {
                    imageUrl: "/images/doctors/Dra-Gabriela-NAtera-Oftalmologa_14-240x300.jpeg",
                    specialityId: specialty.id // Ensure strictly linked
                }
            });
            console.log("   ✅ Doctor updated.");
        }
    });
}
main()
    .catch(e => console.error(e))
    .finally(() => __awaiter(void 0, void 0, void 0, function* () { return yield prisma.$disconnect(); }));
