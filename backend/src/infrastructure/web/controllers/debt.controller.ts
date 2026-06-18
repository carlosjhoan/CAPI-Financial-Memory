import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiNoContentResponse,
} from "@nestjs/swagger";
import { CreateDebtUseCase } from "../../../application/debt/create-debt.use-case";
import { RegisterPaymentUseCase } from "../../../application/debt/register-payment.use-case";
import { GetAllDebtsUseCase } from "../../../application/debt/get-all-debts.use-case";
import { GetAllDebtsPaginatedUseCase } from "../../../application/debt/get-all-debts-paginated.use-case";
import { GetDebtByIdUseCase } from "../../../application/debt/get-debt-by-id.use-case";
import { UpdateDebtUseCase } from "../../../application/debt/update-debt.use-case";
import { DeleteDebtUseCase } from "../../../application/debt/delete-debt.use-case";
import { GetDebtsSummaryUseCase } from "../../../application/debt/get-debts-summary.use-case";
import { GetMonthlySummaryUseCase } from "../../../application/debt/get-monthly-summary.use-case";
import { GetYearlySummaryUseCase } from "../../../application/debt/get-yearly-summary.use-case";
import { CreateDebtDto } from "../dto/create-debt.dto";
import { UpdateDebtDto } from "../dto/update-debt.dto";
import { RegisterPaymentDto } from "../dto/register-payment.dto";
import { DebtQueryDto } from "../dto/debt-query.dto";
import { ApiResponse as ApiResponseDto } from "../../../shared/dtos/api-response.dto";
import { ErrorResponse } from "../../../shared/dtos/error-response.dto";
import { JwtAuthGuard } from "../../../application/auth/guards/jwt-auth.guard";
import { RequestWithUser } from "../../../application/auth/types";

