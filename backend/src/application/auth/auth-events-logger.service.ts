import { Injectable, Logger } from "@nestjs/common";

export type AuthEvent =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "REGISTRATION"
  | "TOKEN_REFRESH"
  | "FORBIDDEN_ACCESS"
  | "LOGOUT";

export interface AuthEventPayload {
  event: AuthEvent;
  email?: string;
  userId?: string;
  ip?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuthEventsLoggerService {
  private readonly logger = new Logger("AuthEvents");

  log(eventPayload: AuthEventPayload): void {
    const { event, email, userId, ip, metadata } = eventPayload;

    const logData = {
      event,
      email,
      userId,
      ip,
      ...(metadata || {}),
      timestamp: new Date().toISOString(),
    };

    switch (event) {
      case "LOGIN_FAILURE":
      case "FORBIDDEN_ACCESS":
        this.logger.warn(JSON.stringify(logData));
        break;
      default:
        this.logger.log(JSON.stringify(logData));
    }
  }
}
