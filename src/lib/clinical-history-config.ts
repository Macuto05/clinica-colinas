export interface ClinicalField {
    id: string; // CamelCase ID
    label: string;
    type: 'checkbox' | 'text' | 'textarea' | 'radio' | 'group';
    options?: string[]; // For radio/select
    subfields?: ClinicalField[]; // If group
}

export interface ClinicalSection {
    id: string; // section_1_antecedentes
    title: string;
    fields: ClinicalField[];
}

// Helper to quick create Checkbox + Note
const checkField = (label: string): ClinicalField => ({
    id: label.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    label,
    type: 'checkbox'
});

// Helper for Text Input (Physical Exam)
const textField = (label: string): ClinicalField => ({
    id: label.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    label,
    type: 'text'
});

export const CLINICAL_HISTORY_SECTIONS: ClinicalSection[] = [
    // --- PART 1 ---
    {
        id: "1_antecedentes_personales",
        title: "1. ANTECEDENTES PERSONALES",
        fields: [
            checkField("Adenitis"), checkField("Alergia"), checkField("Amigdalitis"),
            checkField("Artritis"), checkField("Asma"), checkField("Bilarzia"),
            checkField("Blenorragia"), checkField("Bronquitis"), checkField("Buba"),
            checkField("Catarros"), checkField("Chagas"), checkField("Chancro"),
            checkField("Difteria"), checkField("Diarrea"), checkField("Hansen"),
            checkField("Influenza"), checkField("Lechina"), checkField("Necatoriasis"),
            checkField("Neumonía"), checkField("Otitis"), checkField("Paludismo"),
            checkField("Parásitos"), checkField("Parotiditis"), checkField("Pleuresía"),
            checkField("Quirúrgicos"), checkField("Rinofaringitis"), checkField("Rubeola"),
            checkField("Sarampión"), checkField("Sífilis"), checkField("Síndromes Disentéricos"),
            checkField("T.B.C"), checkField("Tifoidea"), checkField("Tosferina"),
            checkField("Traumatismo"), checkField("Vacunaciones"),
            { ...checkField("Otros"), type: 'text' } // Override "Otros" to be text
        ]
    },
    {
        id: "2_antecedentes_familiares",
        title: "2. ANTECEDENTES FAMILIARES",
        fields: [
            checkField("Alergia"), checkField("Artritis"), checkField("Cáncer"),
            checkField("Cardio - Vasculares"), checkField("Diabetes"), checkField("Enf. Digestivas"),
            checkField("Enf. Renales"), checkField("SIDA"), checkField("Neuromentales"),
            checkField("Sífilis"), checkField("T.B.C"),
            { ...checkField("Otros"), type: 'text' }
        ]
    },
    {
        id: "3_habitos_psicobiologicos",
        title: "3. HÁBITOS PSICOBIOLÓGICOS",
        fields: [
            checkField("Alcohólicos"), checkField("Tabáquicos"), checkField("Deportes"),
            checkField("Drogas"), checkField("Ocupación"), checkField("Prob. Familiares"),
            checkField("Rasgos Personales"), checkField("Sexuales"), checkField("Siesta"),
            checkField("Sueños"), checkField("Costumbres"), checkField("Religión"),
            { ...checkField("Otros"), type: 'text' }
        ]
    },
    {
        id: "4_examen_funcional_general",
        title: "4. EXAMEN FUNCIONAL - GENERAL",
        fields: [
            checkField("Aumento de Peso"), checkField("Fiebre"), checkField("Nutrición"),
            checkField("Pérdida de Peso"), checkField("Sudores Nocturnos"), checkField("Temblores"),
            { ...checkField("Otros"), type: 'text' }
        ]
    },
    {
        id: "5_examen_funcional_piel",
        title: "5. PIEL",
        fields: [
            checkField("Cianosis"), checkField("Edemas"), checkField("Erupciones"),
            checkField("Pigmentaciones"), checkField("Prurito"), { ...checkField("Otros"), type: 'text' }
        ]
    },
    {
        id: "6_examen_funcional_cabeza",
        title: "6. CABEZA",
        fields: [
            checkField("Caída del Cabello"), checkField("Cefalea"), checkField("Mareos"),
            checkField("Sincope"), checkField("Traumas"), { ...checkField("Otros"), type: 'text' }
        ]
    },
    {
        id: "7_examen_funcional_ojos",
        title: "7. OJOS",
        fields: [
            checkField("Amaurosis"), checkField("Anteojos"), checkField("Cansancio Ocular"),
            checkField("Diplopía"), checkField("Dolor"), checkField("Fotofobia"),
            checkField("Lagrimeo"), { ...checkField("Otros"), type: 'text' }
        ]
    },
    {
        id: "8_examen_funcional_oidos",
        title: "8. OÍDOS",
        fields: [
            checkField("Dolor"), checkField("Secreciones"), checkField("Sordera"),
            checkField("Tinitus"), checkField("Vértigo"), { ...checkField("Otros"), type: 'text' }
        ]
    },
    {
        id: "9_examen_funcional_nariz",
        title: "9. NARIZ",
        fields: [
            checkField("Catarros"), checkField("Epistaxis"), checkField("Obstrucciones"),
            checkField("Secreción Nasal"), checkField("Sinusitis"), { ...checkField("Otros"), type: 'text' }
        ]
    },
    {
        id: "10_examen_funcional_boca",
        title: "10. BOCA",
        fields: [
            checkField("Dientes"), checkField("Halitosis"), checkField("Mucosas"), { ...checkField("Otros"), type: 'text' }
        ]
    },
    {
        id: "11_examen_funcional_garganta",
        title: "11. GARGANTA",
        fields: [
            checkField("Disfagia"), checkField("Dolor"), checkField("Ronqueras"), { ...checkField("Otros"), type: 'text' }
        ]
    },
    {
        id: "12_examen_funcional_respiratorio",
        title: "12. RESPIRATORIO",
        fields: [
            checkField("Disnea"), checkField("Dolor en el Pecho"), checkField("Esputos"),
            checkField("Hemoptisis"), checkField("Tos"), { ...checkField("Otros"), type: 'text' }
        ]
    },
    {
        id: "13_examen_funcional_osteomuscular",
        title: "13. OSTEOMUSCULAR",
        fields: [
            checkField("Artralgias"), checkField("Debilidad"), checkField("Mialgias"),
            checkField("Deformidades"), { ...checkField("Otros"), type: 'text' }
        ]
    },
    {
        id: "14_examen_funcional_cardiovascular",
        title: "14. CARDIOVASCULAR",
        fields: [
            checkField("Angustias"), checkField("Disnea"), checkField("Dolor"),
            checkField("Palpitaciones"), checkField("Taquicardia"), checkField("Vértigo"),
            checkField("Claudicación"), checkField("Varicosidades"), { ...checkField("Otros"), type: 'text' }
        ]
    },
    {
        id: "15_examen_funcional_gastrointestinal",
        title: "15. GASTROINTESTINAL",
        fields: [
            checkField("Apetito"), checkField("Constipación"), checkField("Diarrea"),
            checkField("Dolor"),
            // Heces Tipo Group?
            checkField("Heces: Color"), checkField("Heces: Sangre"), checkField("Heces: Mucosidad"),
            checkField("Eructos"), checkField("Flatulencia"), checkField("Hemorroides"),
            checkField("Hernias"), checkField("Malestar"), checkField("Nauseas"),
            checkField("Parásitos"), checkField("Pirosis"), checkField("Vómitos"),
            { ...checkField("Otros"), type: 'text' }
        ]
    },
    {
        id: "16_examen_funcional_genitourinario",
        title: "16. GENITOURINARIO",
        fields: [
            checkField("Dolor"), checkField("Enuresis"), checkField("Hematuria"),
            checkField("Incontinencia"), checkField("Micciones"), checkField("Nicturia"),
            checkField("Piuria"), checkField("Secreciones"), checkField("Ulceras"),
            { ...checkField("Otros"), type: 'text' }
        ]
    },
    {
        id: "17_examen_funcional_ginecologicos",
        title: "17. GINECOLÓGICOS",
        fields: [
            checkField("Menarquia"), checkField("Abortos"), checkField("Partos"),
            checkField("Dispareunia"), checkField("Frigidez"), checkField("Menopausia"),
            // Reglas Group
            checkField("Reglas: Cantidad"), checkField("Reglas: Dolor"), { ...checkField("Última Regla"), type: 'text' },
            checkField("Flujo"), { ...checkField("Otros"), type: 'text' }
        ]
    },
    {
        id: "18_examen_funcional_nervioso",
        title: "18. NERVIOSO Y MENTAL",
        fields: [
            checkField("Convulsiones"), checkField("Estáticas"), checkField("Estado Emocional"),
            checkField("Marcha"), checkField("Parálisis"), checkField("Temblor"),
            checkField("Tics"), checkField("Tipo de Personalidad"), checkField("Parestesias"),
            { ...checkField("Otros"), type: 'text' }
        ]
    },

    // --- PART 2: EXAMEN FÍSICO (Likely descriptive text inputs) ---
    {
        id: "p2_1_examen_fisico_general",
        title: "1. EXAMEN FÍSICO GENERAL",
        fields: [
            textField("Color"), textField("Humedad"), textField("Contextura"),
            textField("Temperatura"), textField("Pigmentación"), textField("Equimosis"),
            textField("Cianosis"), textField("Petequias"), textField("Erupción"),
            textField("Uñas"), textField("Nódulos"), textField("Vascularización"),
            textField("Cicatrices"), textField("Fistulas"), textField("Ulceras"),
            textField("Otros")
        ]
    },
    {
        id: "p2_2_cabeza",
        title: "2. CABEZA",
        fields: [
            textField("Configuración"), textField("Fontanelas"), textField("Reblandecimiento"),
            textField("Circunferencia"), textField("Dolor"), textField("Cabello"), textField("Otros")
        ]
    },
    {
        id: "p2_3_ojos",
        title: "3. OJOS",
        fields: [
            textField("Conjuntiva"), textField("Esclerótica"), textField("Cornea"),
            textField("Movimientos"), textField("Desviación"), textField("Nistagmos"),
            textField("Ptosis"), textField("Exoftalmos"), textField("Agudeza Visual"),
            textField("Oftalmoscópicos"), textField("Otros")
        ]
    },
    {
        id: "p2_4_oidos",
        title: "4. OÍDOS",
        fields: [
            textField("Pabellón"), textField("Conducto Externo"), textField("Tímpano"),
            textField("Audición"), textField("Secreciones"), textField("Mastoides"),
            textField("Dolor"), textField("Otros")
        ]
    },
    {
        id: "p2_5_nariz",
        title: "5. NARIZ",
        fields: [
            textField("Fosas Nasales"), textField("Mucosas"), textField("Tabique"),
            textField("Meatos"), textField("Diafanoscopia"), textField("Sensibilidad Senos"),
            textField("Secreción Nasal"), textField("Otros")
        ]
    },
    {
        id: "p2_6_boca",
        title: "6. BOCA",
        fields: [
            textField("Aliento"), textField("Labios"), textField("Dientes"),
            textField("Encías"), textField("Mucosas"), textField("Lengua"),
            textField("Conductos Salivales"), textField("Parálisis y Trismo"), textField("Otros")
        ]
    },
    {
        id: "p2_7_faringe",
        title: "7. FARINGE",
        fields: [
            textField("Amígdalas"), textField("Adenoides"), textField("Rino-Faringe"),
            textField("Disfagia"), textField("Dolor"), textField("Otros")
        ]
    },
    {
        id: "p2_8_cuello",
        title: "8. CUELLO",
        fields: [
            textField("Movilidad"), textField("Ganglios"), textField("Tiroides"),
            textField("Vasos"), textField("Tráquea"), textField("Otros")
        ]
    },
    {
        id: "p2_9_ganglios",
        title: "9. GANGLIOS LINFÁTICOS",
        fields: [
            textField("Cervicales"), textField("Occipitales"), textField("Supraclaviculares"),
            textField("Axilares"), textField("Epitrocleares"), textField("Inguinales"), textField("Otros")
        ]
    },
    {
        id: "p2_10_torax",
        title: "10. TÓRAX",
        fields: [
            textField("Forma"), textField("Simetría"), textField("Expansión"),
            textField("Palpitación"), textField("Respiración"), textField("Otros")
        ]
    },
    {
        id: "p2_11_senos",
        title: "11. SENOS",
        fields: [
            textField("Nódulos"), textField("Secreciones"), textField("Pezones"), textField("Otros")
        ]
    },
    {
        id: "p2_12_pulmones",
        title: "12. PULMONES",
        fields: [
            textField("Frémito"), textField("Percusión"), textField("Auscultación"),
            textField("Ruidos Adventicios"), textField("Pectoriloquia afona"), textField("Broncofonía"),
            textField("Otros")
        ]
    },
    {
        id: "p2_13_corazon",
        title: "13. CORAZÓN",
        fields: [
            textField("Latido de la Punta"), textField("Trill"), textField("Pulsación"),
            textField("Ritmo"), textField("Ruidos"), textField("Galope"),
            textField("Frotes"), textField("Otros")
        ]
    },
    {
        id: "p2_14_vasos",
        title: "14. VASOS SANGUÍNEOS",
        fields: [
            textField("Pulso"), textField("Paredes Vasculares"), textField("Caracteres"), textField("Otros")
        ]
    },
    {
        id: "p2_15_abdomen",
        title: "15. ABDOMEN",
        fields: [
            textField("Aspecto"), textField("Circunferencia"), textField("Peristalsis"),
            textField("Cicatrices"), textField("Defensa"), textField("Sensibilidad"),
            textField("Contractura"), textField("Tumoraciones"), textField("Ascitis"),
            textField("Hígado"), textField("Riñones"), textField("Bazo"),
            textField("Hernias"), textField("Otros")
        ]
    },
    {
        id: "p2_16_genitales_masculinos",
        title: "16. GENITALES MASCULINOS",
        fields: [
            textField("Cicatrices"), textField("Lesiones"), textField("Secreciones"),
            textField("Escroto"), textField("Epidídimo"), textField("Deferentes"),
            textField("Testículos"), textField("Próstata"), textField("Seminales"), textField("Otros")
        ]
    },
    {
        id: "p2_17_genitales_femeninos",
        title: "17. GENITALES FEMENINOS",
        fields: [
            textField("Labios"), textField("Bartholino"), textField("Periné"),
            textField("Vagina"), textField("Cuello"), textField("Útero"),
            textField("Anexos"), textField("Parámetros"), textField("Douglas"), textField("Otros")
        ]
    },
    {
        id: "p2_18_recto",
        title: "18. RECTO",
        fields: [
            textField("Fisuras"), textField("Fistulas"), textField("Hemorroides"),
            textField("Esfínter"), textField("Tumoraciones"), textField("Prolapso"),
            textField("Heces"), textField("Otros")
        ]
    },
    {
        id: "p2_19_huesos",
        title: "19. HUESOS, ARTICULACIONES Y MUSC.",
        fields: [
            textField("Deformidades"), textField("Inflamaciones"), textField("Rubicundez"),
            textField("Sensibilidad"), textField("Movimientos"), textField("Masa Musculares"), textField("Otros")
        ]
    },
    {
        id: "p2_20_extremidades",
        title: "20. EXTREMIDADES",
        fields: [
            textField("Color"), textField("Edema"), textField("Temblor"),
            textField("Deformidades"), textField("Ulceras"), textField("Varices"), textField("Otros")
        ]
    },
    {
        id: "p2_21_neurologico",
        title: "21. NEUROLÓGICO Y PSÍQUICO",
        fields: [
            textField("Sensib. Objetiva"), textField("Motividad"), textField("Reflejos"),
            textField("Escritura"), textField("Tróficos"), textField("Marcha"),
            textField("Romberg"), textField("Orientación"), textField("Lenguaje"),
            textField("Coordinación"), textField("Otros")
        ]
    }
];
