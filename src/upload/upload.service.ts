import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CategoryService } from '../category/category.service';
import { ItemService } from '../item/item.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  private supabase: SupabaseClient;

  constructor(
    private readonly categoryService: CategoryService,
    private readonly itemService: ItemService,
    private readonly configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or KEY is not set in env');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async uploadEntityImage(
    type: 'category' | 'item',
    id: string,
    file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file provided');

    // Step 0: Ensure entity exists
    let entity: any;
    switch (type) {
      case 'category':
        entity = await this.categoryService.findOne(id);
        if (!entity) throw new NotFoundException('Category not found');
        break;
      case 'item':
        entity = await this.itemService.findOne(id);
        if (!entity) throw new NotFoundException('Item not found');
        break;
      default:
        throw new BadRequestException(`Invalid type: ${type}`);
    }

    // ✅ Step 1: Delete old image if exists (fail silently)
    if (entity.imageURL) {
      const oldPath = this.extractFilePathFromUrl(entity.imageURL);
      if (oldPath) {
        this.supabase.storage
          .from('app-images')
          .remove([oldPath])
          .catch(() => {});
      }
    }

    // Step 2: Build path in bucket
    const filePath = `${type}/${id}-${Date.now()}-${file.originalname}`;

    // Step 3: Upload to Supabase
    const { data: uploadData, error } = await this.supabase.storage
      .from('app-images')
      .upload(filePath, file.buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.mimetype,
      });

    if (error) throw new BadRequestException(error.message);

    // Step 4: Get public URL
    const { data } = this.supabase.storage
      .from('app-images')
      .getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    // Step 5: Update entity in database
    switch (type) {
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
}
