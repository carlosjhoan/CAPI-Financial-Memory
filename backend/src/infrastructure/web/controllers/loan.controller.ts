import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
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
import { CreateLoanDto } from "../dto/create-loan.dto";
import { UpdateLoanDto } from "../dto/update-loan.dto";
import { RegisterLoanPaymentDto } from "../dto/register-loan-payment.dto";
import { LoanQueryDto } from "../dto/loan-query.dto";
import { ApiResponse as ApiResponseDto } from "../../../shared/dtos/api-response.dto";
import { ErrorResponse } from "../../../shared/dtos/error-response.dto";
import { CreateLoanUseCase } from "../../../application/loan/create-loan.use-case";
import { RegisterLoanPaymentUseCase } from "../../../application/loan/register-loan-payment.use-case";
import { GetAllLoansUseCase } from "../../../application/loan/get-all-loans.use-case";
import { GetAllLoansPaginatedUseCase } from "../../../application/loan/get-all-loans-paginated.use-case";
import { GetLoanByIdUseCase } from "../../../application/loan/get-loan-by-id.use-case";
import { UpdateLoanUseCase } from "../../../application/loan/update-loan.use-case";
import { DeleteLoanUseCase } from "../../../application/loan/delete-loan.use-case";
import { GetLoansSummaryUseCase } from "../../../application/loan/get-loans-summary.use-case";
import { GetMonthlySummaryUseCase } from "../../../application/loan/get-monthly-summary.use-case";
import { GetYearlySummaryUseCase } from "../../../application/loan/get-yearly-summary.use-case";
import { GetOverdueLoansUseCase } from "../../../application/loan/get-overdue-loans.use-case";
import { GetLoanPerformanceUseCase } from "../../../application/loan/get-loan-performance.use-case";
import { JwtAuthGuard } from "../../../application/auth/guards/jwt-auth.guard";
import { RequestWithUser } from "../../../application/auth/types";

