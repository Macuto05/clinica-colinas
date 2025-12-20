// Clinic information constants

export const CLINIC_INFO = {
    name: "Clínicas Colina",
    address: {
        street: "Avenida Guzmán Lander",
        city: "Barcelona",
        state: "Anzoátegui",
        postalCode: "6001",
        country: "Venezuela",
        full: "Avenida Guzmán Lander, Barcelona 6001, Anzoátegui - Venezuela",
    },
    contact: {
        phones: ["0424-8034955", "0424-8034910"],
        email: "contacto@clinicascolina.com",
        emergencyPhone: "0424-8034955", // Usar el primer número para emergencias
    },
    hours: {
        weekdays: "Lunes a Viernes: 7:00 AM - 7:00 PM",
        saturday: "Sábado: 8:00 AM - 2:00 PM",
        sunday: "Domingo: Cerrado",
        emergency: "Emergencias 24/7",
    },
    social: {
        // Agregar cuando tengan redes sociales
        facebook: "",
        instagram: "",
        twitter: "",
    },
} as const;
