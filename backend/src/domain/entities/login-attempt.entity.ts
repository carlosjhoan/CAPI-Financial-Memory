export class LoginAttempt {
  constructor(
    public readonly email: string,
    public readonly ip: string,
    public readonly success: boolean,
    public readonly timestamp: Date,
    public id?: string,
  ) {}
}
