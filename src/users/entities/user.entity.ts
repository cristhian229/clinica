import { Appointment } from "src/appointments/entities/appointment.entity"
import { Column, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm"

export enum UserRoles {
    PATIENT = 'PATIENT',
    DOCTOR = 'DOCTOR',
}

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true })
    email:string

    @Column()
    username:string

    @Column()
    password:string

    @Column( {type:'enum', enum:UserRoles, default:UserRoles.PATIENT} )
    role:UserRoles

    @DeleteDateColumn({ type: 'timestamp', nullable: true })
    delete_at: Date;

    @OneToMany(() => Appointment, (appointment) => appointment.user)
    appointments: Appointment[];
}
