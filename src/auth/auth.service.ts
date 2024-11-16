import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';
import * as bcryptjs from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';


@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register({ email, password, username, role }: RegisterDto) {
    const user: User = await this.usersService.findOneByEmail(email);

    if (user) {
      throw new BadRequestException('User already registered');
    }
    try{
        await this.usersService.create({
        email,
        password: await bcryptjs.hash(password, 8),
        username,
        role
      });
      return {email};

    }catch(error){
        throw new BadRequestException('Error creating user', error);
    }
 
  }

  async login({ email, password }: LoginDto) {

    try{
      const user: User = await this.usersService.findOneByEmail(email);

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const isPasswordValid = await bcryptjs.compare(password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const payload = { email: user.email};

      const token = this.jwtService.sign(payload);

      return {
        email,
        token
      };
    }catch(error){
        throw new BadRequestException('Error login user', error);
    }
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}