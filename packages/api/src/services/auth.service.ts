import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { UnauthorizedError, ValidationError, NotFoundError } from '../middleware/error-handler.js';
import { JwtPayload } from '../middleware/auth.js';

const SALT_ROUNDS = 12;

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
  token: string;
  expiresIn: string;
}

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  const { email, password, name } = input;

  logger.info({ email }, 'Registration attempt');

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    logger.warn({ email }, 'Registration failed: email already registered');
    throw new ValidationError('Email already registered');
  }

  // Validate password strength
  if (password.length < 8) {
    logger.warn({ email }, 'Registration failed: password too short');
    throw new ValidationError('Password must be at least 8 characters');
  }

  // Hash password with bcrypt
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: name || null,
      role: 'USER',
      isActive: true,
    },
  });

  logger.info({ userId: user.id, email: user.email }, 'User registered successfully');

  // Generate JWT
  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    token,
    expiresIn: env.JWT_EXPIRES_IN,
  };
}

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  const { email, password } = input;

  logger.info({ email }, 'Login attempt');

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    logger.warn({ email }, 'Login failed: user not found');
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.isActive) {
    logger.warn({ email, userId: user.id }, 'Login failed: account disabled');
    throw new UnauthorizedError('Account is disabled');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    logger.warn({ email, userId: user.id }, 'Login failed: invalid password');
    throw new UnauthorizedError('Invalid email or password');
  }

  logger.info({ userId: user.id, email: user.email }, 'User logged in successfully');

  // Generate JWT
  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    token,
    expiresIn: env.JWT_EXPIRES_IN,
  };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('Account is disabled');
  }

  return user;
}

export async function updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  logger.info({ userId }, 'Password update attempt');

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    logger.warn({ userId }, 'Password update failed: user not found');
    throw new NotFoundError('User not found');
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.password);

  if (!isValidPassword) {
    logger.warn({ userId }, 'Password update failed: incorrect current password');
    throw new UnauthorizedError('Current password is incorrect');
  }

  // Validate new password
  if (newPassword.length < 8) {
    logger.warn({ userId }, 'Password update failed: new password too short');
    throw new ValidationError('New password must be at least 8 characters');
  }

  // Hash and update
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  logger.info({ userId }, 'Password updated successfully');
}

function generateToken(user: { id: string; email: string; role: string }): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as string,
  } as jwt.SignOptions);
}
