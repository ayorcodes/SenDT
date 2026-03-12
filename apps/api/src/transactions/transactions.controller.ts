import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import { TransactionsService } from './transactions.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('transactions')
@ApiBearerAuth()
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  getAll(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: TransactionType,
  ) {
    return this.transactionsService.getAll(user.id, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      type,
    });
  }

  @Get(':id')
  getOne(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.transactionsService.getOne(user.id, id);
  }
}
