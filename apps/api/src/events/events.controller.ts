import { Controller, Get, Query, Sse, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Observable, map } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { EventsService } from './events.service.js';
import { Public } from '../auth/decorators/public.decorator.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly jwt: JwtService,
  ) {}

  @Public()
  @Sse()
  @Get()
  stream(@Query('token') token: string): Observable<MessageEvent> {
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException();
    }

    return this.eventsService.stream(payload.sub).pipe(
      map((event) => ({
        data: JSON.stringify(event),
      } as MessageEvent)),
    );
  }
}
