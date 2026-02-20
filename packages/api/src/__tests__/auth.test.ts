import request from 'supertest';
import express from 'express';
import { prisma, createTestUser, generateTestToken, TEST_JWT_SECRET } from './setup.js';

// Create a minimal test app
const createTestApp = async () => {
  // Dynamically import to avoid module resolution issues
  const cors = (await import('cors')).default;
  const { authRoutes } = await import('../routes/auth.routes.js');
  const { errorHandler, notFoundHandler } = await import('../middleware/error-handler.js');

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

describe('Auth API Endpoints', () => {
  let app: express.Application;

  beforeAll(async () => {
    // Set required env vars for the auth module
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    process.env.JWT_EXPIRES_IN = '1h';
    app = await createTestApp();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        name: 'New User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('expiresIn');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.user.role).toBe('USER');
      // Password should not be returned
      expect(response.body.data.user.password).toBeUndefined();

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(user).not.toBeNull();
      expect(user?.email).toBe(userData.email);
    });

    it('should reject duplicate email registration', async () => {
      const email = 'existing@example.com';

      // Create an existing user
      await createTestUser({ email });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'SecurePassword123!',
          name: 'Another User',
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already registered');
    });

    it('should reject weak password (less than 8 characters)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'weakpass@example.com',
          password: 'short',
          name: 'Weak Password User',
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Validation error');
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-a-valid-email',
          password: 'SecurePassword123!',
          name: 'Invalid Email User',
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should register user without name (optional field)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'noname@example.com',
          password: 'SecurePassword123!',
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBeNull();
    });
  });

  describe('POST /api/auth/login', () => {
    const testEmail = 'login@example.com';
    const testPassword = 'CorrectPassword123!';

    beforeEach(async () => {
      await createTestUser({
        email: testEmail,
        password: testPassword,
        name: 'Login Test User',
      });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('expiresIn');
      expect(response.body.data.user.email).toBe(testEmail);
      // Verify token is a valid JWT format
      expect(response.body.data.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!',
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid email or password');
    });

    it('should reject login for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid email or password');
    });

    it('should reject login for inactive user', async () => {
      const inactiveEmail = 'inactive@example.com';
      await createTestUser({
        email: inactiveEmail,
        password: testPassword,
        isActive: false,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: inactiveEmail,
          password: testPassword,
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('disabled');
    });

    it('should reject login with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: testPassword,
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const user = await createTestUser({
        email: 'me@example.com',
        name: 'Me User',
      });
      const token = generateTestToken(user);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(user.id);
      expect(response.body.data.email).toBe(user.email);
      expect(response.body.data.name).toBe(user.name);
      expect(response.body.data.role).toBe(user.role);
      // Password should not be returned
      expect(response.body.data.password).toBeUndefined();
    });

    it('should reject request without authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('authorization');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject request with expired token', async () => {
      const jwt = await import('jsonwebtoken');
      const user = await createTestUser();

      // Generate an already expired token
      const expiredToken = jwt.default.sign(
        { userId: user.id, email: user.email, role: user.role },
        TEST_JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject request with malformed authorization header', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user);

      // Missing "Bearer" prefix
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject request if user no longer exists', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user);

      // Delete the user
      await prisma.user.delete({ where: { id: user.id } });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject request if user is inactive', async () => {
      const user = await createTestUser({ isActive: true });
      const token = generateTestToken(user);

      // Deactivate the user after token generation
      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: false },
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
