import { Types } from 'mongoose';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from './schemas/category.schema';
import { Item } from 'src/item/schemas/item.schema';
import { IPaginated } from 'src/types/shared.model';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Item.name) private itemModel: Model<Item>,
  ) {}

  private async getCounts(category: Category): Promise<any> {
    const itemCount = await this.itemModel.countDocuments({
      category: category._id,
    });

    return {
      ...category.toObject(),
      itemCount,
    };
  }

  async create(data: any): Promise<Category> {
    const created = new this.categoryModel(data);
    return created.save();
  }

  async findAllSimpleList(search?: string): Promise<Category[]> {
    const filter = search ? { name: { $regex: search, $options: 'i' } } : {};
    return this.categoryModel.find(filter).sort({ name: 1 }).exec();
  }

  // 🧩 Unified find
  async findCategories(query: {
    page?: string;
    itemsPerPage?: string;
    name?: string;
  }): Promise<IPaginated> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.itemsPerPage || '10', 10);
    let filter: any = {};

    // ✅ Name search (case-insensitive, partial match)
    if (query.name) {
      filter.name = { $regex: query.name, $options: 'i' };
    }

    const [categories, totalItems] = await Promise.all([
      this.categoryModel
        .find(filter)
        .populate('attributes')
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.categoryModel.countDocuments(filter),
    ]);

    if (!categories.length) {
      return {
        data: [],
        itemsPerPage: 0,
        totalItems: 0,
        currentPage: page,
        totalPages: 0,
      };
    }

    const data = await Promise.all(
      categories.map((cat) => this.getCounts(cat)),
    );

    return {
      data,
      itemsPerPage: data.length,
      totalItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
    };
  }

  async findOne(id: string): Promise<any> {
    const category = await this.categoryModel
      .findById(id)
      .populate('attributes')
      .exec();

    if (!category) throw new NotFoundException('CATEGORY_NOT_FOUND');
    return this.getCounts(category);
  }

  async update(id: string, data: any): Promise<any> {
    const updated = await this.categoryModel
      .findByIdAndUpdate(id, data, { new: true })
      .populate('attributes');

    if (!updated) throw new NotFoundException('CATEGORY_NOT_FOUND');

    return this.getCounts(updated);
  }

  async remove(id: string): Promise<{}> {
    await this.categoryModel.findByIdAndDelete(id).exec();
    await this.itemModel
      .updateMany({ category: id }, { $set: { category: null } })
      .exec();
    return {};
  }
}
