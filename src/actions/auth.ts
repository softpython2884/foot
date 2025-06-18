'use server';

import { z } from 'zod';
import bcrypt from 'bcrypt';
import { findUserByEmail, createUser as dbCreateUser } from '@/lib/db';
import type { User } from '@/lib/types';

const saltRounds = 10;

const RegisterSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long.' }),
});

const LoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export async function registerUser(formData: FormData) {
  try {
    const validatedFields = RegisterSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
    });

    if (!validatedFields.success) {
      return { error: 'Invalid fields.', details: validatedFields.error.flatten().fieldErrors };
    }

    const { name, email, password } = validatedFields.data;

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return { error: 'User with this email already exists.' };
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const userId = await dbCreateUser(name, email, hashedPassword);

    if (!userId) {
      return { error: 'Failed to create user.' };
    }
    
    return { success: 'User registered successfully!', userId };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'An unexpected error occurred during registration.' };
  }
}

export async function loginUser(formData: FormData): Promise<{ error?: string; success?: string; user?: Omit<User, 'hashedPassword'>; details?: any }> {
  try {
    const validatedFields = LoginSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    if (!validatedFields.success) {
      return { error: 'Invalid fields.', details: validatedFields.error.flatten().fieldErrors };
    }

    const { email, password } = validatedFields.data;

    const user: User | undefined = await findUserByEmail(email);

    if (!user || !user.hashedPassword) {
      return { error: 'Invalid email or password.' };
    }

    const passwordMatch = await bcrypt.compare(password, user.hashedPassword);

    if (!passwordMatch) {
      return { error: 'Invalid email or password.' };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { hashedPassword, ...userWithoutPassword } = user;
    
    // For now, we just return success. Session management would be implemented here.
    return { success: 'Login successful!', user: userWithoutPassword };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'An unexpected error occurred during login.' };
  }
}
