import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { User, UserProvider } from "../../domain/entities/user.entity";
import { UserRepository } from "../../domain/repositories/user.repository";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { GoogleAuthDto } from "./dto/google-auth.dto";
import { AuthEventsLoggerService } from "./auth-events-logger.service";

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    name: string;
    provider: UserProvider;
  };
}

interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient: OAuth2Client;

  constructor(
    @Inject("USER_REPOSITORY")
    private readonly userRepository: UserRepository,
    @Inject("REFRESH_TOKEN_REPOSITORY")
    private readonly refreshTokenRepository: {
      save(token: RefreshTokenRecord): Promise<RefreshTokenRecord>;
      findByTokenHash(hash: string): Promise<RefreshTokenRecord | null>;
      deleteById(id: string): Promise<void>;
      deleteByUserId(userId: string): Promise<void>;
      deleteExpired(): Promise<void>;
    },
    @Inject("LOGIN_ATTEMPT_REPOSITORY")
    private readonly loginAttemptRepository: {
      save(attempt: {
        email: string;
        ip: string;
        success: boolean;
      }): Promise<void>;
      countRecentFailures(email: string, since: Date): Promise<number>;
      clearForEmail(email: string): Promise<void>;
    },
    private jwtService: JwtService,
    private configService: ConfigService,
    private authEventsLogger: AuthEventsLoggerService,
  ) {
    const clientId = this.configService.get<string>("GOOGLE_CLIENT_ID");
    this.googleClient = new OAuth2Client(clientId);
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findByEmail(
      registerDto.email,
    );

    if (existingUser) {
      throw new ConflictException("El correo electrónico ya está registrado");
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = new User(
      registerDto.email,
      registerDto.name,
      UserProvider.LOCAL,
    );
    user.isActive = true;

    const savedUser = await this.userRepository.saveWithPassword(
      user,
      hashedPassword,
    );

    this.authEventsLogger.log({
      event: "REGISTRATION",
      email: savedUser.email,
      userId: savedUser.id,
    });

    return this.generateAuthResponse(savedUser);
  }

  async login(loginDto: LoginDto, ip?: string): Promise<AuthResponse> {
    const result = await this.userRepository.findByEmailWithPassword(
      loginDto.email,
    );

    if (!result) {
      await this.recordLoginAttempt(loginDto.email, false, ip);
      this.authEventsLogger.log({
        event: "LOGIN_FAILURE",
        email: loginDto.email,
        ip,
      });
      throw new UnauthorizedException("Credenciales inválidas");
    }

    // Account lockout check
    await this.checkAccountLockout(loginDto.email, ip);

    const { user, password: hashedPassword } = result;

    if (!user.isActive) {
      await this.recordLoginAttempt(loginDto.email, false, ip);
      this.authEventsLogger.log({
        event: "LOGIN_FAILURE",
        email: loginDto.email,
        ip,
        metadata: { reason: "account_disabled" },
      });
      throw new UnauthorizedException("La cuenta está desactivada");
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      hashedPassword,
    );

    if (!isPasswordValid) {
      await this.recordLoginAttempt(loginDto.email, false, ip);
      this.authEventsLogger.log({
        event: "LOGIN_FAILURE",
        email: loginDto.email,
        ip,
        metadata: { reason: "wrong_password" },
      });
      throw new UnauthorizedException("Credenciales inválidas");
    }

    // Clear lockout on success
    await this.loginAttemptRepository.clearForEmail(loginDto.email);
    await this.recordLoginAttempt(loginDto.email, true, ip);

    this.authEventsLogger.log({
      event: "LOGIN_SUCCESS",
      email: user.email,
      userId: user.id,
      ip,
    });

    return this.generateAuthResponse(user);
  }

  async googleAuth(
    googleAuthDto: GoogleAuthDto,
    ip?: string,
  ): Promise<AuthResponse> {
    // Verify Google token server-side
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: googleAuthDto.credential,
        audience: this.configService.get<string>("GOOGLE_CLIENT_ID"),
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new UnauthorizedException("Token de Google inválido");
      }

      const googleId = payload.sub;
      const email = payload.email;
      const name = payload.name || email.split("@")[0];

      let user = await this.userRepository.findByGoogleId(googleId);

      if (!user) {
        user = await this.userRepository.findByEmail(email);

        if (user) {
          user.provider = UserProvider.GOOGLE;
          await this.userRepository.update(user);
        } else {
          user = new User(email, name, UserProvider.GOOGLE);
          user.isActive = true;
          await this.userRepository.save(user);
        }
      }

      this.authEventsLogger.log({
        event: "LOGIN_SUCCESS",
        email: user.email,
        userId: user.id,
        ip,
        metadata: { provider: "google" },
      });

      return this.generateAuthResponse(user);
    } catch (error) {
      this.authEventsLogger.log({
        event: "LOGIN_FAILURE",
        email: googleAuthDto.credential.substring(0, 20) + "...",
        ip,
        metadata: { provider: "google", error: String(error) },
      });
      throw new UnauthorizedException("Autenticación con Google fallida");
    }
  }

  async refreshToken(
    refreshTokenStr: string,
    ip?: string,
  ): Promise<AuthResponse> {
    const hash = this.hashToken(refreshTokenStr);
    const record = await this.refreshTokenRepository.findByTokenHash(hash);

    if (!record || record.expiresAt < new Date()) {
      // If token was already used (reuse attack), invalidate all tokens for user
      if (record) {
        await this.refreshTokenRepository.deleteByUserId(record.userId);
        this.authEventsLogger.log({
          event: "FORBIDDEN_ACCESS",
          userId: record.userId,
          ip,
          metadata: { reason: "refresh_token_reuse" },
        });
      }
      throw new UnauthorizedException("Refresh token inválido o expirado");
    }

    // Delete old token (rotation)
    await this.refreshTokenRepository.deleteById(record.id);

    const user = await this.userRepository.findById(record.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Usuario no válido");
    }

    // Clean expired tokens
    await this.refreshTokenRepository.deleteExpired();

    this.authEventsLogger.log({
      event: "TOKEN_REFRESH",
      userId: user.id,
      email: user.email,
      ip,
    });

    return this.generateAuthResponse(user);
  }

  async logout(refreshTokenStr: string, userId?: string): Promise<void> {
    const hash = this.hashToken(refreshTokenStr);
    const record = await this.refreshTokenRepository.findByTokenHash(hash);

    if (record) {
      await this.refreshTokenRepository.deleteById(record.id);
    }

    // Also clean all expired tokens
    await this.refreshTokenRepository.deleteExpired();

    this.authEventsLogger.log({
      event: "LOGOUT",
      userId,
    });
  }

  async validateUser(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Usuario no válido");
    }

    return user;
  }

  private async generateAuthResponse(user: User): Promise<AuthResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider,
      },
    };
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(48).toString("hex");
    const hash = this.hashToken(token);

    const record: RefreshTokenRecord = {
      id: crypto.randomUUID(),
      userId,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    await this.refreshTokenRepository.save(record);
    return token;
  }

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private async checkAccountLockout(email: string, ip?: string): Promise<void> {
    const since = new Date(Date.now() - 15 * 60 * 1000); // 15 min ago
    const recentFailures =
      await this.loginAttemptRepository.countRecentFailures(email, since);

    if (recentFailures >= 5) {
      this.authEventsLogger.log({
        event: "LOGIN_FAILURE",
        email,
        ip,
        metadata: { reason: "account_locked" },
      });
      throw new HttpException(
        "Demasiados intentos. Cuenta bloqueada por 30 minutos",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async recordLoginAttempt(
    email: string,
    success: boolean,
    ip?: string,
  ): Promise<void> {
    await this.loginAttemptRepository.save({
      email,
      ip: ip || "unknown",
      success,
    });
  }
}
