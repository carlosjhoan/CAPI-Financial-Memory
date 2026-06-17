import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class GoogleAuthDto {
  @ApiProperty({
    description: "Google ID token (credential) from the Google OAuth client",
  })
  @IsString()
  @IsNotEmpty()
  credential: string;
}
