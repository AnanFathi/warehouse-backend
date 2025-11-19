import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UploadService } from 'src/upload/upload.service';

@Injectable()
export class CronService {
  constructor(private readonly uploadService: UploadService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleSupabaseKeepAlive() {
    console.log('[Cron Job] Starting Supabase keep-alive task...');
    await this.uploadService.ensureSupabaseActive();
    console.log('[Cron Job] Supabase keep-alive task finished.');
  }
}
