import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { GoogleStrategy } from "./strategies/google.strategy";
import { AuthEventsLoggerService } from "./auth-events-logger.service";
import { UserEntity } from "../../infrastructure/persistence/postgres/entities/user.entity";
import { RefreshTokenEntity } from "../../infrastructure/persistence/postgres/entities/refresh-token.entity";
import { LoginAttemptEntity } from "../../infrastructure/persistence/postgres/entities/login-attempt.entity";
import { TypeOrmUserRepository } from "../../infrastructure/persistence/postgres/repository/typeorm-user.repository";
import { TypeOrmRefreshTokenRepository } from "../../infrastructure/persistence/postgres/repository/typeorm-refresh-token.repository";
import { TypeOrmLoginAttemptRepository } from "../../infrastructure/persistence/postgres/repository/typeorm-login-attempt.repository";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      RefreshTokenEntity,
      LoginAttemptEntity,
    ]),
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: "15m" },
      }),
    }),
  ],
  providers: [
    AuthService,
    AuthEventsLoggerService,
    JwtStrategy,
    GoogleStrategy,
    {
      provide: "USER_REPOSITORY",
      useClass: TypeOrmUserRepository,
    },
    {
      provide: "REFRESH_TOKEN_REPOSITORY",
      useClass: TypeOrmRefreshTokenRepository,
    },
    {
      provide: "LOGIN_ATTEMPT_REPOSITORY",
      useClass: TypeOrmLoginAttemptRepository,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService, "USER_REPOSITORY"],
})
export class AuthModule {}
