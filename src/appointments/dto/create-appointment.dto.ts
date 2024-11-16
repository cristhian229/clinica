import { Transform } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';


export class CreateAppointmentDto {
  @IsDate()
  @IsNotEmpty()
  @Transform(({ value }) => new Date(value)) 
  date: Date;   
  
  @IsString()
  @IsNotEmpty()
  reason: string; 
  
  @IsString()
  @IsOptional()
  notes?: string;  
  
  @IsNotEmpty()
  userId:number;  

  @IsNotEmpty()
  doctorId:number; 
}