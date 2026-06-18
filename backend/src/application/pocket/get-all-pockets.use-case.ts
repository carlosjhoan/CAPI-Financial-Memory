import { Pocket } from "../../domain/entities/pocket.entity";
import { PocketService } from "../../domain/services/pocket.service";

export class GetAllPocketsUseCase {
  constructor(private readonly pocketService: PocketService) {}

  async execute(userId: string): Promise<Pocket[]> {
    return await this.pocketService.getAllPockets(userId);
  }
}
