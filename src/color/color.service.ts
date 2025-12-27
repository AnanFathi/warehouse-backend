import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Color } from './schemas/color.schema';
import { Item } from 'src/item/schemas/item.schema';

@Injectable()
export class ColorsService {
  constructor(
    @InjectModel(Color.name) private readonly colorModel: Model<Color>,
    @InjectModel(Item.name) private readonly itemModel: Model<Item>,
  ) {}

  async findAll(search?: string): Promise<Color[]> {
    const filter = search ? { name: { $regex: search, $options: 'i' } } : {};
    return this.colorModel.find(filter).sort({ name: 1 }).exec();
  }

  async findOne(id: string): Promise<Color> {
    const color = await this.colorModel.findById(id).exec();
    if (!color) throw new NotFoundException('COLOR_NOT_FOUND');
    return color;
  }

  async create(data: { name: string; color: string }): Promise<Color> {
    const created = new this.colorModel(data);
    return created.save();
  }

  async update(
    id: string,
    data: { name?: string; color?: string },
  ): Promise<Color> {
    const updated = await this.colorModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('COLOR_NOT_FOUND');
    return updated;
  }

  async remove(id: string): Promise<{}> {
    await this.colorModel.findByIdAndDelete(id).exec();
    await this.itemModel
      .updateMany({ color: id }, { $unset: { color: true } })
      .exec();
    return {};
  }
}
