import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { User } from '../../generated/prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { AddPathItemDto } from './dto/add-path-item.dto';
import { CreatePathDto } from './dto/create-path.dto';
import { ReorderPathItemsDto } from './dto/reorder-path-items.dto';
import { PathsService } from './paths.service';

@UseGuards(FirebaseAuthGuard)
@Controller('paths')
export class PathsController {
  constructor(private readonly paths: PathsService) {}

  @Get()
  listPublic() {
    return this.paths.listPublic();
  }

  // 'mine', 'tree', 'search', 'progress', and 'daily' must stay registered
  // before the ':id' route below — Nest/Express matches literal segments in
  // declaration order, and ':id' would otherwise swallow them.
  @Get('mine')
  listMine(@CurrentUser() user: User) {
    return this.paths.listMine(user.id);
  }

  @Get('tree')
  getTree() {
    return this.paths.getTree();
  }

  @Get('search')
  search(@Query('subjectId') subjectId: string, @Query('q') q: string) {
    if (!subjectId) {
      throw new BadRequestException('subjectId is required');
    }
    return this.paths.search(subjectId, q ?? '');
  }

  @Get('progress')
  getProgress(@CurrentUser() user: User) {
    return this.paths.getProgress(user.id);
  }

  @Get('daily')
  getDailyStatus(@CurrentUser() user: User) {
    return this.paths.getDailyStatus(user.id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreatePathDto) {
    return this.paths.createDraft(user.id, dto.title, dto.description);
  }

  @Get(':id')
  getDetail(@Param('id') id: string, @CurrentUser() user: User) {
    return this.paths.getDetail(id, user.id);
  }

  @Get(':id/resolved')
  resolve(@Param('id') id: string, @CurrentUser() user: User) {
    return this.paths.resolve(id, user.id);
  }

  @Post(':id/items')
  addItem(@Param('id') id: string, @CurrentUser() user: User, @Body() dto: AddPathItemDto) {
    return this.paths.addItem(id, user.id, dto);
  }

  @Delete(':id/items/:itemId')
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string, @CurrentUser() user: User) {
    return this.paths.removeItem(id, user.id, itemId);
  }

  @Patch(':id/items/reorder')
  reorder(@Param('id') id: string, @CurrentUser() user: User, @Body() dto: ReorderPathItemsDto) {
    return this.paths.reorderItems(id, user.id, dto.itemIds);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string, @CurrentUser() user: User) {
    return this.paths.publish(id, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.paths.deletePath(id, user.id);
  }
}
