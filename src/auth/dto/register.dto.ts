import { Transform } from "class-transformer"
import { IsEmail, IsString, MinLength } from "class-validator"


export class RegisterDto {
    

    @IsEmail()
    email:string

    @IsString()
    username:string

    @Transform(({ value }) => value.trim())
    @IsString()
    @MinLength(4)
    password:string

    @IsString()
    role: string


}