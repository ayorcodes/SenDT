import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RatesService } from './rates.service.js';
import { Public } from '../auth/decorators/public.decorator.js';

@ApiTags('rates')
@Controller('rates')
export class RatesController {
  constructor(private readonly ratesService: RatesService) {}

  @Public()
  @Get()
  getAll() {
    return this.ratesService.getAll();
  }
}
