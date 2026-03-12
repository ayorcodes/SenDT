import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Asset } from '@prisma/client';
import { WalletsService } from './wallets.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('wallets')
@ApiBearerAuth()
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  getAll(@CurrentUser() user: { id: string }) {
    return this.walletsService.getAll(user.id);
  }

  // POST /wallets/:asset — get-or-create the chain wallet for this asset
  // ETH and USDT resolve to the same ETHEREUM chain wallet (same address)
  @Post(':asset')
  getOrCreate(
    @CurrentUser() user: { id: string },
    @Param('asset') asset: Asset,
  ) {
    return this.walletsService.getOrCreateByAsset(user.id, asset);
  }

  @Get(':asset')
  getOne(
    @CurrentUser() user: { id: string },
    @Param('asset') asset: Asset,
  ) {
    return this.walletsService.getByAsset(user.id, asset);
  }
}
