import { GlobalExceptionFilter } from "./global-exception.filter";
import {
  HttpException,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

describe("GlobalExceptionFilter", () => {
  let filter: GlobalExceptionFilter;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GlobalExceptionFilter],
    }).compile();

    filter = module.get<GlobalExceptionFilter>(GlobalExceptionFilter);
  });

  it("should be defined", () => {
    expect(filter).toBeDefined();
  });

  describe("catch", () => {
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockGetResponse = jest.fn().mockReturnValue({
      status: mockStatus,
      json: mockJson,
    });
    const mockGetRequest = jest.fn().mockReturnValue({
      method: "GET",
      url: "/api/test",
    });
    const mockHttpArgumentsHost = jest.fn().mockReturnValue({
      getResponse: mockGetResponse,
      getRequest: mockGetRequest,
    });
    const mockArgumentsHost = {
      switchToHttp: mockHttpArgumentsHost,
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      getType: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return sanitized response for HttpException (400 BadRequest)", () => {
      const exception = new BadRequestException("Test error message");

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        statusCode: 400,
        error: "Bad Request",
        message: "Test error message",
        timestamp: expect.any(String),
      });
    });

    it("should return sanitized response for NotFoundException (404)", () => {
      const exception = new NotFoundException("Resource not found");

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        statusCode: 404,
        error: "Not Found",
        message: "Resource not found",
        timestamp: expect.any(String),
      });
    });

    it("should return generic 500 for unknown exceptions", () => {
      const exception = new Error("Database connection failed");

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        statusCode: 500,
        error: "Internal Server Error",
        message: "An unexpected error occurred",
        timestamp: expect.any(String),
      });
    });

    it("should not leak internal error details in response", () => {
      const exception = new Error("SENSITIVE_INTERNAL_DETAILS: password_hash=abc123");

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(500);
      const callArg = mockJson.mock.calls[0][0];
      expect(callArg.message).toBe("An unexpected error occurred");
      expect(callArg.message).not.toContain("password_hash");
      expect(callArg.message).not.toContain("SENSITIVE_INTERNAL_DETAILS");
    });

    it("should convert validation error array to single message", () => {
      const exception = new BadRequestException([
        "email must be valid",
        "password too short",
      ]);

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(400);
      const callArg = mockJson.mock.calls[0][0];
      expect(callArg.message).toBe("email must be valid");
    });

    it("should handle 429 Too Many Requests (ThrottlerGuard)", () => {
      const exception = new HttpException(
        "Too Many Requests",
        HttpStatus.TOO_MANY_REQUESTS,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(429);
      expect(mockJson).toHaveBeenCalledWith({
        statusCode: 429,
        error: "Too Many Requests",
        message: "Too Many Requests",
        timestamp: expect.any(String),
      });
    });
  });
});
