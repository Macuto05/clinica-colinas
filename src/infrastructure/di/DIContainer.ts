/**
 * Dependency Injection Container
 * 
 * Manages dependency injection for the application following Clean Architecture.
 */

// Repositories
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { IDoctorRepository } from '@/domain/repositories/IDoctorRepository';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { ISpecialityRepository } from '@/domain/repositories/ISpecialityRepository';

import { PrismaUserRepository } from '../database/prisma/repositories/PrismaUserRepository';
import { PrismaDoctorRepository } from '../database/prisma/repositories/PrismaDoctorRepository';
import { PrismaAppointmentRepository } from '../database/prisma/repositories/PrismaAppointmentRepository';
import { PrismaSpecialityRepository } from '../database/prisma/repositories/PrismaSpecialityRepository';

// Use Cases - Auth
import { RegisterUser } from '@/application/use-cases/auth/RegisterUser';
import { LoginUser } from '@/application/use-cases/auth/LoginUser';

// Use Cases - Patient
import { GetUserProfile } from '@/application/use-cases/patient/GetUserProfile';
import { UpdateUserProfile } from '@/application/use-cases/patient/UpdateUserProfile';

// Use Cases - Appointment
import { ScheduleAppointment } from '@/application/use-cases/appointment/ScheduleAppointment';
import { CancelAppointment } from '@/application/use-cases/appointment/CancelAppointment';
import { GetAppointmentsByPatient } from '@/application/use-cases/appointment/GetAppointmentsByPatient';
import { GetAppointmentsByDoctor } from '@/application/use-cases/appointment/GetAppointmentsByDoctor';

// Use Cases - Doctor
import { GetDoctorsBySpeciality } from '@/application/use-cases/doctor/GetDoctorsBySpeciality';
// import { GetDoctorAvailability } from '@/application/use-cases/doctor/GetDoctorAvailability';

class DIContainer {
    // Repositories (Singleton instances)
    private userRepository: IUserRepository;
    private doctorRepository: IDoctorRepository;
    private appointmentRepository: IAppointmentRepository;
    private specialityRepository: ISpecialityRepository;

    constructor() {
        // Initialize repositories
        this.userRepository = new PrismaUserRepository();
        this.doctorRepository = new PrismaDoctorRepository();
        this.appointmentRepository = new PrismaAppointmentRepository();
        this.specialityRepository = new PrismaSpecialityRepository();
    }

    // Repository Getters
    getUserRepository(): IUserRepository {
        return this.userRepository;
    }

    getDoctorRepository(): IDoctorRepository {
        return this.doctorRepository;
    }

    getAppointmentRepository(): IAppointmentRepository {
        return this.appointmentRepository;
    }

    getSpecialityRepository(): ISpecialityRepository {
        return this.specialityRepository;
    }

    // Use Case Factory Methods - Auth
    getRegisterUserUseCase(): RegisterUser {
        return new RegisterUser(this.userRepository);
    }

    getLoginUserUseCase(): LoginUser {
        return new LoginUser(this.userRepository);
    }

    // Use Case Factory Methods - Patient
    getGetUserProfileUseCase(): GetUserProfile {
        return new GetUserProfile(this.userRepository);
    }

    getUpdateUserProfileUseCase(): UpdateUserProfile {
        return new UpdateUserProfile(this.userRepository);
    }

    // Use Case Factory Methods - Appointment
    getScheduleAppointmentUseCase(): ScheduleAppointment {
        return new ScheduleAppointment(
            this.appointmentRepository,
            this.userRepository,
            this.doctorRepository
        );
    }

    getCancelAppointmentUseCase(): CancelAppointment {
        return new CancelAppointment(this.appointmentRepository, this.userRepository);
    }

    getGetAppointmentsByPatientUseCase(): GetAppointmentsByPatient {
        return new GetAppointmentsByPatient(this.appointmentRepository);
    }

    getGetAppointmentsByDoctorUseCase(): GetAppointmentsByDoctor {
        return new GetAppointmentsByDoctor(this.appointmentRepository);
    }

    // Use Case Factory Methods - Doctor
    getGetDoctorsBySpecialityUseCase(): GetDoctorsBySpeciality {
        return new GetDoctorsBySpeciality(this.doctorRepository, this.specialityRepository);
    }

    // getGetDoctorAvailabilityUseCase logic moved or removed as Schedule entity is gone.
    // We might need a new implementation based on Appointment slots? 
    // For now, I'll remove it to fix build.
}

// Export singleton instance
export const container = new DIContainer();
