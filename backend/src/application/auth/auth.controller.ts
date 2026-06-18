import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Headers,
  HttpCode,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { GoogleAuthDto } from "./dto/google-auth.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { User } from "../../domain/entities/user.entity";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Registrar nuevo usuario" })
  @ApiResponse({ status: 201, description: "Usuario registrado exitosamente" })
  @ApiResponse({ status: 409, description: "El correo ya está registrado" })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Iniciar sesión con credentials" })
  @ApiResponse({ status: 200, description: "Login exitoso" })
  @ApiResponse({ status: 401, description: "Credenciales inválidas" })
  @ApiResponse({ status: 429, description: "Demasiados intentos" })
  async login(
    @Body() loginDto: LoginDto,
    @Headers("x-forwarded-for") forwardedFor?: string,
    @Headers("x-real-ip") realIp?: string,
  ) {
    const ip = forwardedFor || realIp || "";
    return this.authService.login(loginDto, ip);
  }

  @Post("google")
  @ApiOperation({ summary: "Autenticar con Google" })
  @ApiResponse({ status: 200, description: "Autenticación con Google exitosa" })
  @ApiResponse({ status: 401, description: "Token de Google inválido" })
  async googleAuth(
    @Body() googleAuthDto: GoogleAuthDto,
    @Headers("x-forwarded-for") forwardedFor?: string,
    @Headers("x-real-ip") realIp?: string,
  ) {
    const ip = forwardedFor || realIp || "";
    return this.authService.googleAuth(googleAuthDto, ip);
  }

  @Post("refresh")
  @ApiOperation({ summary: "Renovar access token con refresh token" })
  @ApiResponse({ status: 200, description: "Token renovado exitosamente" })
  @ApiResponse({
    status: 401,
    description: "Refresh token inválido o expirado",
  })
  async refresh(
    @Body("refreshToken") refreshToken: string,
    @Headers("x-forwarded-for") forwardedFor?: string,
    @Headers("x-real-ip") realIp?: string,
  ) {
    const ip = forwardedFor || realIp || "";
    return this.authService.refreshToken(refreshToken, ip);
  }

  @Post("logout")
  @ApiOperation({ summary: "Cerrar sesión e invalidar refresh token" })
  @ApiResponse({ status: 200, description: "Sesión cerrada exitosamente" })
  async logout(
    @Body("refreshToken") refreshToken: string,
    @Req() req?: { user?: User },
  ) {
    const userId = req?.user?.id;
    await this.authService.logout(refreshToken, userId);
    return { message: "Sesión cerrada exitosamente" };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Obtener información del usuario actual" })
  @ApiResponse({ status: 200, description: "Usuario encontrado" })
  @ApiResponse({ status: 401, description: "No autorizado" })
  async getProfile(@Req() req: { user: User }) {
    const user = req.user;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
    };
  }
}
