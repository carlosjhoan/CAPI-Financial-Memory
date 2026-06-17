import { Logger } from "@nestjs/common";
import { AuthEventsLoggerService } from "./auth-events-logger.service";

describe("AuthEventsLoggerService", () => {
  let service: AuthEventsLoggerService;

  beforeEach(() => {
    // Spy on NestJS Logger prototype methods
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => {});
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
    service = new AuthEventsLoggerService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("LOGIN_SUCCESS", () => {
    it("should log LOGIN_SUCCESS with user details", () => {
      const loggerSpy = jest.spyOn(Logger.prototype, "log");

      service.log({
        event: "LOGIN_SUCCESS",
        email: "user@example.com",
        userId: "uuid-123",
        ip: "192.168.1.1",
      });

      expect(loggerSpy).toHaveBeenCalled();
      const loggedArg = JSON.parse(loggerSpy.mock.calls[0][0]);
      expect(loggedArg.event).toBe("LOGIN_SUCCESS");
      expect(loggedArg.email).toBe("user@example.com");
      expect(loggedArg.userId).toBe("uuid-123");
      expect(loggedArg.ip).toBe("192.168.1.1");
      expect(loggedArg.timestamp).toBeDefined();
    });
  });

  describe("LOGIN_FAILURE", () => {
    it("should log LOGIN_FAILURE as a warning", () => {
      const loggerWarnSpy = jest.spyOn(Logger.prototype, "warn");

      service.log({
        event: "LOGIN_FAILURE",
        email: "attacker@example.com",
        metadata: { reason: "wrong_password" },
      });

      expect(loggerWarnSpy).toHaveBeenCalled();
      const loggedArg = JSON.parse(loggerWarnSpy.mock.calls[0][0]);
      expect(loggedArg.event).toBe("LOGIN_FAILURE");
      expect(loggedArg.reason).toBe("wrong_password");
    });
  });

  describe("REGISTRATION", () => {
    it("should log REGISTRATION event", () => {
      const loggerSpy = jest.spyOn(Logger.prototype, "log");

      service.log({
        event: "REGISTRATION",
        email: "newuser@example.com",
        userId: "uuid-456",
      });

      expect(loggerSpy).toHaveBeenCalled();
      const loggedArg = JSON.parse(loggerSpy.mock.calls[0][0]);
      expect(loggedArg.event).toBe("REGISTRATION");
      expect(loggedArg.email).toBe("newuser@example.com");
    });
  });

  describe("TOKEN_REFRESH", () => {
    it("should log TOKEN_REFRESH event", () => {
      const loggerSpy = jest.spyOn(Logger.prototype, "log");

      service.log({
        event: "TOKEN_REFRESH",
        userId: "uuid-789",
      });

      expect(loggerSpy).toHaveBeenCalled();
      const loggedArg = JSON.parse(loggerSpy.mock.calls[0][0]);
      expect(loggedArg.event).toBe("TOKEN_REFRESH");
      expect(loggedArg.userId).toBe("uuid-789");
    });
  });

  describe("LOGOUT", () => {
    it("should log LOGOUT event", () => {
      const loggerSpy = jest.spyOn(Logger.prototype, "log");

      service.log({
        event: "LOGOUT",
        userId: "uuid-789",
      });

      expect(loggerSpy).toHaveBeenCalled();
      const loggedArg = JSON.parse(loggerSpy.mock.calls[0][0]);
      expect(loggedArg.event).toBe("LOGOUT");
      expect(loggedArg.userId).toBe("uuid-789");
    });
  });

  describe("FORBIDDEN_ACCESS", () => {
    it("should log FORBIDDEN_ACCESS as a warning", () => {
      const loggerWarnSpy = jest.spyOn(Logger.prototype, "warn");

      service.log({
        event: "FORBIDDEN_ACCESS",
        userId: "uuid-123",
        metadata: { reason: "refresh_token_reuse" },
      });

      expect(loggerWarnSpy).toHaveBeenCalled();
      const loggedArg = JSON.parse(loggerWarnSpy.mock.calls[0][0]);
      expect(loggedArg.event).toBe("FORBIDDEN_ACCESS");
      expect(loggedArg.reason).toBe("refresh_token_reuse");
    });
  });

  describe("edge cases", () => {
    it("should handle missing optional fields gracefully", () => {
      const loggerSpy = jest.spyOn(Logger.prototype, "log");

      service.log({
        event: "LOGIN_SUCCESS",
      });

      expect(loggerSpy).toHaveBeenCalled();
      const loggedArg = JSON.parse(loggerSpy.mock.calls[0][0]);
      expect(loggedArg.event).toBe("LOGIN_SUCCESS");
      expect(loggedArg.email).toBeUndefined();
      expect(loggedArg.userId).toBeUndefined();
    });
  });
});
