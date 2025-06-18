
'use server';

import { z } from 'zod';
import bcrypt from 'bcrypt';
import { getUserById, updateUserNameDb, updateUserPasswordDb, getTopUsersDb } from '@/lib/db';
import type { AuthenticatedUser, LeaderboardUser } from '@/lib/types';

const saltRounds = 10;

const UpdateNameSchema = z.object({
  userId: z.number(),
  newName: z.string().min(2, { message: 'Name must be at least 2 characters long.' }),
});

const UpdatePasswordSchema = z.object({
  userId: z.number(),
  currentPassword: z.string().min(1, { message: 'Current password is required.'}),
  newPassword: z.string().min(6, { message: 'New password must be at least 6 characters long.' }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match.",
  path: ['confirmPassword'],
});


export async function updateNameAction(formData: FormData): Promise<{ error?: string; success?: string; user?: AuthenticatedUser }> {
  try {
    const validatedFields = UpdateNameSchema.safeParse({
      userId: parseInt(formData.get('userId') as string, 10),
      newName: formData.get('newName'),
    });

    if (!validatedFields.success) {
      return { error: 'Invalid fields.', details: validatedFields.error.flatten().fieldErrors };
    }

    const { userId, newName } = validatedFields.data;
    
    const user = await getUserById(userId);
    if (!user) {
      return { error: 'User not found.' };
    }

    const result = await updateUserNameDb(userId, newName);

    if (!result.success) {
      return { error: 'Failed to update name.' };
    }
    
    // Return the updated user details (without password)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { hashedPassword, ...updatedUser } = { ...user, name: newName };

    return { success: 'Name updated successfully!', user: updatedUser };

  } catch (error) {
    console.error('Update name error:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function updatePasswordAction(formData: FormData): Promise<{ error?: string; success?: string, details?: any }> {
  try {
    const validatedFields = UpdatePasswordSchema.safeParse({
      userId: parseInt(formData.get('userId') as string, 10),
      currentPassword: formData.get('currentPassword'),
      newPassword: formData.get('newPassword'),
      confirmPassword: formData.get('confirmPassword'),
    });
    
    if (!validatedFields.success) {
      return { error: 'Invalid fields.', details: validatedFields.error.flatten().fieldErrors };
    }

    const { userId, currentPassword, newPassword } = validatedFields.data;

    const user = await getUserById(userId);
    if (!user || !user.hashedPassword) {
      return { error: 'User not found or current password not set.' };
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!passwordMatch) {
      return { error: 'Incorrect current password.' };
    }

    const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);
    const result = await updateUserPasswordDb(userId, newHashedPassword);

    if (!result.success) {
      return { error: 'Failed to update password.' };
    }
    return { success: 'Password updated successfully!' };

  } catch (error) {
    console.error('Update password error:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function getLeaderboardAction(): Promise<{ error?: string; users?: LeaderboardUser[] }> {
  try {
    const users = await getTopUsersDb(10);
    return { users };
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return { error: 'Failed to fetch leaderboard.' };
  }
}
