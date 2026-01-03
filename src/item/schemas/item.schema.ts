import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Attribute } from 'src/attribute/schemas/attribute.schema';
import { Color } from 'src/color/schemas/color.schema';

@Schema({ timestamps: true })
export class Item extends Document {
  // ✅ Reference to the category
  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Types.ObjectId;

  // ✅ Attributes (reference + optional value)
  @Prop({
    type: [
      {
        attribute: { type: Types.ObjectId, ref: 'Attribute', required: true },
        value: { type: String, required: false },
      },
    ],
    default: [],
  })
  attributes: { attribute: Attribute; value?: string }[];

  // ✅ Item status
  @Prop({
    enum: ['IN_WAREHOUSE', 'OUT_OF_WAREHOUSE', 'UNKNOWN'],
    default: 'IN_WAREHOUSE',
  })
  status: string;

  @Prop({ required: false })
  name: string;

  @Prop({ required: false })
  comment: string;

  @Prop({ type: String, required: false })
  imageURL?: string;

  @Prop({ type: Types.ObjectId, ref: 'Color', required: false })
  color?: Color;

  @Prop({ type: Number, required: false })
  width?: number;

  @Prop({ type: Number, required: false })
  length?: number;

  @Prop({ type: Number, required: false })
  height?: number;
}

export const ItemSchema = SchemaFactory.createForClass(Item);
