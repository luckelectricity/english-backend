import { IsEmail, IsEnum } from 'class-validator';
import { Role } from '../enums/role.enum';

export class UpdateUserRoleDto {
    @IsEmail()
    email: string;

    @IsEnum(Role)
    role: Role;
}
