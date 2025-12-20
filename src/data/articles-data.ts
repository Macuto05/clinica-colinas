// Health Articles Data - Actualizado con especialidades reales de Clínicas Colina
export interface Article {
    id: string;
    title: string;
    slug: string;
    category: string;
    excerpt: string;
    content: string;
    image: string;
    readTime: number;
    publishedAt: string;
    specialtyName: string; // Cambiado a nombre de especialidad real
    specialtyId: string;   // ID para mapeo con doctors-data
    doctorId?: string;     // ID del doctor autor (opcional)
    relatedArticles: string[];
}

export const categories = [
    "Últimas agregadas",
    "Síntomas y enfermedades",
    "Niños, niñas y adolescentes",
    "Prevención y bienestar",
    "Salud oral y dental",
    "Nutrición y alimentación",
    "Salud mental y emocional",
    "Medicina especializada"
];

// Artículos relacionados con las 8 especialidades REALES de Clínicas Colina
export const articles: Article[] = [
    // ODONTOLOGÍA (ID: 1)
    {
        id: "1",
        title: "Cuidado dental diario: Técnicas correctas de cepillado",
        slug: "cuidado-dental-diario",
        category: "Salud oral y dental",
        excerpt: "Un correcto cepillado dental previene caries y enfermedades de las encías. Aprende la técnica adecuada.",
        content: `
            <h2>¿Por qué es importante un buen cepillado?</h2>
            <p>El cepillado correcto remueve la placa bacteriana que causa caries y enfermedades de las encías.</p>
            
            <h2>Técnica correcta de cepillado</h2>
            <ul>
                <li><strong>Duración:</strong> Mínimo 2 minutos, dos veces al día</li>
                <li><strong>Ángulo:</strong> 45 grados hacia la línea de las encías</li>
                <li><strong>Movimiento:</strong> Circular suave, sin presionar fuerte</li>
                <li><strong>Superficies:</strong> Externa, interna y de masticación</li>
                <li><strong>Lengua:</strong> No olvides cepillarla</li>
            </ul>

            <h2>Hilo dental</h2>
            <p>Úsalo una vez al día para limpiar entre los dientes donde el cepillo no llega.</p>
            
            <h2>Visitas regulares</h2>
            <p>Acude al odontólogo cada 6 meses para limpieza profesional y detección temprana de problemas.</p>
        `,
        image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&h=500&fit=crop",
        readTime: 3,
        publishedAt: "2025-02-01",
        specialtyName: "Odontología",
        specialtyId: "1",
        doctorId: "5", // Rosvel Duran
        relatedArticles: ["2", "3"]
    },

    // OFTALMOLOGÍA (ID: 2)
    {
        id: "2",
        title: "Cuidado de la vista: Prevención de problemas visuales",
        slug: "cuidado-vista-prevencion",
        category: "Prevención y bienestar",
        excerpt: "La salud visual es crucial para tu calidad de vida. Conoce cómo proteger tus ojos del desgaste diario.",
        content: `
            <h2>Importancia del cuidado visual</h2>
            <p>Los ojos son órganos delicados que requieren protección y cuidados constantes.</p>
            
            <h2>Consejos para proteger tu vista</h2>
            <ul>
                <li>Usa lentes con protección UV al salir</li>
                <li>Regla 20-20-20: Cada 20 min, mira a 20 pies (6m) por 20 seg</li>
                <li>Mantén distancia adecuada de pantallas</li>
                <li>Iluminación apropiada al leer</li>
                <li>Parpadea frecuentemente para humectar</li>
            </ul>

            <h2>Alimentación para la vista</h2>
            <p>Consume alimentos ricos en vitamina A (zanahoria), omega-3 (pescado) y antioxidantes (verduras de hoja verde).</p>
            
            <h2>Exámenes regulares</h2>
            <p>Realiza un examen oftalmológico completo al menos una vez al año.</p>
        `,
        image: "https://images.unsplash.com/photo-1626682940448-fd99f5c89e6f?w=800&h=500&fit=crop",
        readTime: 4,
        publishedAt: "2025-02-03",
        specialtyName: "Oftalmología",
        specialtyId: "2",
        doctorId: "2", // Gabriela Natera
        relatedArticles: ["1", "4"]
    },

    // TRAUMATOLOGÍA (ID: 3)
    {
        id: "3",
        title: "Prevención de lesiones deportivas: Guía completa",
        slug: "prevencion-lesiones-deportivas",
        category: "Prevención y bienestar",
        excerpt: "Las lesiones deportivas son comunes pero prevenibles. Aprende cómo proteger tus articulaciones y músculos.",
        content: `
            <h2>Lesiones deportivas más comunes</h2>
            <p>Esguinces, desgarros musculares, tendinitis y fracturas por estrés.</p>
            
            <h2>Calentamiento adecuado</h2>
            <ul>
                <li>5-10 minutos de cardio ligero</li>
                <li>Estiramientos dinámicos</li>
                <li>Movimientos específicos del deporte</li>
                <li>Incremento gradual de intensidad</li>
            </ul>

            <h2>Equipamiento correcto</h2>
            <p>Usa calzado apropiado, protectores y equipo específico para tu deporte.</p>
            
            <h2>Fortalecimiento muscular</h2>
            <p>El entrenamiento de fuerza protege las articulaciones y previene lesiones.</p>

            <h2>¿Cuándo consultar?</h2>
            <p>Si el dolor persiste más de 48 horas, hay hinchazón severa o limitación de movimiento.</p>
        `,
        image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=500&fit=crop",
        readTime: 5,
        publishedAt: "2025-02-05",
        specialtyName: "Traumatología",
        specialtyId: "3",
        doctorId: "3", // Liliana Garcia
        relatedArticles: ["4", "5"]
    },

    // MEDICINA INTERNA (ID: 4)
    {
        id: "4",
        title: "Control de diabetes: Manejo y estilo de vida",
        slug: "control-diabetes-manejo",
        category: "Síntomas y enfermedades",
        excerpt: "La diabetes requiere un manejo integral. Conoce cómo controlarla efectivamente.",
        content: `
            <h2>¿Qué es la diabetes?</h2>
            <p>Condición crónica donde el cuerpo no puede regular adecuadamente el azúcar en sangre.</p>
            
            <h2>Control de glucosa</h2>
            <ul>
                <li>Mide tu glucosa según indicación médica</li>
                <li>Mantén un registro de tus niveles</li>
                <li>Conoce tus metas personalizadas</li>
                <li>Ajusta tratamiento con tu médico</li>
            </ul>

            <h2>Alimentación para diabéticos</h2>
            <p>• Carbohidratos complejos en porciones moderadas<br>
            • Abundantes vegetales y fibra<br>
            • Proteínas magras<br>
            • Evita azúcares refinados<br>
            • Horarios regulares de comidas</p>
            
            <h2>Ejercicio regular</h2>
            <p>30 minutos diarios de actividad moderada mejoran la sensibilidad a la insulina.</p>

            <h2>Complicaciones a prevenir</h2>
            <p>Con buen control evitas daño renal, visual, nervioso y cardiovascular.</p>
        `,
        image: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&h=500&fit=crop",
        readTime: 6,
        publishedAt: "2025-02-07",
        specialtyName: "Medicina Interna",
        specialtyId: "4",
        doctorId: "9", // Liurka Silva
        relatedArticles: ["5", "6"]
    },

    // CIRUGÍA PLÁSTICA (ID: 5)
    {
        id: "5",
        title: "Cirugía plástica reconstructiva: Más que estética",
        slug: "cirugia-plastica-reconstructiva",
        category: "Medicina especializada",
        excerpt: "La cirugía plástica no solo mejora la apariencia, también restaura función y calidad de vida.",
        content: `
            <h2>Tipos de cirugía plástica</h2>
            <p>Estética (mejora apariencia) y Reconstructiva (restaura función).</p>
            
            <h2>Cirugía reconstructiva</h2>
            <ul>
                <li><strong>Quemaduras:</strong> Injertos y reconstrucción</li>
                <li><strong>Cáncer:</strong> Reconstrucción mamaria, facial</li>
                <li><strong>Malformaciones:</strong> Corrección de defectos congénitos</li>
                <li><strong>Traumatismos:</strong> Reparación de tejidos</li>
            </ul>

            <h2>Preparación para cirugía</h2>
            <p>• Evaluación médica completa<br>
            • Suspender tabaco 4 semanas antes<br>
            • Ajustar medicamentos según indicación<br>
            • Planificar recuperación con apoyo</p>
            
            <h2>Recuperación</h2>
            <p>Sigue las indicaciones médicas, asiste a controles y ten paciencia con los resultados.</p>

            <h2>Expectativas realistas</h2>
            <p>Una consulta detallada con el especialista es clave para entender qué se puede lograr.</p>
        `,
        image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&h=500&fit=crop",
        readTime: 5,
        publishedAt: "2025-02-09",
        specialtyName: "Cirugía Plástica",
        specialtyId: "5",
        doctorId: "8", // Beverly Bruzual
        relatedArticles: ["3", "7"]
    },

    // GASTROENTEROLOGÍA (ID: 6)
    {
        id: "6",
        title: "Salud digestiva: Síndrome de intestino irritable",
        slug: "salud-digestiva-intestino-irritable",
        category: "Síntomas y enfermedades",
        excerpt: "El síndrome de intestino irritable afecta la calidad de vida. Aprende a manejarlo efectivamente.",
        content: `
            <h2>¿Qué es el SII?</h2>
            <p>Trastorno funcional del intestino que causa dolor abdominal, gases y cambios en hábitos intestinales.</p>
            
            <h2>Síntomas principales</h2>
            <ul>
                <li>Dolor o cólicos abdominales</li>
                <li>Hinchazón y gases</li>
                <li>Diarrea o estreñimiento (o ambos alternados)</li>
                <li>Moco en las heces</li>
                <li>Urgencia para defecar</li>
            </ul>

            <h2>Dieta FODMAP</h2>
            <p>Reduce alimentos fermentables que causan gases: lácteos, trigo, legumbres, cebolla, ajo.</p>
            
            <h2>Manejo del estrés</h2>
            <p>El SII empeora con estrés. Practica relajación, ejercicio y mindfulness.</p>

            <h2>Cuándo consultar</h2>
            <p>Si hay pérdida de peso, sangre en heces, fiebre o síntomas nocturnos.</p>
        `,
        image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=500&fit=crop",
        readTime: 5,
        publishedAt: "2025-02-11",
        specialtyName: "Gastroenterología",
        specialtyId: "6",
        doctorId: "6", // Jorge Ramirez
        relatedArticles: ["4", "8"]
    },

    // TERAPIA INTENSIVA (ID: 7)
    {
        id: "7",
        title: "Cuidados intensivos: Qué esperar y cómo apoyar",
        slug: "cuidados-intensivos-guia",
        category: "Medicina especializada",
        excerpt: "Las unidades de cuidados intensivos pueden ser intimidantes. Esta guía ayuda a familias y pacientes.",
        content: `
            <h2>¿Qué es la UCI?</h2>
            <p>Área hospitalaria con monitoreo y tratamiento continuo para pacientes en estado crítico.</p>
            
            <h2>Razones de ingreso</h2>
            <ul>
                <li>Postoperatorio de cirugías complejas</li>
                <li>Insuficiencia respiratoria</li>
                <li>Shock o falla de órganos</li>
                <li>Traumatismos graves</li>
                <li>Sepsis o infecciones severas</li>
            </ul>

            <h2>El equipo de la UCI</h2>
            <p>Intensivistas, enfermeras especializadas, terapeutas respiratorios y otros especialistas.</p>
            
            <h2>Para familiares</h2>
            <p>• Pregunta todas tus dudas al equipo médico<br>
            • Respeta horarios de visita<br>
            • Cuida tu propia salud durante este tiempo<br>
            • Mantén comunicación con el equipo</p>

            <h2>Recuperación</h2>
            <p>Después de la UCI puede haber rehabilitación física y emocional.</p>
        `,
        image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&h=500&fit=crop",
        readTime: 4,
        publishedAt: "2025-02-13",
        specialtyName: "Terapia Intensiva",
        specialtyId: "7",
        doctorId: "12", // Milagros Rangel
        relatedArticles: ["5", "8"]
    },

    // NEONATOLOGÍA (ID: 8)
    {
        id: "8",
        title: "Cuidados del recién nacido: Primeros días de vida",
        slug: "cuidados-recien-nacido",
        category: "Niños, niñas y adolescentes",
        excerpt: "Los primeros días del bebé son cruciales. Conoce los cuidados esenciales para tu recién nacido.",
        content: `
            <h2>Primeras horas de vida</h2>
            <p>El contacto piel con piel inmediato favorece el vínculo y la lactancia.</p>
            
            <h2>Lactancia materna</h2>
            <ul>
                <li>Inicio dentro de la primera hora de vida</li>
                <li>A demanda, sin horarios fijos</li>
                <li>5-12 tomas en 24 horas</li>
                <li>Duración variable por toma</li>
                <li>Postura correcta para evitar dolor</li>
            </ul>

            <h2>Higiene del bebé</h2>
            <p>• Baño con agua tibia 2-3 veces por semana<br>
            • Limpieza del cordón umbilical<br>
            • Cambio frecuente de pañales<br>
            • Uso de productos suaves</p>
            
            <h2>Sueño seguro</h2>
            <p>Boca arriba, en superficie firme, sin almohadas ni objetos sueltos.</p>

            <h2>Señales de alerta</h2>
            <p>Consulta si hay fiebre, rechazo de alimento, llanto inconsolable o coloración azulada.</p>

            <h2>Controles médicos</h2>
            <p>Tamiz neonatal, vacunas y chequeos regulares son fundamentales.</p>
        `,
        image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&h=500&fit=crop",
        readTime: 6,
        publishedAt: "2025-02-15",
        specialtyName: "Neonatología",
        specialtyId: "8",
        doctorId: "11", // Andreina Mac-Quhae
        relatedArticles: ["2", "6"]
    }
];

// Helper functions
export function getArticlesByCategory(category: string): Article[] {
    if (category === "Últimas agregadas") {
        return [...articles].sort((a, b) =>
            new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        ).slice(0, 6);
    }
    return articles.filter(article => article.category === category);
}

export function getArticleBySlug(slug: string): Article | undefined {
    return articles.find(article => article.slug === slug);
}

export function getRelatedArticles(articleId: string): Article[] {
    const article = articles.find(a => a.id === articleId);
    if (!article) return [];

    return article.relatedArticles
        .map(id => articles.find(a => a.id === id))
        .filter((a): a is Article => a !== undefined);
}

export function getFeaturedArticles(count: number = 3): Article[] {
    return [...articles]
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, count);
}

export function getArticlesBySpecialty(specialtyName: string): Article[] {
    return articles.filter(article => article.specialtyName === specialtyName);
}
