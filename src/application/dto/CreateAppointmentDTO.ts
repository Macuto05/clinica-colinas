/**
 * DTO: Create Appointment
 */

export interface CreateAppointmentDTO {
    patientId: number;
    doctorId: number;
    date: Date;
    startTime: string; // HH:MM
    endTime: string;   // HH:MM
    type: string;      // CONSULTA, CONTROL, etc.
    origin?: string;   // WEB, RECEPCION
    reason?: string;
}
