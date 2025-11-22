import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  getHello(): string {
    return 'Hello World!';
  }

  @Cron('*/14 * * * *') // every 14 minutes
  async keepAlive(): Promise<void> {
    try {
      const backendUrl = process.env.BACKEND_URL as string;
      const res = await fetch(backendUrl);
      const text = await res.text();
      this.logger.log(`Self-ping response: ${text}`);
    } catch (err) {
      this.logger.error('Self-ping failed', err as any);
    }
  }
}
