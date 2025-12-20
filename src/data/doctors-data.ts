export interface Doctor {
    id: string;
    name: string;
    specialtyId: string;
    photo: string;
    credentials: string;
    experience: string;
    biography?: string;
}

// IDs de especialidades (coinciden con la lógica de seed.ts/articles-data.ts)
// 1: Odontología
// 2: Oftalmología
// 3: Traumatología
// 4: Medicina Interna
// 5: Cirugía Plástica
// 6: Gastroenterología
// 7: Terapia Intensiva
// 8: Neonatología

export const doctors: Doctor[] = [
    // Oftalmología (ID: 2)
    {
        id: "1",
        name: "Ana Karelia Rodríguez Guevara",
        specialtyId: "2",
        photo: "/images/placeholder-doctor.jpg",
        credentials: "CM: 6389 / MSAS: 70260",
        experience: "Especialista en Oftalmología",
        biography: "Oftalmóloga especialista."
    },
    {
        id: "2",
        name: "Gabriela Carolina Natera Pulgar",
        specialtyId: "2",
        photo: "/images/doctors/Dra-Gabriela-NAtera-Oftalmologa_14-240x300.jpeg",
        credentials: "CM: 8522 / MSAS: 119872",
        experience: "Especialista en Oftalmología",
        biography: "Soy la Dra. Gabriela Natera, oftalmóloga comprometida con la salud visual de mis pacientes. Con años de experiencia en el diagnóstico y tratamiento de enfermedades oculares."
    },
    // Traumatología (ID: 3)
    {
        id: "3",
        name: "Liliana Garcia Marcano",
        specialtyId: "3",
        photo: "/images/placeholder-doctor.jpg",
        credentials: "CM: 3853 / MSAS: 42018",
        experience: "Especialista en Traumatología",
        biography: "Traumatólogo especialista."
    },
    {
        id: "4",
        name: "Andres Alejandro Padrón",
        specialtyId: "3",
        photo: "/images/placeholder-doctor.jpg",
        credentials: "CM: 49.202 / MSAS: CMA 4895",
        experience: "Especialista en Traumatología",
        biography: "Traumatólogo especialista."
    },
    // Odontología (ID: 1)
    {
        id: "5",
        name: "Rosvel Fernando Duran Castañeda",
        specialtyId: "1",
        photo: "/images/placeholder-doctor.jpg",
        credentials: "CM: 39574 / MSAS: 359",
        experience: "Especialista en Odontología",
        biography: "Odontólogo especialista."
    },
    // Gastroenterología (ID: 6)
    {
        id: "6",
        name: "Jorge Alejandro Ramirez Berroteran",
        specialtyId: "6",
        photo: "/images/placeholder-doctor.jpg",
        credentials: "CM: 5724 / MSAS: 66606",
        experience: "Especialista en Gastroenterología",
        biography: "Gastroenterólogo especialista."
    },
    {
        id: "7",
        name: "Luisana Maria Rodríguez Pereo",
        specialtyId: "6",
        photo: "/images/placeholder-doctor.jpg",
        credentials: "CM: 7434 / MSAS: 100554",
        experience: "Especialista en Gastroenterología",
        biography: "Gastroenterólogo especialista."
    },
    // Cirugía Plástica (ID: 5)
    {
        id: "8",
        name: "Beverly Jackeline Bruzual Ortiz",
        specialtyId: "5",
        photo: "/images/placeholder-doctor.jpg",
        credentials: "CM: 7097 / MSAS: 101914",
        experience: "Especialista en Cirugía Plástica",
        biography: "Cirujano Plástico especialista."
    },
    // Medicina Interna (ID: 4)
    {
        id: "9",
        name: "Liurka Carolina Silva Valdez",
        specialtyId: "4",
        photo: "/images/placeholder-doctor.jpg",
        credentials: "CM: 3407 / MSAS: 91434",
        experience: "Especialista en Medicina Interna",
        biography: "Internista especialista."
    },
    {
        id: "10",
        name: "Ignacio Meneses Brito",
        specialtyId: "4",
        photo: "/images/placeholder-doctor.jpg",
        credentials: "CM: 6769 / MSAS: 77878",
        experience: "Especialista en Medicina Interna",
        biography: "Internista especialista."
    },
    // Neonatología (ID: 8)
    {
        id: "11",
        name: "Andreina Mac-Quhae Blasini",
        specialtyId: "8",
        photo: "/images/placeholder-doctor.jpg",
        credentials: "CM: 6180 / MSAS: 70048",
        experience: "Especialista en Pediatría y Neonatología",
        biography: "Especialista en Pediatría y Neonatología."
    },
    // Terapia Intensiva (ID: 7)
    {
        id: "12",
        name: "Milagros del Valle Rangel Perez",
        specialtyId: "7",
        photo: "/images/placeholder-doctor.jpg",
        credentials: "CM: 7120 / MSAS: 81225",
        experience: "Médico Intensivista",
        biography: "Médico Intensivista."
    },
    {
        id: "13",
        name: "Martin Eduardo Rivera Malave",
        specialtyId: "7",
        photo: "/images/placeholder-doctor.jpg",
        credentials: "CM: 8000 / MSAS: 109872",
        experience: "Médico Intensivista",
        biography: "Médico Intensivista."
    }
];

// Helper function to get doctors by specialty ID
export function getDoctorsBySpecialtyId(specialtyId: string): Doctor[] {
    return doctors.filter(doctor => doctor.specialtyId === specialtyId);
}
