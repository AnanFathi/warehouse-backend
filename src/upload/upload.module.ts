import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { CategoryModule } from '../category/category.module';
import { ItemModule } from '../item/item.module';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { CronService } from '../cron/cron.service';

@Module({
  imports: [UserModule, CategoryModule, ItemModule],
  providers: [UploadService, CronService],
  controllers: [UploadController],
})
export class UploadModule {}
