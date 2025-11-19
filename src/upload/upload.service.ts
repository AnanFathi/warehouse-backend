import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CategoryService } from '../category/category.service';
import { ItemService } from '../item/item.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';

@Injectable()
export class UploadService {
  private supabase: SupabaseClient;
  private bucketName: string;

  constructor(
    private readonly userService: UserService,
    private readonly categoryService: CategoryService,
    private readonly itemService: ItemService,
    private readonly configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
    const bucket = this.configService.get<string>('BUCKET_NAME');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or KEY is not set in env');
    }

    this.bucketName = bucket || 'app-images';
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async uploadEntityImage(
    type: 'user' | 'category' | 'item',
    id: string,
    file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('NO_FILE_PROVIDED');

    // Step 0: Ensure entity exists
    let entity: any;
    switch (type) {
      case 'user':
        entity = await this.userService.findById(id);
        if (!entity) throw new NotFoundException('USER_NOT_FOUND');
        break;
      case 'category':
        entity = await this.categoryService.findOne(id);
        if (!entity) throw new NotFoundException('CATEGORY_NOT_FOUND');
        break;
      case 'item':
        entity = await this.itemService.findOne(id);
        if (!entity) throw new NotFoundException('ITEM_NOT_FOUND');
        break;
      default:
        throw new BadRequestException(`Invalid type: ${type}`);
    }

    // ✅ Step 1: Delete old image if exists (fail silently)
    if (entity.imageURL) {
      const oldPath = this.extractFilePathFromUrl(entity.imageURL);
      if (oldPath) {
        this.supabase.storage
          .from(this.bucketName)
          .remove([oldPath])
          .catch(() => {});
      }
    }

    // Step 2: Build path in bucket
    const filePath = `${type}/${id}-${Date.now()}-${file.originalname}`;

    // Step 3: Upload to Supabase
    const { data: uploadData, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(filePath, file.buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.mimetype,
      });

    if (error) throw new BadRequestException(error.message);

    // Step 4: Get public URL
    const { data } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    // Step 5: Update entity in database
    switch (type) {
      case 'user':
        return this.userService.update(id, { imageURL: publicUrl });
      case 'category':
        return this.categoryService.update(id, { imageURL: publicUrl });
      case 'item':
        return this.itemService.update(id, { imageURL: publicUrl });
    }
  }

  private extractFilePathFromUrl(url: string): string | null {
    const match = url.match(/\/object\/public\/app-images\/(.+)$/);
    return match ? match[1] : null;
  }

  async ensureSupabaseActive(): Promise<void> {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .list('', {
        limit: 1,
        offset: 0,
      });

    if (error) {
      console.error(
        `[Supabase Cron] Failed to list bucket: ${this.bucketName}`,
        error.message,
      );
    } else {
      console.log(
        `[Supabase Cron] Successfully listed ${data?.length} item(s) in '${this.bucketName}'. Supabase is active.`,
      );
    }
  }
}
