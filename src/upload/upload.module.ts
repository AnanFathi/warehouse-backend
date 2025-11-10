import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { CategoryModule } from '../category/category.module';
import { ItemModule } from '../item/item.module';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';

@Module({
  imports: [UserModule, CategoryModule, ItemModule],
  providers: [UploadService],
  controllers: [UploadController],
})
export class UploadModule {}
