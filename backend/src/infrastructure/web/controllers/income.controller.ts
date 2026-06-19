import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
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
import { CreateIncomeUseCase } from "../../../application/income/create-income.use-case";
import { GetIncomeByIdUseCase } from "../../../application/income/get-income-by-id.use-case";
import { UpdateIncomeUseCase } from "../../../application/income/update-income.use-case";
import { DeleteIncomeUseCase } from "../../../application/income/delete-income.use-case";
import { RegisterIncomePaymentUseCase } from "../../../application/income/register-income-payment.use-case";
import { GetIncomesSummaryUseCase } from "../../../application/income/get-incomes-summary.use-case";
import { GetMonthlySummaryUseCase } from "../../../application/income/get-monthly-summary.use-case";
import { GetYearlySummaryUseCase } from "../../../application/income/get-yearly-summary.use-case";
import { GetAllIncomesPaginatedUseCase } from "../../../application/income/get-all-incomes-paginated.use-case";
import { GetIncomesByDateRangePaginatedUseCase } from "../../../application/income/get-incomes-by-date-range-paginated.use-case";
import { GetIncomesByDateRangeUseCase } from "../../../application/income/get-incomes-by-date-range.use-case";
import { CreateIncomeDto } from "../dto/create-income.dto";
import { UpdateIncomeDto } from "../dto/update-income.dto";
import { RegisterIncomePaymentDto } from "../dto/register-income-payment.dto";
import { ApiResponse as ApiResponseDto } from "../../../shared/dtos/api-response.dto";
import { ErrorResponse } from "../../../shared/dtos/error-response.dto";
import { IncomeQueryDto } from "../dto/income-query.dto";
import { JwtAuthGuard } from "../../../application/auth/guards/jwt-auth.guard";
import { RequestWithUser } from "../../../application/auth/types";

