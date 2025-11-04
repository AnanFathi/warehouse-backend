import {
  Controller,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post(':type/:id')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('type') type: 'item' | 'category',
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');

    return this.uploadService.uploadEntityImage(type, id, file);
  }
}
