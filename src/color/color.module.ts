import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ColorsService } from './color.service';
import { ColorsController } from './color.controller';
import { Color, ColorSchema } from './schemas/color.schema';
import { Item, ItemSchema } from 'src/item/schemas/item.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Color.name, schema: ColorSchema }]),
    MongooseModule.forFeature([{ name: Item.name, schema: ItemSchema }]),
  ],
  controllers: [ColorsController],
  providers: [ColorsService],
})
export class ColorModule {}