@ApiTags("debts")
@UseGuards(JwtAuthGuard)
@Controller("debts")
export class DebtController {
  constructor(
    private readonly createDebtUseCase: CreateDebtUseCase,
    private readonly registerPaymentUseCase: RegisterPaymentUseCase,
    private readonly getAllDebtsUseCase: GetAllDebtsUseCase,
    private readonly getAllDebtsPaginatedUseCase: GetAllDebtsPaginatedUseCase,
    private readonly getDebtByIdUseCase: GetDebtByIdUseCase,
    private readonly updateDebtUseCase: UpdateDebtUseCase,
    private readonly deleteDebtUseCase: DeleteDebtUseCase,
    private readonly getDebtsSummaryUseCase: GetDebtsSummaryUseCase,
    private readonly getMonthlySummaryUseCase: GetMonthlySummaryUseCase,
    private readonly getYearlySummaryUseCase: GetYearlySummaryUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Crear una nueva deuda",
    description: "Crea un registro de deuda con los datos proporcionados",
  })
  @ApiBody({ type: CreateDebtDto })
  @ApiCreatedResponse({
    description: "Deuda creada exitosamente",
    type: ApiResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Datos de entrada inválidos",
    type: ErrorResponse,
  })
  async create(
    @Req() req: RequestWithUser,
    @Body() createDebtDto: CreateDebtDto,
  ): Promise<ApiResponseDto<any> | ErrorResponse> {
    try {
      // Use UTC noon to avoid timezone shifts
      const dateStr = createDebtDto.date.includes("T")
        ? createDebtDto.date
        : `${createDebtDto.date}T12:00:00.000Z`;

      const debt = await this.createDebtUseCase.execute(
        req.user.id,
        createDebtDto.initialAmount,
        createDebtDto.lender,
        createDebtDto.months,
        createDebtDto.installAmount,
        createDebtDto.finalAmount,
        new Date(dateStr),
        createDebtDto.reason ?? "Me endeudé y no sé ni para qué",
      );

      return {
        statusCode: HttpStatus.CREATED,
        data: debt,
        message: "Debt created successfully",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: "Bad Request",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Get()
  @ApiOperation({
    summary: "Obtener todas las deudas",
    description:
      "Retorna una lista de todas las deudas registradas. Puede filtrarse por rango de fechas (startDate/endDate) o por año/mes. Soporta paginación y filtro por prestamista.",
  })
  @ApiQuery({
    name: "startDate",
    description: "Fecha de inicio para filtrar (formato ISO 8601: YYYY-MM-DD)",
    example: "2024-01-01",
    required: false,
  })
  @ApiQuery({
    name: "endDate",
    description: "Fecha de fin para filtrar (formato ISO 8601: YYYY-MM-DD)",
    example: "2024-12-31",
    required: false,
  })
  @ApiQuery({
    name: "year",
    description: "Año para filtrar (formato YYYY)",
    example: "2024",
    required: false,
  })
  @ApiQuery({
    name: "month",
    description: "Mes para filtrar (1-12)",
    example: "4",
    required: false,
  })
  @ApiQuery({
    name: "page",
    description: "Número de página (default: 1)",
    example: 1,
    required: false,
  })
  @ApiQuery({
    name: "limit",
    description: "Cantidad de elementos por página (default: 6)",
    example: 6,
    required: false,
  })
  @ApiQuery({
    name: "lender",
    description: "Filtrar por nombre del prestamista",
    example: "Banco",
    required: false,
  })
  @ApiOkResponse({
    description: "Lista de deudas obtenida exitosamente",
    type: ApiResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Parámetros de fecha inválidos",
    type: ErrorResponse,
  })
  async findAll(
    @Req() req: RequestWithUser,
    @Query() query: DebtQueryDto,
  ): Promise<ApiResponseDto<any> | ErrorResponse> {
    try {
      // Check if any filter is present — use paginated query
      if (
        query.startDate ||
        query.endDate ||
        query.year ||
        query.month ||
        query.lender ||
        query.page ||
        query.limit
      ) {
        const page = query?.page || 1;
        const limit = query?.limit || 6;

        let result: { data: any[]; total: number };

        // Prioridad: year/month > startDate/endDate > lender filter > sin filtros
        if (query.year && query.month) {
          const year = parseInt(query.year);
          const month = parseInt(query.month) - 1; // Convertir de 1-indexed a 0-indexed

          if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
            return new ErrorResponse(
              HttpStatus.BAD_REQUEST,
              "Bad Request",
              "Invalid year or month. Month must be 1-12.",
            );
          }

          // Build query with year/month as date range
          const filterQuery: DebtQueryDto = {
            ...query,
            startDate: undefined,
            endDate: undefined,
            year: undefined,
            month: undefined,
          };

          // Apply date range within the query
          const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
          const endDate = new Date(
            Date.UTC(year, month + 1, 0, 23, 59, 59, 999),
          );

          // Use the repository's findAllPaginated with date range
          // We'll pass the query with startDate/endDate set
          filterQuery.startDate = startDate.toISOString().split("T")[0];
          filterQuery.endDate = endDate.toISOString().split("T")[0];
          filterQuery.page = page;
          filterQuery.limit = limit;

          result = await this.getAllDebtsPaginatedUseCase.execute(
            req.user.id,
            filterQuery,
          );
        } else if (query.year) {
          const year = parseInt(query.year);
          if (isNaN(year)) {
            return new ErrorResponse(
              HttpStatus.BAD_REQUEST,
              "Bad Request",
              "Invalid year format. Use YYYY.",
            );
          }

          const filterQuery: DebtQueryDto = {
            ...query,
            startDate: `${year}-01-01`,
            endDate: `${year}-12-31`,
            year: undefined,
            page,
            limit,
          };

          result = await this.getAllDebtsPaginatedUseCase.execute(
            req.user.id,
            filterQuery,
          );
        } else if (query.startDate && query.endDate) {
          const startDate = new Date(query.startDate + "T00:00:00.000Z");
          const endDate = new Date(query.endDate + "T23:59:59.999Z");

          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return new ErrorResponse(
              HttpStatus.BAD_REQUEST,
              "Bad Request",
              "Invalid date format. Please use ISO 8601 format (YYYY-MM-DD)",
            );
          }

          if (startDate > endDate) {
            return new ErrorResponse(
              HttpStatus.BAD_REQUEST,
              "Bad Request",
              "startDate must be less than or equal to endDate",
            );
          }

          const filterQuery: DebtQueryDto = {
            ...query,
            page,
            limit,
          };

          result = await this.getAllDebtsPaginatedUseCase.execute(
            req.user.id,
            filterQuery,
          );
        } else {
          // Pagination only or lender filter
          result = await this.getAllDebtsPaginatedUseCase.execute(req.user.id, {
            ...query,
            page,
            limit,
          });
        }

        const totalPages = Math.ceil(result.total / limit);

        return {
          statusCode: HttpStatus.OK,
          data: result.data,
          message: "Debts retrieved successfully",
          timestamp: new Date().toISOString(),
          meta: {
            total: result.total,
            page,
            limit,
            totalPages,
          },
        };
      }

      // No filters — return all debts (backward compatible)
      const debts = await this.getAllDebtsUseCase.execute(req.user.id);
      return {
        statusCode: HttpStatus.OK,
        data: debts,
        message: "Debts retrieved successfully",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return new ErrorResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Internal Server Error",
        error.message,
      );
    }
  }

  @Get("summary/overall")
  @ApiOperation({
    summary: "Obtener resumen general de deudas",
    description:
      "Retorna un resumen general de todas las deudas registradas. Puede filtrarse por rango de fechas (startDate/endDate).",
  })
  @ApiQuery({
    name: "startDate",
    description: "Fecha de inicio para filtrar (formato ISO 8601: YYYY-MM-DD)",
    example: "2024-01-01",
    required: false,
  })
  @ApiQuery({
    name: "endDate",
    description: "Fecha de fin para filtrar (formato ISO 8601: YYYY-MM-DD)",
    example: "2024-12-31",
    required: false,
  })
  @ApiOkResponse({
    description: "Resumen general obtenido exitosamente",
    type: ApiResponseDto,
  })
  async getDebtsSummary(
    @Req() req: RequestWithUser,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ): Promise<ApiResponseDto<any>> {
    const summary = await this.getDebtsSummaryUseCase.execute(req.user.id, {
      startDate,
      endDate,
    });

    return {
      statusCode: HttpStatus.OK,
      data: summary,
      message: "Debt summary retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("summary/monthly")
  @ApiOperation({
    summary: "Obtener resumen mensual de deudas",
    description: "Retorna un resumen de deudas por mes",
  })
  @ApiQuery({
    name: "year",
    description: "Año para el resumen",
    example: "2024",
    required: false,
  })
  @ApiQuery({
    name: "month",
    description: "Mes para el resumen (1-12)",
    example: "4",
    required: false,
  })
  @ApiOkResponse({
    description: "Resumen mensual obtenido exitosamente",
    type: ApiResponseDto,
  })
  async getMonthlySummary(
    @Req() req: RequestWithUser,
    @Query("year") year: string,
    @Query("month") month: string,
  ): Promise<ApiResponseDto<any>> {
    const now = new Date();
    const yearNum = year ? parseInt(year) : now.getUTCFullYear();
    // month es 1-indexed (1-12), convert to 0-indexed (0-11)
    const monthNum = month ? parseInt(month) - 1 : now.getUTCMonth();

    const summary = await this.getMonthlySummaryUseCase.execute(
      req.user.id,
      yearNum,
      monthNum,
    );

    return {
      statusCode: HttpStatus.OK,
      data: summary,
      message: "Monthly debt summary retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("summary/yearly")
  @ApiOperation({
    summary: "Obtener resumen anual de deudas",
    description: "Retorna un resumen de deudas por año",
  })
  @ApiQuery({
    name: "year",
    description: "Año para el resumen",
    example: "2024",
    required: false,
  })
  @ApiOkResponse({
    description: "Resumen anual obtenido exitosamente",
    type: ApiResponseDto,
  })
  async getYearlySummary(
    @Req() req: RequestWithUser,
    @Query("year") year: string,
  ): Promise<ApiResponseDto<any>> {
    const now = new Date();
    const yearNum = year ? parseInt(year) : now.getUTCFullYear();

    const summary = await this.getYearlySummaryUseCase.execute(
      req.user.id,
      yearNum,
    );

    return {
      statusCode: HttpStatus.OK,
      data: summary,
      message: "Yearly debt summary retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  @Get(":id")
  @ApiOperation({
    summary: "Obtener una deuda por ID",
    description: "Retorna los detalles de una deuda específica",
  })
  @ApiParam({
    name: "id",
    description: "ID de la deuda",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiOkResponse({
    description: "Deuda obtenida exitosamente",
    type: ApiResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Deuda no encontrada",
    type: ErrorResponse,
  })
  async findOne(
    @Req() req: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<any> | ErrorResponse> {
    try {
      const debt = await this.getDebtByIdUseCase.execute(req.user.id, id);

      return {
        statusCode: HttpStatus.OK,
        data: debt,
        message: "Debt retrieved successfully",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return new ErrorResponse(
        HttpStatus.NOT_FOUND,
        "Not Found",
        "Debt not found",
      );
    }
  }

  @Put(":id")
  @ApiOperation({
    summary: "Actualizar una deuda",
    description: "Actualiza los datos de una deuda específica",
  })
  @ApiParam({
    name: "id",
    description: "ID de la deuda",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiBody({ type: UpdateDebtDto })
  @ApiOkResponse({
    description: "Deuda actualizada exitosamente",
    type: ApiResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Deuda no encontrada",
    type: ErrorResponse,
  })
  @ApiBadRequestResponse({
    description: "Datos de actualización inválidos",
    type: ErrorResponse,
  })
  async update(
    @Req() req: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDebtDto: UpdateDebtDto,
  ): Promise<ApiResponseDto<any> | ErrorResponse> {
    try {
      const updateData: any = {};
      if (updateDebtDto.initialAmount !== undefined)
        updateData.initialAmount = updateDebtDto.initialAmount;
      if (updateDebtDto.lender !== undefined)
        updateData.lender = updateDebtDto.lender;
      if (updateDebtDto.months !== undefined)
        updateData.months = updateDebtDto.months;
      if (updateDebtDto.installAmount !== undefined)
        updateData.installAmount = updateDebtDto.installAmount;
      if (updateDebtDto.finalAmount !== undefined)
        updateData.finalAmount = updateDebtDto.finalAmount;
      if (updateDebtDto.reason !== undefined)
        updateData.reason = updateDebtDto.reason;

      const debt = await this.updateDebtUseCase.execute(
        req.user.id,
        id,
        updateData,
      );

      return {
        statusCode: HttpStatus.OK,
        data: debt,
        message: "Debt updated successfully",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return new ErrorResponse(
        HttpStatus.BAD_REQUEST,
        "Bad Request",
        error.message,
      );
    }
  }

  @Post(":id/payments")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Registrar un pago de deuda",
    description: "Registra un pago para una deuda específica",
  })
  @ApiParam({
    name: "id",
    description: "ID de la deuda",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiBody({ type: RegisterPaymentDto })
  @ApiOkResponse({
    description: "Pago registrado exitosamente",
    type: ApiResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Deuda no encontrada",
    type: ErrorResponse,
  })
  @ApiBadRequestResponse({
    description: "Datos de pago inválidos",
    type: ErrorResponse,
  })
  async registerPayment(
    @Req() req: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() registerPaymentDto: RegisterPaymentDto,
  ): Promise<ApiResponseDto<any> | ErrorResponse> {
    try {
      // Parse date from DTO and pass to service
      const paymentDate = registerPaymentDto.date
        ? new Date(registerPaymentDto.date + "T12:00:00.000Z")
        : undefined;

      const debt = await this.registerPaymentUseCase.execute(
        req.user.id,
        id,
        registerPaymentDto.amount,
        paymentDate,
      );

      return {
        statusCode: HttpStatus.OK,
        data: debt,
        message: "Payment registered successfully",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return new ErrorResponse(
        HttpStatus.BAD_REQUEST,
        "Bad Request",
        error.message,
      );
    }
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Eliminar una deuda",
    description: "Elimina una deuda específica por ID",
  })
  @ApiParam({
    name: "id",
    description: "ID de la deuda",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiNoContentResponse({
    description: "Deuda eliminada exitosamente",
  })
  @ApiNotFoundResponse({
    description: "Deuda no encontrada",
    type: ErrorResponse,
  })
  async remove(
    @Req() req: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<void> {
    try {
      await this.deleteDebtUseCase.execute(req.user.id, id);
    } catch (error) {
      if (error.message === "Debt not found") {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          error: "Not Found",
          message: "Debt not found",
          timestamp: new Date().toISOString(),
        });
      }
      throw error;
    }
  }
}
