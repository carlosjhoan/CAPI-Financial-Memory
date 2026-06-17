import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiNoContentResponse,
} from "@nestjs/swagger";
import { CreatePocketUseCase } from "../../../application/pocket/create-pocket.use-case";
import { RegisterDepositUseCase } from "../../../application/pocket/register-deposit.use-case";
import { GetAllPocketsUseCase } from "../../../application/pocket/get-all-pockets.use-case";
import { GetPocketWithDepositsUseCase } from "../../../application/pocket/get-pocket-with-deposits.use-case";
import { GetDepositsByPocketIdUseCase } from "../../../application/pocket/get-deposits-by-pocket-id.use-case";
import { GetPocketsSummaryUseCase } from "../../../application/pocket/get-pockets-summary.use-case";
import { UpdatePocketUseCase } from "../../../application/pocket/update-pocket.use-case";
import { DeletePocketUseCase } from "../../../application/pocket/delete-pocket.use-case";
import { TransferBetweenPocketsUseCase } from "../../../application/pocket/transfer-between-pockets.use-case";
import { DeleteWithTransferUseCase } from "../../../application/pocket/delete-with-transfer.use-case";
import { PocketService } from "../../../domain/services/pocket.service";
import { CreatePocketDto } from "../dto/create-pocket.dto";
import { UpdatePocketDto } from "../dto/update-pocket.dto";
import { RegisterDepositDto } from "../dto/register-deposit.dto";
import { CreateTransferDto } from "../dto/create-transfer.dto";
import { DeleteWithTransferDto } from "../dto/delete-with-transfer.dto";
import { ApiResponse as ApiResponseDto } from "../../../shared/dtos/api-response.dto";
import { ErrorResponse } from "../../../shared/dtos/error-response.dto";
import { JwtAuthGuard } from "../../../application/auth/guards/jwt-auth.guard";
import { RequestWithUser } from "../../../application/auth/types";

