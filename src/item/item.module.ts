import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Item, ItemSchema } from './schemas/item.schema';
import { Category, CategorySchema } from 'src/category/schemas/category.schema';
import { Attribute, AttributeSchema } from 'src/attribute/schemas/attribute.schema';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Item.name, schema: ItemSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Attribute.name, schema: AttributeSchema },
    ]),
  ],
  providers: [ItemService],
  controllers: [ItemController],
  exports: [MongooseModule, ItemService],
})
export class ItemModule {}
