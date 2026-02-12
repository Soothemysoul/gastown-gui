import { describe, it, expect } from 'vitest';

import { EventBus } from '../../server/infrastructure/EventBus.js';

describe('EventBus', () => {
  it('broadcasts emitted events when configured', () => {
    const seen = [];
    const bus = new EventBus({ broadcast: (event) => seen.push(event) });

    bus.emit('hello', { a: 1 });
    expect(seen).toEqual([{ type: 'hello', data: { a: 1 } }]);
  });

  it('supports typed subscriptions', () => {
    const seen = [];
    const bus = new EventBus();
    const unsubscribe = bus.on('ping', (data) => seen.push(data));

    bus.emit('ping', { x: 1 });
    bus.emit('pong', { x: 2 });
    expect(seen).toEqual([{ x: 1 }]);

    unsubscribe();
    bus.emit('ping', { x: 3 });
    expect(seen).toEqual([{ x: 1 }]);
  });

  it('supports onAny subscriptions', () => {
    const seen = [];
    const bus = new EventBus();
    const unsubscribe = bus.onAny((event) => seen.push(event.type));

    bus.emit('a', {});
    bus.emit('b', {});
    expect(seen).toEqual(['a', 'b']);

    unsubscribe();
    bus.emit('c', {});
    expect(seen).toEqual(['a', 'b']);
  });
});

