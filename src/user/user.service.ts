import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { IPaginated } from 'src/types/shared.model';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // 1️⃣ Check if user with same email exists
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // 2️⃣ Hash password if provided
    if (createUserDto.password) {
      const salt = await bcrypt.genSalt(10);
      createUserDto.password = await bcrypt.hash(createUserDto.password, salt);
    }

    // 3️⃣ Create new user
    const createdUser = new this.userModel(createUserDto);
    const user = await createdUser.save();

    // 4️⃣ Exclude password from returned object
    const { password, ...result } = user.toObject();
    return result as unknown as User;
  }

  async findAll(query: {
    page?: string;
    itemsPerPage?: string;
    role?: string;
    search?: string;
  }): Promise<IPaginated> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.itemsPerPage || '10', 10);
    const filters: any = {};

    // Add role filter if provided
    if (query.role) {
      filters.role = query.role;
    }

    // Add search filter if provided
    if (query.search) {
      const regex = new RegExp(query.search, 'i'); // case-insensitive
      filters.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
      ];
    }

    const [users, totalItems] = await Promise.all([
      this.userModel
        .find(filters)
        .select('-password')
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filters),
    ]);

    if (!users.length) {
      return {
        data: [],
        itemsPerPage: 0,
        totalItems: 0,
        currentPage: page,
        totalPages: 0,
      };
    }

    return {
      data: users,
      itemsPerPage: users.length,
      totalItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
    };
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    // 🚫 Prevent updating password through this endpoint
    if ('password' in data) {
      delete data.password;
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, data, { new: true })
      .select('-password')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  async delete(id: string): Promise<{}> {
    await this.userModel.findByIdAndDelete(id).exec();
    return {};
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async changePassword(id: string, newPassword: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    const { password, ...result } = user.toObject();
    return result as unknown as User;
  }
}
