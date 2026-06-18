import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/infrastructure/web/modules/app.module';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Same global setup as main.ts
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    const testEmail = `e2e-test-${Date.now()}@test.com`;
    const testPassword = 'TestPass123!';

    it('POST /api/auth/register — deveulve 201 con token y usuario', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: testEmail, password: testPassword, name: 'E2E Test' })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.email).toBe(testEmail);
    });

    it('POST /api/auth/register — deveulve 409 si el email ya existe', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: testEmail, password: testPassword, name: 'Duplicate' })
        .expect(409);
    });

    it('POST /api/auth/login — deveulve 200 con credenciales válidas', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('POST /api/auth/login — deveulve 401 con credenciales inválidas', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'WrongPass!' })
        .expect(401);
    });

    it('GET /api/auth/me — deveulve el usuario con token válido', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword });

      const token = loginRes.body.accessToken;

      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.email).toBe(testEmail);
    });

    it('GET /api/auth/me — deveulve 401 sin token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });
  });
});
