import { ApiProperty } from "@nestjs/swagger";

export enum UserProvider {
  LOCAL = "local",
  GOOGLE = "google",
}

export class User {
  @ApiProperty({
    description: "ID único del usuario (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Correo electrónico",
    example: "user@example.com",
  })
  email: string;

  @ApiProperty({ description: "Nombre completo", example: "John Doe" })
  name: string;

  @ApiProperty({
    description: "Proveedor de autenticación",
    enum: UserProvider,
    example: "local",
  })
  provider: UserProvider;

  @ApiProperty({ description: "Usuario activo", example: true })
  isActive: boolean;

  constructor(
    email: string,
    name: string,
    provider: UserProvider = UserProvider.LOCAL,
    id?: string,
  ) {
    this.id = id!;
    this.email = email;
    this.name = name;
    this.provider = provider;
    this.isActive = true;
  }

  updateProfile(name: string): void {
    this.name = name;
  }

  deactivate(): void {
    this.isActive = false;
  }

  activate(): void {
    this.isActive = true;
  }
}
