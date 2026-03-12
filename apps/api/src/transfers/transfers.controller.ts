import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TransfersService } from './transfers.service.js';
import { TransferDto, ResolveAccountDto } from './dto/transfer.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';

@ApiTags('transfers')
@ApiBearerAuth()
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Public()
  @Get('banks')
  getBanks() {
    return this.transfersService.getBanks();
  }

  @Post('resolve')
  resolveAccount(@Body() dto: ResolveAccountDto) {
    return this.transfersService.resolveAccount(dto);
  }

  @Post()
  transfer(
    @CurrentUser() user: { id: string },
    @Body() dto: TransferDto,
  ) {
    return this.transfersService.transfer(user.id, dto);
  }
}
