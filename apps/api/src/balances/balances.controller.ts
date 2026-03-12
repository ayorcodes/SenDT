import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BalancesService } from './balances.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('balances')
@ApiBearerAuth()
@Controller('balances')
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @Get('fiat')
  getFiat(@CurrentUser() user: { id: string }) {
    return this.balancesService.getFiat(user.id);
  }

  @Get('crypto')
  getCrypto(@CurrentUser() user: { id: string }) {
    return this.balancesService.getCrypto(user.id);
  }
}
