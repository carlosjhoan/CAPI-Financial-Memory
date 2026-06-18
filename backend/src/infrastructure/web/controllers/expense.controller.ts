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
import { CreateExpenseUseCase } from "../../../application/expense/create-expense.use-case";
import { GetAllExpensesPaginatedUseCase } from "../../../application/expense/get-all-expenses-paginated.use-case";
import { GetExpensesByDateRangePaginatedUseCase } from "../../../application/expense/get-expenses-by-date-range-paginated.use-case";
import { GetExpenseByIdUseCase } from "../../../application/expense/get-expense-by-id.use-case";
import { UpdateExpenseUseCase } from "../../../application/expense/update-expense.use-case";
import { DeleteExpenseUseCase } from "../../../application/expense/delete-expense.use-case";
import { GetExpensesSummaryUseCase } from "../../../application/expense/get-expenses-summary.use-case";
import { GetMonthlySummaryUseCase } from "../../../application/expense/get-monthly-summary.use-case";
import { GetYearlySummaryUseCase } from "../../../application/expense/get-yearly-summary.use-case";
import { CreateExpenseDto } from "../dto/create-expense.dto";
import { UpdateExpenseDto } from "../dto/update-expense.dto";
import { ApiResponse as ApiResponseDto } from "../../../shared/dtos/api-response.dto";
import { ErrorResponse } from "../../../shared/dtos/error-response.dto";
import { ExpenseQueryDto } from "../dto/expense-query.dto";
import { JwtAuthGuard } from "../../../application/auth/guards/jwt-auth.guard";
import { RequestWithUser } from "../../../application/auth/types";