@ApiTags("pockets")
@Controller("pockets")
@UseGuards(JwtAuthGuard)
export class PocketController {
  constructor(
    private readonly getAllPocketsUseCase: GetAllPocketsUseCase,
    private readonly createPocketUseCase: CreatePocketUseCase,
    private readonly getPocketWithDepositsUseCase: GetPocketWithDepositsUseCase,
    private readonly getDepositsByPocketIdUseCase: GetDepositsByPocketIdUseCase,
    private readonly getPocketsSummaryUseCase: GetPocketsSummaryUseCase,
    private readonly updatePocketUseCase: UpdatePocketUseCase,
    private readonly deletePocketUseCase: DeletePocketUseCase,
    private readonly transferBetweenPocketsUseCase: TransferBetweenPocketsUseCase,
    private readonly deleteWithTransferUseCase: DeleteWithTransferUseCase,
    private readonly registerDepositUseCase: RegisterDepositUseCase,
    private readonly pocketService: PocketService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Crear un nuevo bolsillo",
    description:
      "Crea un nuevo bolsillo de ahorro. Puede ser tipo 'goal' (con meta) o 'deposit' (sin meta).",
  })
  @ApiBody({ type: CreatePocketDto })
  @ApiCreatedResponse({
    description: "Bolsillo creado exitosamente",
    type: ApiResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Datos de entrada inválidos",
    type: ErrorResponse,
  })
  async create(
    @Req() req: RequestWithUser,
    @Body() createPocketDto: CreatePocketDto,
  ): Promise<ApiResponseDto<any> | ErrorResponse> {
    try {
      const pocket = await this.createPocketUseCase.execute(
        req.user.id,
        createPocketDto.name,
        createPocketDto.type as "goal" | "deposit",
        createPocketDto.goal ?? 0,
        createPocketDto.accumulatedAmount,
        createPocketDto.motivation ?? 'Quiero ahorrar para algo que aún no sé qué es',
        createPocketDto.initialAmount,
      );

      return {
        statusCode: HttpStatus.CREATED,
        data: pocket,
        message: "Pocket created successfully",
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
    summary: "Obtener todos los bolsillos",
    description:
      "Retorna una lista de todos los bolsillos de ahorro registrados",
  })
  @ApiOkResponse({
    description: "Lista de bolsillos obtenida exitosamente",
    type: ApiResponseDto,
  })
  async findAll(
    @Req() req: RequestWithUser,
  ): Promise<ApiResponseDto<any>> {
    const pockets = await this.getAllPocketsUseCase.execute(req.user.id);

    return {
      statusCode: HttpStatus.OK,
      data: pockets,
      message: "Pockets retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("summary")
  @ApiOperation({
    summary: "Obtener resumen de bolsillos",
    description:
      "Retorna un resumen con el total acumulado, meta total y cantidad de bolsillos",
  })
  @ApiOkResponse({
    description: "Resumen obtenido exitosamente",
    type: ApiResponseDto,
  })
  async getSummary(
    @Req() req: RequestWithUser,
  ): Promise<ApiResponseDto<any>> {
    const summary = await this.getPocketsSummaryUseCase.execute(req.user.id);

    return {
      statusCode: HttpStatus.OK,
      data: summary,
      message: "Pocket summary retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  @Get(":id/deposits")
  @ApiOperation({
    summary: "Obtener depósitos de un bolsillo",
    description:
      "Retorna los depósitos registrados para un bolsillo específico con soporte de paginación",
  })
  @ApiParam({
    name: "id",
    description: "ID del bolsillo",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiOkResponse({
    description: "Depósitos obtenidos exitosamente",
    type: ApiResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Bolsillo no encontrado",
    type: ErrorResponse,
  })
  async getDeposits(
    @Req() req: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Query("offset") offset?: number,
    @Query("limit") limit?: number,
  ): Promise<ApiResponseDto<any> | ErrorResponse> {
    try {
      const deposits = await this.getDepositsByPocketIdUseCase.execute(req.user.id, id, {
        offset: offset ? Number(offset) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      return {
        statusCode: HttpStatus.OK,
        data: deposits,
        message: "Deposits retrieved successfully",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return new ErrorResponse(
        HttpStatus.NOT_FOUND,
        "Not Found",
        "Pocket not found",
      );
    }
  }

  @Get(":id/history")
  @ApiOperation({
    summary: "Obtener historial de movimientos paginado",
    description:
      "Retorna todos los movimientos del bolsillo (depósitos, gastos y transferencias) " +
      "mergeados, ordenados por fecha descendente y paginados.",
  })
  @ApiParam({
    name: "id",
    description: "ID del bolsillo",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiQuery({
    name: "page",
    description: "Número de página (default: 1)",
    example: 1,
    required: false,
  })
  @ApiQuery({
    name: "limit",
    description: "Cantidad de elementos por página (default: 20)",
    example: 20,
    required: false,
  })
  @ApiOkResponse({
    description: "Historial obtenido exitosamente",
    type: ApiResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Bolsillo no encontrado",
    type: ErrorResponse,
  })
  async getHistory(
    @Req() req: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ): Promise<ApiResponseDto<any> | ErrorResponse> {
    try {
      const pageNum = page ? Number(page) : 1;
      const limitNum = limit ? Number(limit) : 20;

      const { items, total } = await this.pocketService.getHistoryByPocketId(req.user.id, id, {
        page: pageNum,
        limit: limitNum,
      });

      const totalPages = Math.ceil(total / limitNum);

      return {
        statusCode: HttpStatus.OK,
        data: items,
        message: "History retrieved successfully",
        timestamp: new Date().toISOString(),
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
        },
      };
    } catch (error) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        error: "Not Found",
        message: error instanceof Error ? error.message : "Pocket not found",
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Get(":id")
  @ApiOperation({
    summary: "Obtener un bolsillo por ID",
    description:
      "Retorna los detalles de un bolsillo específico, incluyendo sus depósitos y gastos",
  })
  @ApiParam({
    name: "id",
    description: "ID del bolsillo",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiOkResponse({
    description: "Bolsillo obtenido exitosamente",
    type: ApiResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Bolsillo no encontrado",
    type: ErrorResponse,
  })
  async findOne(
    @Req() req: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<any> | ErrorResponse> {
    try {
      const { pocket, deposits, expenses } =
        await this.getPocketWithDepositsUseCase.execute(req.user.id, id);

      const transfers = await this.pocketService.getTransfersByPocketId(id);

      // Agregar dirección a cada transfer
      const transfersWithDirection = transfers.map((t) => ({
        ...t,
        direction: t.targetPocketId === id ? "incoming" : "outgoing",
      }));

      // Crear synthetic initial movement
      const initialMovement =
        pocket.initialAmount > 0
          ? {
              type: "opening",
              amount: pocket.initialAmount,
              date: pocket.createdAt,
              description: "Monto de apertura",
            }
          : undefined;

      return {
        statusCode: HttpStatus.OK,
        data: {
          ...pocket,
          deposits,
          expenses,
          transfers: transfersWithDirection,
          initialMovement,
        },
        message: "Pocket retrieved successfully",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return new ErrorResponse(
        HttpStatus.NOT_FOUND,
        "Not Found",
        "Pocket not found",
      );
    }
  }

  @Put(":id")
  @ApiOperation({
    summary: "Actualizar un bolsillo",
    description:
      "Actualiza los datos de un bolsillo específico. Si type cambia a 'deposit', goal se fuerza a 0.",
  })
  @ApiParam({
    name: "id",
    description: "ID del bolsillo",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiBody({ type: UpdatePocketDto })
  @ApiOkResponse({
    description: "Bolsillo actualizado exitosamente",
    type: ApiResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Bolsillo no encontrado",
    type: ErrorResponse,
  })
  @ApiBadRequestResponse({
    description: "Datos de actualización inválidos",
    type: ErrorResponse,
  })
  async update(
    @Req() req: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updatePocketDto: UpdatePocketDto,
  ): Promise<ApiResponseDto<any> | ErrorResponse> {
    try {
      const updateData: any = {};
      if (updatePocketDto.name !== undefined)
        updateData.name = updatePocketDto.name;
      if (updatePocketDto.type !== undefined)
        updateData.type = updatePocketDto.type;
      if (updatePocketDto.goal !== undefined)
        updateData.goal = updatePocketDto.goal;
      if (updatePocketDto.accumulatedAmount !== undefined)
        updateData.accumulatedAmount = updatePocketDto.accumulatedAmount;
      if (updatePocketDto.motivation !== undefined)
        updateData.motivation = updatePocketDto.motivation;

      const pocket = await this.updatePocketUseCase.execute(req.user.id, id, updateData);

      return {
        statusCode: HttpStatus.OK,
        data: pocket,
        message: "Pocket updated successfully",
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

  @Post(":id/deposits")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Registrar un depósito en un bolsillo",
    description:
      "Registra un depósito que incrementa el accumulatedAmount del bolsillo",
  })
  @ApiParam({
    name: "id",
    description: "ID del bolsillo",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiBody({ type: RegisterDepositDto })
  @ApiCreatedResponse({
    description: "Depósito registrado exitosamente",
    type: ApiResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Bolsillo no encontrado",
    type: ErrorResponse,
  })
  @ApiBadRequestResponse({
    description: "Datos de depósito inválidos",
    type: ErrorResponse,
  })
  async registerDeposit(
    @Req() req: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() registerDepositDto: RegisterDepositDto,
  ): Promise<ApiResponseDto<any> | ErrorResponse> {
    try {
      const depositDate = new Date(
        registerDepositDto.date + "T12:00:00.000Z",
      );

      const result = await this.registerDepositUseCase.execute(
        req.user.id,
        id,
        registerDepositDto.amount,
        depositDate,
        registerDepositDto.newGoal,
        registerDepositDto.reason,
      );

      // Enriquecer respuesta con transfers e initialMovement para mantener cache consistente
      const transfers = await this.pocketService.getTransfersByPocketId(id);
      const transfersWithDirection = transfers.map((t) => ({
        ...t,
        direction: t.targetPocketId === id ? "incoming" : "outgoing",
      }));

      const { pocket, deposit } = result;
      const initialMovement =
        pocket.initialAmount > 0
          ? {
              type: "opening",
              amount: pocket.initialAmount,
              date: pocket.createdAt,
              description: "Monto de apertura",
            }
          : undefined;

      return {
        statusCode: HttpStatus.CREATED,
        data: {
          pocket,
          deposit,
          transfers: transfersWithDirection,
          initialMovement,
        },
        message: "Deposit registered successfully",
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

  @Post("transfer")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Transferir entre bolsillos",
    description:
      "Transfiere un monto desde un bolsillo de origen a uno de destino. " +
      "Ambos bolsillos deben existir y el origen debe tener saldo suficiente. " +
      "La operación es atómica (transaccional).",
  })
  @ApiBody({ type: CreateTransferDto })
  @ApiCreatedResponse({
    description: "Transferencia realizada exitosamente",
    type: ApiResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Datos inválidos, bolsillo no encontrado o fondos insuficientes",
    type: ErrorResponse,
  })
  async transfer(
    @Req() req: RequestWithUser,
    @Body() createTransferDto: CreateTransferDto,
  ): Promise<ApiResponseDto<any> | ErrorResponse> {
    try {
      const transferDate = new Date(createTransferDto.date + "T12:00:00.000Z");

      const result = await this.transferBetweenPocketsUseCase.execute(
        req.user.id,
        createTransferDto.sourcePocketId,
        createTransferDto.targetPocketId,
        createTransferDto.amount,
        createTransferDto.reason,
        transferDate,
        createTransferDto.newGoal,
      );

      return {
        statusCode: HttpStatus.CREATED,
        data: result,
        message: "Transfer successful",
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

  @Post(":id/delete-with-transfer")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Eliminar bolsillo transfiriendo fondos",
    description:
      "Elimina un bolsillo transfiriendo primero sus fondos a uno o más bolsillos de destino. " +
      "La operación es atómica: todas las transferencias se realizan dentro de una transacción. " +
      "Si el bolsillo tiene fondos, primero se distribuyen según el arreglo de distribuciones, " +
      "y luego se elimina el bolsillo junto con sus registros asociados.",
  })
  @ApiParam({
    name: "id",
    description: "ID del bolsillo a eliminar",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiBody({ type: DeleteWithTransferDto })
  @ApiOkResponse({
    description: "Bolsillo eliminado y fondos transferidos exitosamente",
    type: ApiResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Distribuciones inválidas, fondos insuficientes o meta excedida",
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: "Bolsillo no encontrado",
    type: ErrorResponse,
  })
  async deleteWithTransfer(
    @Req() req: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: DeleteWithTransferDto,
  ): Promise<ApiResponseDto<any> | ErrorResponse> {
    try {
      const result = await this.deleteWithTransferUseCase.execute(
        req.user.id,
        id,
        dto.distributions,
        dto.reason,
        new Date(),
      );

      return {
        statusCode: HttpStatus.OK,
        data: result,
        message: "Pocket deleted and funds transferred successfully",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const msg = error.message || "";
      if (msg.startsWith("CANNOT_DELETE_WITH_FUNDS") || msg.startsWith("DISTRIBUTION_SUM_MISMATCH") || msg.startsWith("SOURCE_IS_TARGET") || msg.startsWith("TRANSFER_EXCEEDS_GOAL") || msg.startsWith("INSUFFICIENT_FUNDS")) {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          error: "Bad Request",
          message: msg,
          timestamp: new Date().toISOString(),
        });
      }
      if (msg.startsWith("POCKET_NOT_FOUND")) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          error: "Not Found",
          message: msg,
          timestamp: new Date().toISOString(),
        });
      }
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: "Bad Request",
        message: msg,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Eliminar un bolsillo",
    description:
      "Elimina un bolsillo específico por ID. Los depósitos asociados también se eliminan en cascada.",
  })
  @ApiParam({
    name: "id",
    description: "ID del bolsillo",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiNoContentResponse({
    description: "Bolsillo eliminado exitosamente",
  })
  @ApiNotFoundResponse({
    description: "Bolsillo no encontrado",
    type: ErrorResponse,
  })
  async remove(
    @Req() req: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<void> {
    try {
      await this.deletePocketUseCase.execute(req.user.id, id);
    } catch (error) {
      const msg = error.message || "";
      if (msg === "Pocket not found") {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          error: "Not Found",
          message: "Pocket not found",
          timestamp: new Date().toISOString(),
        });
      }
      if (msg.startsWith("CANNOT_DELETE_WITH_FUNDS")) {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          error: "Bad Request",
          message: msg,
          timestamp: new Date().toISOString(),
        });
      }
      throw error;
    }
  }
}
