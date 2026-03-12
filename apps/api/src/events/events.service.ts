import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

interface EventMessage {
  userId: string;
  type: string;
  data: Record<string, unknown>;
}

@Injectable()
export class EventsService {
  private readonly subject$ = new Subject<EventMessage>();

  emit(userId: string, payload: { type: string; data: Record<string, unknown> }) {
    this.subject$.next({ userId, ...payload });
  }

  stream(userId: string) {
    return this.subject$.pipe(
      filter((e) => e.userId === userId),
      map((e) => ({ type: e.type, data: e.data })),
    );
  }
}
