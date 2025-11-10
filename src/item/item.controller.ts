import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ItemService } from './item.service';
import { Item } from './schemas/item.schema';
import { IPaginated } from 'src/types/shared.model';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('items')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  create(@Body() data: any): Promise<Item> {
    return this.itemService.create(data);
  }

  @Get()
  findAll(
    @Query('id') id?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('itemsPerPage') itemsPerPage?: string,
    @Query('name') name?: string,
    @Query() query?: any,
  ): Promise<IPaginated> {
    const attributes: Record<string, string> = {};
    for (const key of Object.keys(query)) {
      const match = key.match(/^attribute\[(.+)\]$/);
      if (match) {
        const attrName = match[1];
        attributes[attrName] = query[key];
      }
    }

    return this.itemService.findWithFilters({
      id,
      category,
      status,
      page,
      itemsPerPage,
      attributes,
      name,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Item> {
    return this.itemService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any): Promise<Item> {
    return this.itemService.update(id, data);
  }

  @Patch(':id/attribute')
  updateAttribute(
    @Param('id') id: string,
    @Body() body: { attributeId: string; value: string },
  ): Promise<Item> {
    return this.itemService.updateAttribute(id, body.attributeId, body.value);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<{}> {
    return this.itemService.remove(id);
  }
}
