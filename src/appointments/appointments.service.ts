import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { User } from 'src/users/entities/user.entity';


@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,

    @InjectRepository(User)
    private userRepository: Repository<User>, 
  ) {}
  //aca se crea una cita
  async create(createAppointmentDto: CreateAppointmentDto) {
    const { date, reason, notes, userId, doctorId } = createAppointmentDto;

    // Verificar que el doctor existe y tiene el rol correcto
    const doctor = await this.userRepository.findOne({ where: { id: doctorId } });
    if (!doctor || doctor.role !== 'DOCTOR') {
      throw new NotFoundException('Doctor not found or incorrect role');
    }

    // Verificar que el paciente existe y tiene el rol correcto
    const patient = await this.userRepository.findOne({ where: { id: userId } });
    if (!patient || patient.role !== 'PATIENT') {
      throw new NotFoundException('Paciente no encontrado o rol incorrecto');
    }

    // Verificar citas conflictivas en el mismo rango horario
    const conflictingAppointment = await this.appointmentRepository.createQueryBuilder('appointment')
      .where('appointment.doctorId = :doctorId', { doctorId })
      .andWhere('appointment.date BETWEEN :startDate AND :endDate', {
        startDate: date,
        endDate: this.addOneHour(date),
      })
      .andWhere('appointment.deletedAt IS NULL')
      .getOne();

    if (conflictingAppointment) {
      throw new ForbiddenException('Este horario ya está ocupado por otra cita');
    }

    const appointment = this.appointmentRepository.create({
      date,
      reason,
      notes,
      user: patient,
      doctor,
    });

    await this.appointmentRepository.save(appointment);

    return `Se ha creado la cita con el doctor ${doctor.username} para el paciente ${patient.username} a las ${date}`;
  }


  private addOneHour(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() + 1);
    return newDate;
  }

  
  //aca buscar a todos
  
  async findAll() {
    const appointments = await this.appointmentRepository.find();
    if (!appointments.length) {
      throw new NotFoundException('No se encontraron citas');
    }
    return appointments;
  }

  //buscar por id
  async findOne(id: number) {
    const appointment = await this.appointmentRepository.findOne({ where: { id, deletedAt: null } });
    if (!appointment) {
      throw new NotFoundException(`Cita con id ${id} no encontrada`);
    }
    return appointment;
  }

  //buscar por filtros
  async filterAppointments(filters: { date?: string; doctorId?: number; reason?: string }) {
    try{
      const query = this.appointmentRepository.createQueryBuilder('appointment')
        .leftJoinAndSelect('appointment.user', 'user')
        .leftJoinAndSelect('appointment.doctor', 'doctor')
        .where('appointment.deletedAt IS NULL');
    
      if (filters.date) {
        query.andWhere('DATE(appointment.date) = :date', { date: filters.date });
      }
    
      if (filters.doctorId) {
        query.andWhere('doctor.id = :doctorId', { doctorId: filters.doctorId });
      }
    
      if (filters.reason) {
        query.andWhere('appointment.reason LIKE :reason', { reason: `%${filters.reason}%` });
      }
    
      const appointments = await query.getMany();
    
      if (!appointments.length) {
        throw new NotFoundException('No se encontraron citas con los filtros proporcionados');
      }
    
      return appointments;
    } catch (error) {
      throw new InternalServerErrorException('Error al buscar citas ', error);
    }
  }

  //actualizar una cita
  async update(id: number, updateAppointmentDto: UpdateAppointmentDto) {
    const appointment = await this.appointmentRepository.findOne({ where: { id, deletedAt: null } });
    if (!appointment) {
      throw new NotFoundException(`Cita con id ${id} no encontrada`);
    }

    const { date, reason, notes } = updateAppointmentDto;

    const conflictingAppointment = await this.appointmentRepository.findOne({
      where: [
        {
          doctor: { id: appointment.doctor.id },
          date: MoreThanOrEqual(date),
        },
        {
          doctor: { id: appointment.doctor.id },
          date: LessThanOrEqual(this.addOneHour(date)),
        }
      ]
    });

    if (conflictingAppointment && conflictingAppointment.id !== appointment.id) {
      throw new ForbiddenException('Este horario ya está ocupado por otra cita');
    }

    appointment.date = date;
    appointment.reason = reason;
    appointment.notes = notes;

    await this.appointmentRepository.save(appointment);

    return `Cita con id ${id} actualizada exitosamente`;
  }

  //borrar una cita
  async remove(id: number) {
    const appointment = await this.appointmentRepository.findOne({ where: { id, deletedAt: null } });
    if (!appointment) {
      throw new NotFoundException(`Cita con id ${id} no encontrada`);
    }

    appointment.deletedAt = new Date();
    await this.appointmentRepository.save(appointment);

    return `Cita con id ${id} eliminada`;
  }
}
