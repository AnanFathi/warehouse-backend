import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ColorsService } from './color.service';
import { Color } from './schemas/color.schema';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('colors')
export class ColorsController {
  constructor(private readonly colorsService: ColorsService) {}

  @Get()
  findAll(@Query('search') search?: string): Promise<Color[]> {
    return this.colorsService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Color> {
    return this.colorsService.findOne(id);
  }

  @Post()
  create(@Body() data: { name: string; color: string }): Promise<Color> {
    return this.colorsService.create(data);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: { name?: string; color?: string },
  ): Promise<Color> {
    return this.colorsService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<{}> {
    return this.colorsService.remove(id);
  }
}
