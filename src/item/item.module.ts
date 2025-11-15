import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Item, ItemSchema } from './schemas/item.schema';
import { Category, CategorySchema } from 'src/category/schemas/category.schema';
import {
  Attribute,
  AttributeSchema,
} from 'src/attribute/schemas/attribute.schema';
import { Color, ColorSchema } from 'src/color/schemas/color.schema';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Item.name, schema: ItemSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Attribute.name, schema: AttributeSchema },
      { name: Color.name, schema: ColorSchema },
    ]),
  ],
  providers: [ItemService],
  controllers: [ItemController],
  exports: [MongooseModule, ItemService],
})
export class ItemModule {}
