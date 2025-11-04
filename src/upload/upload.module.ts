import { Module } from '@nestjs/common';
import { CategoryModule } from '../category/category.module';
import { ItemModule } from '../item/item.module';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';

@Module({
  imports: [ItemModule, CategoryModule],
  providers: [UploadService],
  controllers: [UploadController],
})
export class UploadModule {}