@ApiTags("expenses")
@UseGuards(JwtAuthGuard)
@Controller("expenses")
export class ExpenseController {
  constructor(
    private readonly createExpenseUseCase: CreateExpenseUseCase,
    private readonly getAllExpensesPaginatedUseCase: GetAllExpensesPaginatedUseCase,
    private readonly getExpensesByDateRangePaginatedUseCase: GetExpensesByDateRangePaginatedUseCase,
    private readonly getExpenseByIdUseCase: GetExpenseByIdUseCase,
    private readonly updateExpenseUseCase: UpdateExpenseUseCase,
    private readonly deleteExpenseUseCase: DeleteExpenseUseCase,
    private readonly getExpensesSummaryUseCase: GetExpensesSummaryUseCase,
    private readonly getMonthlySummaryUseCase: GetMonthlySummaryUseCase,
    private readonly getYearlySummaryUseCase: GetYearlySummaryUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Crear un nuevo gasto",
    description: "Crea un registro de gasto con los datos proporcionados",
  })
  @ApiBody({ type: CreateExpenseDto })
  @ApiCreatedResponse({
    description: "Gasto creado exitosamente",
    type: ApiResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Datos de entrada inválidos",
    type: ErrorResponse,
  })
  async create(
    @Req() req: RequestWithUser,
    @Body() createExpenseDto: CreateExpenseDto,
  ): Promise<ApiResponseDto<any>> {
    try {
      // Use UTC noon to ensure date is stored correctly (avoid timezone shifts)
      const dateStr = createExpenseDto.date.includes("T")
        ? createExpenseDto.date
        : `${createExpenseDto.date}T12:00:00.000Z`;

      const expense = await this.createExpenseUseCase.execute(
        req.user.id,
        createExpenseDto.amount,
        createExpenseDto.reason,
        new Date(dateStr),
        createExpenseDto.allocations,
      );

      return {
        statusCode: HttpStatus.CREATED,
        data: expense,
        message: "Expense created successfully",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  @ApiOperation({
    summary: "Obtener todos los gastos",
    description:
      "Retorna una lista de todos los gastos registrados. Puede filtrarse por rango de fechas (startDate/endDate) o por año/mes. Soporta paginación.",
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
    description: "Lista de gastos obtenida exitosamente",
    type: ApiResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Parámetros de fecha inválidos",
    type: ErrorResponse,
  })
  async findAll(
    @Req() req: RequestWithUser,
    @Query() query: ExpenseQueryDto,
  ): Promise<ApiResponseDto<any> | ErrorResponse> {
    try {
      // Configuración de paginación
      const page = query?.page || 1;
      const limit = query?.limit || 6;
      const skip = (page - 1) * limit;

      let expenses;
      let totalExpenses = 0;

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
        const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
        const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

        const result =
          await this.getExpensesByDateRangePaginatedUseCase.execute(
            req.user.id,
            startDate,
            endDate,
            skip,
            limit,
          );
        expenses = result.data;
        totalExpenses = result.total;
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

        const result =
          await this.getExpensesByDateRangePaginatedUseCase.execute(
            req.user.id,
            startDate,
            endDate,
            skip,
            limit,
          );
        expenses = result.data;
        totalExpenses = result.total;
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

        const result =
          await this.getExpensesByDateRangePaginatedUseCase.execute(
            req.user.id,
            startDate,
            endDate,
            skip,
            limit,
          );
        expenses = result.data;
        totalExpenses = result.total;
      } else {
        const result = await this.getAllExpensesPaginatedUseCase.execute(
          req.user.id,
          skip,
          limit,
        );
        expenses = result.data;
        totalExpenses = result.total;
      }

      const totalPages = Math.ceil(totalExpenses / limit);

      return {
        statusCode: HttpStatus.OK,
        data: expenses,
        message: "Expenses retrieved successfully",
        timestamp: new Date().toISOString(),
        meta: {
          total: totalExpenses,
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
    summary: "Obtener un gasto por ID",
    description: "Retorna los detalles de un gasto específico",
  })
  @ApiParam({
    name: "id",
    description: "ID del gasto",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiOkResponse({
    description: "Gasto obtenido exitosamente",
    type: ApiResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Gasto no encontrado",
    type: ErrorResponse,
  })
  async findOne(
    @Req() req: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<any> | ErrorResponse> {
    try {
      const expense = await this.getExpenseByIdUseCase.execute(req.user.id, id);

      return {
        statusCode: HttpStatus.OK,
        data: expense,
        message: "Expense retrieved successfully",
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
    summary: "Actualizar un gasto",
    description: "Actualiza los datos de un gasto específico",
  })
  @ApiParam({
    name: "id",
    description: "ID del gasto",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiBody({ type: UpdateExpenseDto })
  @ApiOkResponse({
    description: "Gasto actualizado exitosamente",
    type: ApiResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Gasto no encontrado",
    type: ErrorResponse,
  })
  @ApiBadRequestResponse({
    description: "Datos de actualización inválidos",
    type: ErrorResponse,
  })
  async update(
    @Req() req: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ): Promise<ApiResponseDto<any> | ErrorResponse> {
    try {
      const updateData: any = {};
      if (updateExpenseDto.amount !== undefined)
        updateData.amount = updateExpenseDto.amount;
      if (updateExpenseDto.reason !== undefined)
        updateData.reason = updateExpenseDto.reason;
      if (updateExpenseDto.date !== undefined) {
        const dateStr = updateExpenseDto.date.includes("T")
          ? updateExpenseDto.date
          : `${updateExpenseDto.date}T12:00:00.000Z`; // UTC noon to avoid timezone shifts
        updateData.date = new Date(dateStr);
      }

      const expense = await this.updateExpenseUseCase.execute(
        req.user.id,
        id,
        updateData,
      );

      return {
        statusCode: HttpStatus.OK,
        data: expense,
        message: "Expense updated successfully",
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
    summary: "Eliminar un gasto",
    description: "Elimina un gasto específico por ID",
  })
  @ApiParam({
    name: "id",
    description: "ID del gasto",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiNoContentResponse({
    description: "Gasto eliminado exitosamente",
  })
  @ApiNotFoundResponse({
    description: "Gasto no encontrado",
    type: ErrorResponse,
  })
  async remove(
    @Req() req: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.deleteExpenseUseCase.execute(req.user.id, id);
  }

  @Get("summary/monthly")
  @ApiOperation({
    summary: "Obtener resumen mensual de gastos",
    description: "Retorna un resumen de gastos por mes",
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
      message: "Monthly expense summary retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("summary/yearly")
  @ApiOperation({
    summary: "Obtener resumen anual de gastos",
    description: "Retorna un resumen de gastos por año",
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
      message: "Yearly expense summary retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("summary/overall")
  @ApiOperation({
    summary: "Obtener resumen general de gastos",
    description:
      "Retorna un resumen general de todos los gastos. Puede filtrarse por rango de fechas (startDate/endDate).",
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
  async getExpensesSummary(
    @Req() req: RequestWithUser,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ): Promise<ApiResponseDto<any>> {
    const summary = await this.getExpensesSummaryUseCase.execute(req.user.id, {
      startDate,
      endDate,
    });

    return {
      statusCode: HttpStatus.OK,
      data: summary,
      message: "Expense summary retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }
}