@ApiTags("incomes")
@UseGuards(JwtAuthGuard)
@Controller("incomes")
export class IncomeController {
  constructor(
    private readonly createIncomeUseCase: CreateIncomeUseCase,
    private readonly getAllIncomesPaginatedUseCase: GetAllIncomesPaginatedUseCase,
    private readonly getIncomesByDateRangePaginatedUseCase: GetIncomesByDateRangePaginatedUseCase,
    private readonly getIncomesByDateRangeUseCase: GetIncomesByDateRangeUseCase,
    private readonly getIncomeByIdUseCase: GetIncomeByIdUseCase,
    private readonly updateIncomeUseCase: UpdateIncomeUseCase,
    private readonly deleteIncomeUseCase: DeleteIncomeUseCase,
    private readonly registerIncomePaymentUseCase: RegisterIncomePaymentUseCase,
    private readonly getIncomesSummaryUseCase: GetIncomesSummaryUseCase,
    private readonly getMonthlySummaryUseCase: GetMonthlySummaryUseCase,
    private readonly getYearlySummaryUseCase: GetYearlySummaryUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Crear un nuevo ingreso",
    description: "Crea un registro de ingreso con los datos proporcionados",
  })
  @ApiBody({ type: CreateIncomeDto })
  @ApiCreatedResponse({
    description: "Ingreso creado exitosamente",
    type: ApiResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Datos de entrada inválidos",
    type: ErrorResponse,
  })
  async create(
    @Req() req: RequestWithUser,
    @Body() createIncomeDto: CreateIncomeDto,
  ): Promise<ApiResponseDto<any>> {
    // Fix timezone: use UTC noon to ensure the date stored is the one the user entered
    const dateStr = createIncomeDto.date.includes("T")
      ? createIncomeDto.date
      : `${createIncomeDto.date}T12:00:00.000Z`; // Append UTC noon to avoid timezone shifts

    const income = await this.createIncomeUseCase.execute(
      req.user.id,
      createIncomeDto.amount,
      createIncomeDto.reason,
      new Date(dateStr),
      createIncomeDto.allocations,
    );

    return {
      statusCode: HttpStatus.CREATED,
      data: income,
      message: "Income created successfully",
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({
    summary: "Obtener todos los ingresos",
    description:
      "Retorna una lista de todos los ingresos registrados. Puede filtrarse por rango de fechas (startDate/endDate) o por año/mes. Soporta paginación.",
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
  @ApiOkResponse({
    description: "Lista de ingresos obtenida exitosamente",
    type: ApiResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Parámetros de fecha inválidos",
    type: ErrorResponse,
  })
  async findAll(
    @Req() req: RequestWithUser,
    @Query() query: IncomeQueryDto,
  ): Promise<ApiResponseDto<any> | ErrorResponse> {
    try {
      // Configuración de paginación
      const page = query?.page || 1;
      const limit = query?.limit || 6;
      const skip = (page - 1) * limit;

      let incomes;
      let totalIncomes = 0;

      // Prioridad: year/month > startDate/endDate > sin filtros
      if (query.year && query.month) {
        const year = parseInt(query.year);
        const month = parseInt(query.month) - 1; // Convertir de 1-indexed a 0-indexed

        // Validar valores
        if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
          return new ErrorResponse(
            HttpStatus.BAD_REQUEST,
            "Bad Request",
            "Invalid year or month. Month must be 1-12.",
          );
        }

        // Use UTC to avoid timezone issues when constructing date ranges
        // month is already 0-indexed (0=January, 11=December)
        const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
        const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)); // Last day of month

        const result = await this.getIncomesByDateRangePaginatedUseCase.execute(
          req.user.id,
          startDate,
          endDate,
          skip,
          limit,
        );
        incomes = result.data;
        totalIncomes = result.total;
      } else if (query.year) {
        const year = parseInt(query.year);
        if (isNaN(year)) {
          return new ErrorResponse(
            HttpStatus.BAD_REQUEST,
            "Bad Request",
            "Invalid year format. Use YYYY.",
          );
        }

        const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
        const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

        const result = await this.getIncomesByDateRangePaginatedUseCase.execute(
          req.user.id,
          startDate,
          endDate,
          skip,
          limit,
        );
        incomes = result.data;
        totalIncomes = result.total;
      } else if (query.startDate && query.endDate) {
        const startDate = new Date(query.startDate + "T00:00:00.000Z");
        const endDate = new Date(query.endDate + "T23:59:59.999Z");

        // Validar que las fechas sean válidas
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return new ErrorResponse(
            HttpStatus.BAD_REQUEST,
            "Bad Request",
            "Invalid date format. Please use ISO 8601 format (YYYY-MM-DD)",
          );
        }

        // Validar que startDate <= endDate
        if (startDate > endDate) {
          return new ErrorResponse(
            HttpStatus.BAD_REQUEST,
            "Bad Request",
            "startDate must be less than or equal to endDate",
          );
        }

        const result = await this.getIncomesByDateRangePaginatedUseCase.execute(
          req.user.id,
          startDate,
          endDate,
          skip,
          limit,
        );
        incomes = result.data;
        totalIncomes = result.total;
      } else {
        const result = await this.getAllIncomesPaginatedUseCase.execute(
          req.user.id,
          skip,
          limit,
        );
        incomes = result.data;
        totalIncomes = result.total;
      }

      const totalPages = Math.ceil(totalIncomes / limit);

      return {
        statusCode: HttpStatus.OK,
        data: incomes,
        message: "Incomes retrieved successfully",
        timestamp: new Date().toISOString(),
        meta: {
          total: totalIncomes,
          page,
          limit,
          totalPages,
        },
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
    summary: "Obtener un ingreso por ID",
    description: "Retorna los detalles de un ingreso específico",
  })
  @ApiParam({
    name: "id",
    description: "ID del ingreso",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiOkResponse({
    description: "Ingreso obtenido exitosamente",
    type: ApiResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Ingreso no encontrado",
    type: ErrorResponse,
  })
  async findOne(
    @Req() req: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<any> | ErrorResponse> {
    try {
      const income = await this.getIncomeByIdUseCase.execute(req.user.id, id);

      return {
        statusCode: HttpStatus.OK,
        data: income,
        message: "Income retrieved successfully",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return new ErrorResponse(
        HttpStatus.NOT_FOUND,
        "Not Found",
        error.message,
      );
    }
  }

  @Put(":id")
  @ApiOperation({
    summary: "Actualizar un ingreso",
    description: "Actualiza los datos de un ingreso específico",
  })
  @ApiParam({
    name: "id",
    description: "ID del ingreso",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiBody({ type: UpdateIncomeDto })
  @ApiOkResponse({
    description: "Ingreso actualizado exitosamente",
    type: ApiResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Ingreso no encontrado",
    type: ErrorResponse,
  })
  @ApiBadRequestResponse({
    description: "Datos de actualización inválidos",
    type: ErrorResponse,
  })
  async update(
    @Req() req: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateIncomeDto: UpdateIncomeDto,
  ): Promise<ApiResponseDto<any> | ErrorResponse> {
    try {
      const updateData: any = {};
      if (updateIncomeDto.amount !== undefined)
        updateData.amount = updateIncomeDto.amount;
      if (updateIncomeDto.reason !== undefined)
        updateData.reason = updateIncomeDto.reason;
      if (updateIncomeDto.date !== undefined) {
        const dateStr = updateIncomeDto.date.includes("T")
          ? updateIncomeDto.date
          : `${updateIncomeDto.date}T12:00:00.000Z`; // UTC noon to avoid timezone shifts
        updateData.date = new Date(dateStr);
      }
      if (updateIncomeDto.allocations !== undefined)
        updateData.allocations = updateIncomeDto.allocations;

      const income = await this.updateIncomeUseCase.execute(
        req.user.id,
        id,
        updateData,
      );

      return {
        statusCode: HttpStatus.OK,
        data: income,
        message: "Income updated successfully",
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
    summary: "Registrar un pago adicional a un ingreso",
    description: "Agrega un monto adicional a un ingreso existente",
  })
  @ApiParam({
    name: "id",
    description: "ID del ingreso",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiBody({ type: RegisterIncomePaymentDto })
  @ApiOkResponse({
    description: "Pago registrado exitosamente",
    type: ApiResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Ingreso no encontrado",
    type: ErrorResponse,
  })
  @ApiBadRequestResponse({
    description: "Datos de pago inválidos",
    type: ErrorResponse,
  })
  async registerPayment(
    @Req() req: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() registerIncomePaymentDto: RegisterIncomePaymentDto,
  ): Promise<ApiResponseDto<any> | ErrorResponse> {
    try {
      const income = await this.registerIncomePaymentUseCase.execute(
        req.user.id,
        id,
        registerIncomePaymentDto.amount,
      );

      return {
        statusCode: HttpStatus.OK,
        data: income,
        message: "Income payment registered successfully",
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
    summary: "Eliminar un ingreso",
    description: "Elimina un ingreso específico por ID",
  })
  @ApiParam({
    name: "id",
    description: "ID del ingreso",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiNoContentResponse({
    description: "Ingreso eliminado exitosamente",
  })
  @ApiNotFoundResponse({
    description: "Ingreso no encontrado",
    type: ErrorResponse,
  })
  async remove(
    @Req() req: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.deleteIncomeUseCase.execute(req.user.id, id);
  }

  @Get("summary/monthly")
  @ApiOperation({
    summary: "Obtener resumen mensual de ingresos",
    description: "Retorna un resumen de ingresos por mes",
  })
  @ApiQuery({
    name: "year",
    description: "Año para el resumen",
    example: "2024",
    required: false,
  })
  @ApiQuery({
    name: "month",
    description: "Mes para el resumen (0-11)",
    example: "0",
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
    // Use UTC to stay consistent with service's getUTCMonth() filtering
    const monthNum = month ? parseInt(month) - 1 : now.getUTCMonth();

    const summary = await this.getMonthlySummaryUseCase.execute(
      req.user.id,
      yearNum,
      monthNum,
    );

    return {
      statusCode: HttpStatus.OK,
      data: summary,
      message: "Monthly income summary retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("summary/yearly")
  @ApiOperation({
    summary: "Obtener resumen anual de ingresos",
    description: "Retorna un resumen de ingresos por año",
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
      message: "Yearly income summary retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("summary/overall")
  @ApiOperation({
    summary: "Obtener resumen general de ingresos",
    description:
      "Retorna un resumen general de todos los ingresos. Puede filtrarse por rango de fechas (startDate/endDate).",
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
  async getIncomesSummary(
    @Req() req: RequestWithUser,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ): Promise<ApiResponseDto<any>> {
    const summary = await this.getIncomesSummaryUseCase.execute(req.user.id, {
      startDate,
      endDate,
    });

    return {
      statusCode: HttpStatus.OK,
      data: summary,
      message: "Income summary retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }
}
