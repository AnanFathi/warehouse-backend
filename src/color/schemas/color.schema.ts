import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Color extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  color: string; // hex code, e.g. "#FF0000"
}

export const ColorSchema = SchemaFactory.createForClass(Color);
