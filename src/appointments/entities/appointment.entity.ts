import { User } from 'src/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, DeleteDateColumn } from 'typeorm';


@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  date: Date;

  @Column()
  reason: string;  

  @Column({ nullable: true })
  notes: string;   

  @ManyToOne(() => User, (user) => user.appointments)
  user: User; 

  @ManyToOne(() => User, (doctor) => doctor.appointments)
  doctor: User; 

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;

}