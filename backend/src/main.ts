import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import * as bodyParser from "body-parser";
import helmet from "helmet";
import { AppModule } from "./infrastructure/web/modules/app.module";
import { setupSwagger } from "./infrastructure/config/swagger.config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers: CSP, HSTS, X-Frame-Options, etc.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "https://accounts.google.com", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
          imgSrc: ["'self'", "data:", "blob:"],
          connectSrc: ["'self'", "https://accounts.google.com"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["https://accounts.google.com"],
        },
      },
      crossOriginOpenerPolicy: { policy: "unsafe-none" },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      xFrameOptions: { action: "deny" },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    }),
  );

  // Request body size limit
  app.use(bodyParser.json({ limit: "1mb" }));

  // Configurar CORS desde variable de entorno
  const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
  app.enableCors({
    origin: corsOrigin.split(",").map((o) => o.trim()),
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "Origin",
      "X-Requested-With",
    ],
    credentials: true,
    exposedHeaders: ["Content-Disposition"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix("api");

  setupSwagger(app);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
