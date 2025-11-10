import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Item } from './schemas/item.schema';
import { Category } from 'src/category/schemas/category.schema';
import { Attribute } from 'src/attribute/schemas/attribute.schema';
import { IPaginated } from 'src/types/shared.model';

@Injectable()
export class ItemService {
  constructor(
    @InjectModel(Item.name) private itemModel: Model<Item>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Attribute.name) private attributeModel: Model<Attribute>,
  ) {}

  async create(data: {
    category: string; // required
    name: string;
    comment?: string;
    status: string;
  }): Promise<Item> {
    if (!data.category) {
      throw new Error('Category is required');
    }

    // Check that the category exists
    const category = await this.categoryModel.findById(data.category).exec();
    if (!category) {
      throw new Error('Category not found');
    }

    // Create the item with the valid ObjectId
    const created = new this.itemModel({
      ...data,
      category: category._id, // this is now guaranteed to be a valid ObjectId
    });

    return created.save();
  }

  async findOne(id: string): Promise<Item> {
    const item = await this.itemModel.findById(id).populate('category').exec();
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  async update(id: string, data: any): Promise<Item> {
    if (data.category) {
      const category = await this.categoryModel.findById(data.category);
      if (!category) throw new NotFoundException('Category not found');
    }

    const updated = await this.itemModel
      .findByIdAndUpdate(id, data, { new: true })
      .populate('category');
    if (!updated) throw new NotFoundException('Item not found');
    return updated;
  }

  async updateAttribute(
    itemId: string,
    attributeId: string,
    newValue: string,
  ): Promise<Item> {
    const item = await this.itemModel.findById(itemId);
    if (!item) throw new NotFoundException('Item not found');

    const attr = item.attributes.find(
      (a) => a.attribute.toString() === attributeId,
    );
    if (!attr) throw new NotFoundException('Attribute not found in this item');

    attr.value = newValue;
    await item.save();

    const updatedItem = await this.itemModel
      .findById(itemId)
      .populate('category')
      .exec();

    if (!updatedItem) throw new NotFoundException('Updated item not found');
    return updatedItem;
  }

  async remove(id: string): Promise<{}> {
    const deleted = await this.itemModel.findByIdAndDelete(id);
    return {};
  }

  // 🧩 Fetch items with optional filters + pagination
  async findWithFilters(query: {
    id?: string;
    category?: string;
    status?: string;
    page?: string;
    itemsPerPage?: string;
    attributes?: Record<string, string>;
    name?: string;
  }): Promise<IPaginated> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.itemsPerPage || '10', 10);
    const filter: Record<string, any> = {};

    // -------- Id ----------
    if (query.id) {
      filter.$expr = {
        $regexMatch: {
          input: { $toString: '$_id' },
          regex: new RegExp(`^${query.id}`),
        },
      };
    }

    // -------- Status ----------
    if (query.status) {
      filter.status = query.status;
    }

    // -------- Name search ----------
    if (query.name) {
      filter.name = { $regex: query.name, $options: 'i' };
    }

    // -------- Category (accept ID or name) ----------
    if (query.category) {
      let categoryId: Types.ObjectId | null = null;

      if (Types.ObjectId.isValid(query.category)) {
        categoryId = new Types.ObjectId(query.category);
      } else {
        const categoryDoc = await this.categoryModel
          .findOne({ name: { $regex: `^${query.category}$`, $options: 'i' } })
          .lean()
          .exec();
        if (categoryDoc)
          categoryId = new Types.ObjectId((categoryDoc as any)._id);
      }

      if (!categoryId) {
        return {
          data: [],
          itemsPerPage: 0,
          totalItems: 0,
          currentPage: page,
          totalPages: 0,
        };
      }

      filter.category = categoryId;
    }

    // -------- Attributes (keys can be attribute name OR attribute id) ----------
    if (query.attributes && Object.keys(query.attributes).length > 0) {
      const attrKeys = Object.keys(query.attributes);

      // Resolve each key to an attribute doc (by id or by name). use .lean() so we get plain objects.
      const attrDocs = await Promise.all(
        attrKeys.map(async (key) => {
          if (Types.ObjectId.isValid(key)) {
            return await this.attributeModel.findById(key).lean().exec();
          }
          return await this.attributeModel
            .findOne({ name: { $regex: `^${key}$`, $options: 'i' } })
            .lean()
            .exec();
        }),
      );

      // If any requested attribute doesn't exist -> return empty
      if (attrDocs.some((d) => !d)) {
        return {
          data: [],
          itemsPerPage: 0,
          totalItems: 0,
          currentPage: page,
          totalPages: 0,
        };
      }

      // Build $and clause where each attribute must match an elem in the item's attributes array
      const attrFilters = (attrDocs as any[]).map((attrDoc) => {
        const attrId = new Types.ObjectId(attrDoc._id);
        // try value by attribute name first (case-sensitive match to what client passed),
        // otherwise try by attribute id string
        const value =
          query.attributes?.[attrDoc.name] ??
          query.attributes?.[attrDoc._id.toString()];
        return {
          attributes: {
            $elemMatch: {
              attribute: attrId,
              value,
            },
          },
        };
      });

      if (attrFilters.length > 0) filter.$and = attrFilters;
    }

    // -------- Query DB (pagination + populate) ----------
    const [items, totalItems] = await Promise.all([
      this.itemModel
        .find(filter)
        .populate('category')
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.itemModel.countDocuments(filter),
    ]);

    return {
      data: items,
      itemsPerPage: items.length,
      totalItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
    };
  }
}
