/**
 * User Repository - Data Access Layer
 * @module repositories/UserRepository
 */

import { User, type IUserDocument } from '../models/User';
import { Logger } from '../utils/logger';

export class UserRepository {
  async findById(id: string): Promise<IUserDocument | null> {
    return User.findById(id).exec();
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    return User.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByRollNo(rollNo: string): Promise<IUserDocument | null> {
    return User.findOne({ rollNo: rollNo.toUpperCase() }).exec();
  }

  async findAllActive(): Promise<IUserDocument[]> {
    return User.find({ isActive: true }).select('_id email name').lean().exec();
  }

  async create(data: Partial<IUserDocument>): Promise<IUserDocument> {
    const user = await User.create(data);
    Logger.info('repository', 'User created', { userId: user._id, email: user.email });
    return user;
  }

  async updateLastLogin(id: string): Promise<void> {
    await User.findByIdAndUpdate(id, { lastLoginAt: new Date() }).exec();
  }
}

export const userRepository = new UserRepository();
