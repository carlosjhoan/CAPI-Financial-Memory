import { PocketService } from "../../domain/services/pocket.service";

export class DeletePocketUseCase {
  constructor(private readonly pocketService: PocketService) {}

  async execute(userId: string, id: string): Promise<void> {
    return await this.pocketService.deletePocket(userId, id);
  }
}
