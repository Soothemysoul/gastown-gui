import { EventEmitter } from 'node:events';

export class EventBus {
  constructor({ broadcast } = {}) {
    this._emitter = new EventEmitter();
    this._broadcast = broadcast ?? null;
  }

  emit(type, data) {
    const event = { type, data };
    this._emitter.emit(type, data);
    this._emitter.emit('*', event);
    if (this._broadcast) {
      this._broadcast(event);
    }
  }

  on(type, listener) {
    this._emitter.on(type, listener);
    return () => this._emitter.off(type, listener);
  }

  onAny(listener) {
    return this.on('*', listener);
  }
}

