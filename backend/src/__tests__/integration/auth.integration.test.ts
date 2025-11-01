import request from 'supertest';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from '../../middleware/error-handler';
import authRoutes from '../../routes/auth.routes';
import { cleanupDatabase, seedTestData, closeDatabase } from './setup';

dotenv.config();

// Criar app Express para testes
function createTestApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use(errorHandler);
  return app;
}

describe('Auth API Integration Tests', () => {
  let app: express.Application;
  let userToken: string;

  beforeAll(async () => {
    // Aumentar timeout para operações de banco
    jest.setTimeout(30000);
    
    app = createTestApp();
    
    try {
      // Limpar e seed banco
      await cleanupDatabase();
      await seedTestData();
    } catch (error: any) {
      // Se o erro for de conexão, pular os testes que dependem do banco
      if (error?.code === 'P1001' || error?.message?.includes('Can\'t reach database')) {
        console.warn('⚠️  Banco de dados não disponível para testes de integração.');
        console.warn('   Configure TEST_DATABASE_URL ou use o banco principal.');
        console.warn('   Testes de integração serão pulados.');
        // Marcar que o banco não está disponível
        (global as any).skipIntegrationTests = true;
      } else {
        console.warn('Erro ao configurar banco de teste:', error);
      }
    }
  }, 30000);

  afterAll(async () => {
    await cleanupDatabase();
    await closeDatabase();
  });

  describe('POST /api/auth/login', () => {
    it('should successfully login with valid credentials', async () => {
      // Pular teste se banco não estiver disponível
      if ((global as any).skipIntegrationTests) {
        return;
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('user@test.com');

      userToken = response.body.accessToken;
    });

    it('should fail login with invalid email', async () => {
      if ((global as any).skipIntegrationTests) {
        return;
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid@test.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail login with invalid password', async () => {
      if ((global as any).skipIntegrationTests) {
        return;
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail login with missing email', async () => {
      // Este teste não depende do banco, apenas validação
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail login with missing password', async () => {
      // Este teste não depende do banco, apenas validação
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should login admin successfully', async () => {
      if ((global as any).skipIntegrationTests) {
        return;
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe('ADMIN');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should successfully refresh token with valid refresh token', async () => {
      if ((global as any).skipIntegrationTests) {
        return;
      }

      // Primeiro fazer login para obter refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'password123',
        });

      const refreshToken = loginResponse.body.refreshToken;

      // Fazer refresh
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should fail refresh with invalid refresh token', async () => {
      if ((global as any).skipIntegrationTests) {
        return;
      }

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail refresh with missing refresh token', async () => {
      // Este teste não depende do banco, apenas validação
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user info with valid token', async () => {
      if ((global as any).skipIntegrationTests) {
        return;
      }

      // Garantir que temos um token válido
      if (!userToken) {
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'user@test.com',
            password: 'password123',
          });
        userToken = loginResponse.body.accessToken;
      }

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email');
      expect(response.body.email).toBe('user@test.com');
    });

    it('should fail without token', async () => {
      // Este teste não depende do banco, apenas validação de token
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail with invalid token', async () => {
      // Este teste não depende do banco, apenas validação de token
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should successfully logout with valid token', async () => {
      if ((global as any).skipIntegrationTests) {
        return;
      }

      // Primeiro fazer login para obter tokens
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'password123',
        });

      const refreshToken = loginResponse.body.refreshToken;
      const accessToken = loginResponse.body.accessToken;

      // Fazer logout
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          refreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should fail logout without token', async () => {
      // Este teste não depende do banco, apenas validação de token
      const response = await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken: 'some-refresh-token',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
});

