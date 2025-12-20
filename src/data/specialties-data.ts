export interface Specialty {
    id: string;
    name: string;
    slug: string;
    letter: string;
    description: string;
    fullDescription: string;
    icon: string;
}

export const specialties: Specialty[] = [
    // A
    {
        id: "1",
        name: "Alergología",
        slug: "alergologia",
        letter: "A",
        description: "Diagnóstico y tratamiento de enfermedades alérgicas e inmunológicas.",
        fullDescription: "La alergología es la especialidad médica que se dedica al estudio, diagnóstico y tratamiento de las enfermedades causadas por mecanismos inmunológicos, especialmente las enfermedades alérgicas. Nuestros especialistas están capacitados para tratar rinitis alérgica, asma bronquial, dermatitis atópica, urticaria, alergia alimentaria y medicamentosa, entre otras condiciones.",
        icon: "🌸"
    },
    {
        id: "2",
        name: "Anestesiología",
        slug: "anestesiologia",
        letter: "A",
        description: "Manejo del dolor y anestesia para procedimientos quirúrgicos.",
        fullDescription: "La anestesiología es la especialidad médica dedicada al cuidado y mantenimiento del paciente antes, durante y después de una intervención quirúrgica. Nuestro equipo de anestesiólogos utiliza técnicas avanzadas para garantizar la seguridad y comodidad del paciente, incluyendo anestesia general, regional y sedación.",
        icon: "💉"
    },
    // C
    {
        id: "3",
        name: "Cardiología",
        slug: "cardiologia",
        letter: "C",
        description: "Atención integral del sistema cardiovascular.",
        fullDescription: "La cardiología se especializa en el diagnóstico y tratamiento de enfermedades del corazón y del sistema circulatorio. Contamos con tecnología de última generación para realizar estudios como ecocardiografía, electrocardiografía, pruebas de esfuerzo y cateterismos cardíacos. Tratamos condiciones como hipertensión, arritmias, insuficiencia cardíaca y enfermedad coronaria.",
        icon: "❤️"
    },
    {
        id: "4",
        name: "Cirugía General",
        slug: "cirugia-general",
        letter: "C",
        description: "Procedimientos quirúrgicos del abdomen y tejidos blandos.",
        fullDescription: "La cirugía general abarca procedimientos quirúrgicos del aparato digestivo, sistema endocrino, mama, piel y tejidos blandos. Nuestros cirujanos están especializados en técnicas mínimamente invasivas (laparoscopía) que permiten recuperaciones más rápidas y menos dolorosas. Realizamos desde apendicectomías hasta cirugías complejas de vesícula, hernias y tiroides.",
        icon: "🏥"
    },
    // D
    {
        id: "5",
        name: "Dermatología",
        slug: "dermatologia",
        letter: "D",
        description: "Cuidado de la piel, cabello y uñas.",
        fullDescription: "La dermatología es la especialidad que se ocupa del diagnóstico y tratamiento de las enfermedades de la piel, cabello, uñas y mucosas. Ofrecemos servicios tanto médicos como estéticos, incluyendo tratamiento de acné, psoriasis, eczema, cáncer de piel, así como procedimientos cosméticos y antienvejecimiento.",
        icon: "🧴"
    },
    // E
    {
        id: "6",
        name: "Endocrinología",
        slug: "endocrinologia",
        letter: "E",
        description: "Tratamiento de trastornos hormonales y metabólicos.",
        fullDescription: "La endocrinología se dedica al estudio de las glándulas de secreción interna y las hormonas que producen. Nuestros endocrinólogos tratan diabetes, trastornos de tiroides, obesidad, osteoporosis, trastornos de crecimiento y otros desórdenes hormonales. Ofrecemos planes de tratamiento personalizados y seguimiento continuo.",
        icon: "⚗️"
    },
    // G
    {
        id: "7",
        name: "Gastroenterología",
        slug: "gastroenterologia",
        letter: "G",
        description: "Especialistas en el sistema digestivo.",
        fullDescription: "La gastroenterología trata las enfermedades del aparato digestivo, que incluye esófago, estómago, intestino delgado, colon, recto, páncreas, hígado, vesícula biliar y vías biliares. Realizamos endoscopías, colonoscopías y otros procedimientos diagnósticos y terapéuticos. Tratamos reflujo, gastritis, úlceras, enfermedad de Crohn, colitis y hepatitis.",
        icon: "🫀"
    },
    {
        id: "8",
        name: "Ginecología y Obstetricia",
        slug: "ginecologia-obstetricia",
        letter: "G",
        description: "Salud femenina y atención del embarazo.",
        fullDescription: "Nuestra especialidad abarca la salud integral de la mujer, desde la adolescencia hasta la menopausia. Ofrecemos control prenatal completo, atención del parto, cirugía ginecológica, planificación familiar, tratamiento de trastornos menstruales y enfermedades del sistema reproductivo femenino. Contamos con unidad de medicina materno-fetal para embarazos de alto riesgo.",
        icon: "👶"
    },
    // N
    {
        id: "9",
        name: "Neurología",
        slug: "neurologia",
        letter: "N",
        description: "Diagnóstico y tratamiento de enfermedades del sistema nervioso.",
        fullDescription: "La neurología se especializa en el diagnóstico y tratamiento de todas las categorías de enfermedades que involucran el sistema nervioso central, periférico y autónomo. Tratamos migrañas, epilepsia, enfermedad de Parkinson, Alzheimer, esclerosis múltiple, neuropatías y trastornos del movimiento. Contamos con electroencefalografía y estudios de conducción nerviosa.",
        icon: "🧠"
    },
    {
        id: "10",
        name: "Nutrición",
        slug: "nutricion",
        letter: "N",
        description: "Asesoramiento nutricional personalizado.",
        fullDescription: "Nuestros nutricionistas ofrecen evaluación nutricional completa y planes alimentarios personalizados para control de peso, diabetes, enfermedades cardiovasculares, trastornos gastrointestinales y otras condiciones. Trabajamos en conjunto con otras especialidades para brindar un enfoque integral del cuidado de la salud.",
        icon: "🥗"
    },
    // O
    {
        id: "11",
        name: "Oftalmología",
        slug: "oftalmologia",
        letter: "O",
        description: "Cuidado integral de la salud visual.",
        fullDescription: "La oftalmología se dedica al estudio y tratamiento de las enfermedades de los ojos y la vía visual. Ofrecemos exámenes completos de la vista, cirugía de cataratas, tratamiento de glaucoma, enfermedades de la retina, córnea y segmento anterior. Contamos con tecnología láser para corrección visual y cirugías mínimamente invasivas.",
        icon: "👁️"
    },
    {
        id: "12",
        name: "Otorrinolaringología",
        slug: "otorrinolaringologia",
        letter: "O",
        description: "Especialistas en oído, nariz y garganta.",
        fullDescription: "La otorrinolaringología trata las enfermedades del oído, vías respiratorias superiores y parte de las inferiores (nariz, senos paranasales, faringe y laringe). Ofrecemos tratamiento para sinusitis, amigdalitis, hipoacusia, vértigo, ronquidos y apnea del sueño. Realizamos cirugías funcionales y estéticas nasales.",
        icon: "👂"
    },
    // P
    {
        id: "13",
        name: "Pediatría",
        slug: "pediatria",
        letter: "P",
        description: "Atención médica especializada para niños.",
        fullDescription: "La pediatría es la rama de la medicina que se especializa en la salud y las enfermedades de los niños, desde el nacimiento hasta la adolescencia. Ofrecemos control del niño sano, vacunación, tratamiento de enfermedades agudas y crónicas, y orientación a los padres sobre crecimiento, desarrollo y nutrición infantil.",
        icon: "👶"
    },
    {
        id: "14",
        name: "Psiquiatría",
        slug: "psiquiatria",
        letter: "P",
        description: "Salud mental y bienestar emocional.",
        fullDescription: "La psiquiatría se dedica al estudio, diagnóstico, tratamiento y prevención de los trastornos mentales. Nuestros psiquiatras tratan depresión, ansiedad, trastorno bipolar, esquizofrenia, trastornos del sueño y adicciones. Ofrecemos tanto terapia farmacológica como psicoterapia, con un enfoque integral y personalizado.",
        icon: "🧘"
    },
    // T
    {
        id: "15",
        name: "Traumatología",
        slug: "traumatologia",
        letter: "T",
        description: "Tratamiento de lesiones del sistema musculoesquelético.",
        fullDescription: "La traumatología y ortopedia se especializa en el diagnóstico, tratamiento, rehabilitación y prevención de lesiones y enfermedades del sistema musculoesquelético. Tratamos fracturas, esguinces, luxaciones, lesiones deportivas, artrosis y problemas de columna. Realizamos cirugías artroscópicas y reemplazos articulares con técnicas mínimamente invasivas.",
        icon: "🦴"
    },
    // U
    {
        id: "16",
        name: "Urología",
        slug: "urologia",
        letter: "U",
        description: "Especialistas en el sistema urinario y reproductor masculino.",
        fullDescription: "La urología se ocupa del estudio, diagnóstico y tratamiento de las enfermedades del aparato urinario y retroperitoneo en ambos sexos, y del aparato genital masculino. Tratamos cálculos renales, infecciones urinarias, incontinencia, disfunción eréctil, enfermedades de próstata y cáncer urológico. Ofrecemos cirugía mínimamente invasiva y tratamientos láser.",
        icon: "🫘"
    },
];

// Helper function to get specialties grouped by letter
export function getSpecialtiesByLetter(): Map<string, Specialty[]> {
    const grouped = new Map<string, Specialty[]>();

    specialties.forEach(specialty => {
        const letter = specialty.letter;
        if (!grouped.has(letter)) {
            grouped.set(letter, []);
        }
        grouped.get(letter)!.push(specialty);
    });

    // Sort specialties within each letter group
    grouped.forEach((specs, letter) => {
        grouped.set(letter, specs.sort((a, b) => a.name.localeCompare(b.name)));
    });

    return grouped;
}

// Get all unique letters with specialties
export function getAllLetters(): string[] {
    const letters = new Set(specialties.map(s => s.letter));
    return Array.from(letters).sort();
}

// Find specialty by slug
export function getSpecialtyBySlug(slug: string): Specialty | undefined {
    return specialties.find(s => s.slug === slug);
}
