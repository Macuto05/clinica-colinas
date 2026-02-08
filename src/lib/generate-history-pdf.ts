import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CLINICAL_HISTORY_SECTIONS, ClinicalField } from "./clinical-history-config";

interface PatientData {
    nombres: string;
    apellidos: string;
    cedula: string;
    fechaNacimiento: Date | string;
    sexo?: string;
}

export const generateClinicalHistoryPDF = (patient: PatientData, historyContent: Record<string, any>) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Helper for Age
    const calcAge = (dob: Date | string) => {
        if (!dob) return "";
        const diff = Date.now() - new Date(dob).getTime();
        const ageDate = new Date(diff);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    // --- HEADER ---
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("COLINA", 20, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Clínica Colina / RIF: J-12345678-9", 20, 26); // Generic info if not provided

    // Title Box
    doc.setFillColor(240, 240, 240);
    doc.rect(pageWidth - 80, 10, 60, 15, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("HISTORIA CLÍNICA", pageWidth - 70, 20);

    // Date/Code Box
    doc.rect(pageWidth - 80, 25, 60, 12);
    doc.setFontSize(8);
    doc.text("FECHA: " + new Date().toLocaleDateString(), pageWidth - 78, 30);
    doc.text("CÓDIGO: " + (patient.cedula || ""), pageWidth - 78, 35);

    // Patient Info Table
    autoTable(doc, {
        startY: 45,
        head: [['Apellidos', 'Nombres', 'Edad', 'C.I.']],
        body: [[
            patient.apellidos,
            patient.nombres,
            calcAge(patient.fechaNacimiento) + " años",
            patient.cedula
        ]],
        theme: 'grid',
        headStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 2 }
    });

    // --- CONTENT ---
    let finalY = (doc as any).lastAutoTable.finalY + 5;

    // Instructions
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("Marque con X los hallazgos positivos y describa en las observaciones.", 14, finalY);
    finalY += 5;

    // Iterate Sections
    CLINICAL_HISTORY_SECTIONS.forEach(section => {
        // Section Header
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setFillColor(230, 255, 230); // Light Lime
        doc.rect(14, finalY, pageWidth - 28, 7, "F");
        doc.text(section.title, 16, finalY + 5);
        finalY += 8;

        // Prepare Grid Data
        // We want 2 columns of ITEMS.
        // Format: [ [Check1, Item1, Note1, Check2, Item2, Note2] ]
        // Wait, 3 columns per item? Check, Label, Note? 
        // Or 2 columns: Check+Label, Note.
        // The dense format in image 1 is just LIST of items.
        // Let's try to fit 3 items per row to save space? Or 2.
        // Image shows 2 columns.

        const rows = [];
        const fields = section.fields;
        const half = Math.ceil(fields.length / 2);

        for (let i = 0; i < half; i++) {
            const field1 = fields[i];
            const field2 = fields[i + half]; // Can be undefined

            const getCellData = (f: ClinicalField | undefined) => {
                if (!f) return { check: "", label: "", note: "" };

                const val = historyContent[f.id];
                let checked = "";
                let note = "";

                if (f.type === 'checkbox') {
                    if (val?.checked) checked = "X";
                    if (val?.text) note = val.text;
                } else {
                    // Text only
                    if (val && typeof val === 'string' && val.trim() !== '') {
                        checked = "•"; // Mark as present if text exists
                        note = val;
                    } else if (val?.text) {
                        checked = "•";
                        note = val.text;
                    }
                }

                return { check: checked, label: f.label, note: note };
            };

            const c1 = getCellData(field1);
            const c2 = getCellData(field2);

            rows.push([
                c1.check, c1.label, c1.note,
                c2.check, c2.label, c2.note
            ]);
        }

        autoTable(doc, {
            startY: finalY,
            head: [['', 'Item', 'Observación', '', 'Item', 'Observación']],
            body: rows,
            theme: 'grid',
            headStyles: {
                fillColor: [245, 245, 245],
                textColor: 100,
                fontSize: 7,
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' }, // Check 1
                1: { cellWidth: 40, fontSize: 8 }, // Label 1
                2: { cellWidth: 'auto', fontSize: 8, fontStyle: 'italic' }, // Note 1
                3: { cellWidth: 8, halign: 'center', fontStyle: 'bold' }, // Check 2
                4: { cellWidth: 40, fontSize: 8 }, // Label 2
                5: { cellWidth: 'auto', fontSize: 8, fontStyle: 'italic' }  // Note 2
            },
            styles: { overflow: 'linebreak' },
            margin: { left: 14, right: 14 }
        });

        finalY = (doc as any).lastAutoTable.finalY + 5;
    });

    // Save
    doc.save(`Historia_Clinica_${patient.cedula || "Paciente"}.pdf`);
};
