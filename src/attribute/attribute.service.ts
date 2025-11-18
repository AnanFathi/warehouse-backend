import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attribute } from './schemas/attribute.schema';
import { Category } from 'src/category/schemas/category.schema';
import { Item } from 'src/item/schemas/item.schema';
import { IPaginated } from 'src/types/shared.model';

@Injectable()
export class AttributeService {
  constructor(
    @InjectModel(Attribute.name) private attributeModel: Model<Attribute>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Item.name) private itemModel: Model<Item>,
  ) {}

  async create(data: any): Promise<Attribute> {
    const created = new this.attributeModel(data);
    return created.save();
  }

  // 🧩 Fetch all attributes or by category (paginated)
  async findAll(
    categoryId?: string,
    page = 1,
    itemsPerPage = 10,
  ): Promise<IPaginated> {
    let filter: any = {};

    if (categoryId) {
      // Check if categoryId is valid
      if (!Types.ObjectId.isValid(categoryId)) {
        return {
          data: [],
          itemsPerPage: 0,
          totalItems: 0,
          currentPage: page,
          totalPages: 0,
        };
      }

      const category = await this.categoryModel.findById(categoryId).exec();
      if (!category || !category.attributes.length) {
        return {
          data: [],
          itemsPerPage: 0,
          totalItems: 0,
          currentPage: page,
          totalPages: 0,
        };
      }

      filter._id = { $in: category.attributes };
    }

    const [attributes, totalItems] = await Promise.all([
      this.attributeModel
        .find(filter)
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .exec(),
      this.attributeModel.countDocuments(filter),
    ]);

    return {
      data: attributes,
      itemsPerPage: attributes.length,
      totalItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / itemsPerPage),
    };
  }

  async findOne(id: string): Promise<Attribute> {
    const attribute = await this.attributeModel.findById(id).exec();
    if (!attribute) throw new NotFoundException('ATTRIBUTE_NOT_FOUND');
    return attribute;
  }

  async update(id: string, data: any): Promise<Attribute> {
    const updated = await this.attributeModel.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!updated) throw new NotFoundException('ATTRIBUTE_NOT_FOUND');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.attributeModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('ATTRIBUTE_NOT_FOUND');

    // Remove this attribute ID from all categories
    await this.categoryModel.updateMany(
      { attributes: id },
      { $pull: { attributes: id } },
    );

    await this.itemModel.updateMany(
      { 'attributes.attribute': id },
      { $pull: { attributes: { attribute: id } } },
    );
  }
}