@ApiTags("loans")
@UseGuards(JwtAuthGuard)
@Controller("loans")
export class LoanController {
  constructor(
    private readonly createLoanUseCase: CreateLoanUseCase,
    private readonly registerLoanPaymentUseCase: RegisterLoanPaymentUseCase,
    private readonly getAllLoansUseCase: GetAllLoansUseCase,
    private readonly getAllLoansPaginatedUseCase: GetAllLoansPaginatedUseCase,
    private readonly getLoanByIdUseCase: GetLoanByIdUseCase,
    private readonly updateLoanUseCase: UpdateLoanUseCase,
    private readonly deleteLoanUseCase: DeleteLoanUseCase,
    private readonly getLoansSummaryUseCase: GetLoansSummaryUseCase,
    private readonly getMonthlySummaryUseCase: GetMonthlySummaryUseCase,
    private readonly getYearlySummaryUseCase: GetYearlySummaryUseCase,
    private readonly getOverdueLoansUseCase: GetOverdueLoansUseCase,
    private readonly getLoanPerformanceUseCase: GetLoanPerformanceUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Crear un nuevo préstamo",
    description: "Crea un registro de préstamo con los datos proporcionados",
  })
  @ApiBody({ type: CreateLoanDto })
  @ApiCreatedResponse({
    description: "Préstamo creado exitosamente",
    type: ApiResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Datos de entrada inválidos",
    type: ErrorResponse,
  })
  async create(
    @Req() req: RequestWithUser,
    @Body() createLoanDto: CreateLoanDto,
  ): Promise<ApiResponseDto<any>> {
    // Use UTC noon to avoid timezone shifts
    const dateStr = createLoanDto.date.includes("T")
      ? createLoanDto.date
      : `${createLoanDto.date}T12:00:00.000Z`;

    const loan = await this.createLoanUseCase.execute(
      req.user.id,
      createLoanDto.initialAmount,
      createLoanDto.interestRate,
      createLoanDto.installment,
      createLoanDto.debtor,
      new Date(dateStr),
    );

    return {
      statusCode: HttpStatus.CREATED,
      data: loan,
      message: "Loan created successfully",
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({
    summary: "Obtener todos los préstamos",
    description:
      "Retorna una lista de todos los préstamos registrados. Puede filtrarse por rango de fechas (startDate/endDate) o por año/mes. Soporta paginación, filtro por deudor y estado.",
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
    name: "debtor",
    description: "Filtrar por nombre del deudor",
    example: "Juan",
    required: false,
  })
  @ApiQuery({
    name: "status",
    description: "Filtrar por estado del préstamo: active | paid | all",
    example: "active",
    required: false,
    enum: ["active", "paid", "all"],
  })
  @ApiOkResponse({
    description: "Lista de préstamos obtenida exitosamente",
    type: ApiResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Parámetros de fecha inválidos",
    type: ErrorResponse,
  })
  async findAll(
    @Req() req: RequestWithUser,
    @Query() query: LoanQueryDto,
  ): Promise<ApiResponseDto<any> | ErrorResponse> {
    try {
      // Check if any filter is present — use paginated query
      if (
        query.startDate ||
        query.endDate ||
        query.year ||
        query.month ||
        query.debtor ||
        query.status ||
        query.page ||
        query.limit
      ) {
        const page = query?.page || 1;
        const limit = query?.limit || 6;

        let result: { data: any[]; total: number };

        // Prioridad: year/month > startDate/endDate > debtor/status filter > sin filtros
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
          const filterQuery: LoanQueryDto = {
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

          filterQuery.startDate = startDate.toISOString().split("T")[0];
          filterQuery.endDate = endDate.toISOString().split("T")[0];
          filterQuery.page = page;
          filterQuery.limit = limit;

          result = await this.getAllLoansPaginatedUseCase.execute(req.user.id, filterQuery);
        } else if (query.year) {
          const year = parseInt(query.year);
          if (isNaN(year)) {
            return new ErrorResponse(
              HttpStatus.BAD_REQUEST,
              "Bad Request",
              "Invalid year format. Use YYYY.",
            );
          }

          const filterQuery: LoanQueryDto = {
            ...query,
            startDate: `${year}-01-01`,
            endDate: `${year}-12-31`,
            year: undefined,
            page,
            limit,
          };

          result = await this.getAllLoansPaginatedUseCase.execute(req.user.id, filterQuery);
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

          const filterQuery: LoanQueryDto = {
            ...query,
            page,
            limit,
          };

          result = await this.getAllLoansPaginatedUseCase.execute(req.user.id, filterQuery);
        } else {
          // Pagination only or debtor/status filter
          result = await this.getAllLoansPaginatedUseCase.execute(req.user.id, {
            ...query,
            page,
            limit,
          });
        }

        const totalPages = Math.ceil(result.total / limit);

        return {
          statusCode: HttpStatus.OK,
          data: result.data,
          message: "Loans retrieved successfully",
          timestamp: new Date().toISOString(),
          meta: {
            total: result.total,
            page,
            limit,
            totalPages,
          },
        };
      }

      // No filters — return all loans (backward compatible)
      const loans = await this.getAllLoansUseCase.execute(req.user.id);
      return {
        statusCode: HttpStatus.OK,
        data: loans,
        message: "Loans retrieved successfully",
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

  @Get(":id")
  @ApiOperation({
    summary: "Obtener un préstamo por ID",
    description: "Retorna los detalles de un préstamo específico",
  })
  @ApiParam({
    name: "id",
    description: "ID del préstamo",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiOkResponse({
    description: "Préstamo obtenido exitosamente",
    type: ApiResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Préstamo no encontrado",
    type: ErrorResponse,
  })
  async findOne(
    @Req() req: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<any> | ErrorResponse> {
    try {
      const loan = await this.getLoanByIdUseCase.execute(req.user.id, id);

      return {
        statusCode: HttpStatus.OK,
        data: loan,
        message: "Loan retrieved successfully",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return new ErrorResponse(
        HttpStatus.NOT_FOUND,
        "Not Found",
        "Loan not found",
      );
    }
  }

  @Put(":id")
  @ApiOperation({
    summary: "Actualizar un préstamo",
    description: "Actualiza los datos de un préstamo específico",
  })
  @ApiParam({
    name: "id",
    description: "ID del préstamo",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiBody({ type: UpdateLoanDto })
  @ApiOkResponse({
    description: "Préstamo actualizado exitosamente",
    type: ApiResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Préstamo no encontrado",
    type: ErrorResponse,
  })
  @ApiBadRequestResponse({
    description: "Datos de actualización inválidos",
    type: ErrorResponse,
  })
  async update(
    @Req() req: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateLoanDto: UpdateLoanDto,
  ): Promise<ApiResponseDto<any> | ErrorResponse> {
    try {
      const updateData: any = {};
      if (updateLoanDto.interestRate !== undefined)
        updateData.interestRate = updateLoanDto.interestRate;
      if (updateLoanDto.installment !== undefined)
        updateData.installment = updateLoanDto.installment;
      if (updateLoanDto.debtor !== undefined)
        updateData.debtor = updateLoanDto.debtor;

      const loan = await this.updateLoanUseCase.execute(req.user.id, id, updateData);

      return {
        statusCode: HttpStatus.OK,
        data: loan,
        message: "Loan updated successfully",
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
  @ApiOperation({
    summary: "Registrar un pago de préstamo",
    description: "Registra un pago para un préstamo específico",
  })
  @ApiParam({
    name: "id",
    description: "ID del préstamo",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiBody({ type: RegisterLoanPaymentDto })
  @ApiOkResponse({
    description: "Pago registrado exitosamente",
    type: ApiResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Préstamo no encontrado",
    type: ErrorResponse,
  })
  @ApiBadRequestResponse({
    description: "Datos de pago inválidos",
    type: ErrorResponse,
  })
  async registerPayment(
    @Req() req: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() registerLoanPaymentDto: RegisterLoanPaymentDto,
  ): Promise<ApiResponseDto<any> | ErrorResponse> {
    try {
      const loan = await this.registerLoanPaymentUseCase.execute(
        req.user.id,
        id,
        registerLoanPaymentDto.amount,
      );

      return {
        statusCode: HttpStatus.OK,
        data: loan,
        message: "Loan payment registered successfully",
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
    summary: "Eliminar un préstamo",
    description: "Elimina un préstamo específico por ID (solo si está totalmente pagado)",
  })
  @ApiParam({
    name: "id",
    description: "ID del préstamo",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiNoContentResponse({
    description: "Préstamo eliminado exitosamente",
  })
  @ApiNotFoundResponse({
    description: "Préstamo no encontrado",
    type: ErrorResponse,
  })
  @ApiBadRequestResponse({
    description: "No se puede eliminar un préstamo no pagado",
    type: ErrorResponse,
  })
  async remove(
    @Req() req: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.deleteLoanUseCase.execute(req.user.id, id);
  }

  @Get("summary/overall")
  @ApiOperation({
    summary: "Obtener resumen general de préstamos",
    description:
      "Retorna un resumen general de todos los préstamos. Puede filtrarse por rango de fechas (startDate/endDate).",
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
  async getLoansSummary(
    @Req() req: RequestWithUser,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ): Promise<ApiResponseDto<any>> {
    const summary = await this.getLoansSummaryUseCase.execute(req.user.id, {
      startDate,
      endDate,
    });

    return {
      statusCode: HttpStatus.OK,
      data: summary,
      message: "Loan summary retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("summary/monthly")
  @ApiOperation({
    summary: "Obtener resumen mensual de préstamos",
    description: "Retorna un resumen de préstamos por mes",
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

    const summary = await this.getMonthlySummaryUseCase.execute(req.user.id, yearNum, monthNum);

    return {
      statusCode: HttpStatus.OK,
      data: summary,
      message: "Monthly loan summary retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("summary/yearly")
  @ApiOperation({
    summary: "Obtener resumen anual de préstamos",
    description: "Retorna un resumen de préstamos por año",
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

    const summary = await this.getYearlySummaryUseCase.execute(req.user.id, yearNum);

    return {
      statusCode: HttpStatus.OK,
      data: summary,
      message: "Yearly loan summary retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("summary/overdue")
  @ApiOperation({
    summary: "Obtener préstamos vencidos",
    description: "Retorna una lista de préstamos que están vencidos",
  })
  @ApiOkResponse({
    description: "Préstamos vencidos obtenidos exitosamente",
    type: ApiResponseDto,
  })
  async getOverdueLoans(
    @Req() req: RequestWithUser,
  ): Promise<ApiResponseDto<any>> {
    const overdueLoans = await this.getOverdueLoansUseCase.execute(req.user.id);

    return {
      statusCode: HttpStatus.OK,
      data: overdueLoans,
      message: "Overdue loans retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("summary/performance/:loanId")
  @ApiOperation({
    summary: "Obtener rendimiento de un préstamo",
    description:
      "Retorna el rendimiento y estadísticas de un préstamo específico",
  })
  @ApiParam({
    name: "loanId",
    description: "ID del préstamo",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiOkResponse({
    description: "Rendimiento del préstamo obtenido exitosamente",
    type: ApiResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Préstamo no encontrado",
    type: ErrorResponse,
  })
  async getLoanPerformance(
    @Req() req: RequestWithUser,
    @Param("loanId", ParseUUIDPipe) loanId: string,
  ): Promise<ApiResponseDto<any>> {
    const performance = await this.getLoanPerformanceUseCase.execute(req.user.id, loanId);

    return {
      statusCode: HttpStatus.OK,
      data: performance,
      message: "Loan performance retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }
}