export class RefreshToken {
  constructor(
    public readonly userId: string,
    public readonly tokenHash: string,
    public readonly expiresAt: Date,
    public id?: string,
    public readonly createdAt?: Date,
  ) {}
}
