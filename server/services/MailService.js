import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';

function parseJsonOrNull(text) {
  try { return JSON.parse(text); } catch { return null; }
}

export class MailService {
  constructor({ gtGateway, cache, emit, gtRoot } = {}) {
    if (!gtGateway) throw new Error('MailService requires gtGateway');
    if (!gtRoot) throw new Error('MailService requires gtRoot');

    this._gt = gtGateway;
    this._cache = cache ?? null;
    this._emit = emit ?? null;
    this._gtRoot = gtRoot;
    this._feedCache = { mtimeMs: 0, size: 0, events: null };
  }

  async list({ refresh = false, ttlMs = 15000 } = {}) {
    const key = 'mail';
    if (!refresh && this._cache?.get) {
      const cached = this._cache.get(key);
      if (cached !== undefined) return cached;
    }

    const result = await this._gt.exec(['mail', 'inbox', '--json'], { timeoutMs: 30000 });
    if (!result.ok) throw new Error(result.error || 'Failed to get mail');
    const data = parseJsonOrNull((result.stdout || '').trim()) || [];
    this._cache?.set?.(key, data, ttlMs);
    return data;
  }

  async send({ to, subject, message, priority } = {}) {
    const priorityMap = { urgent: '0', high: '1', normal: '2', low: '3', backlog: '4' };
    const args = ['mail', 'send', to, '-s', subject, '-m', message];
    if (priority) args.push('--priority', priorityMap[priority] || String(priority));

    const result = await this._gt.exec(args, { timeoutMs: 30000 });
    if (!result.ok) throw new Error(result.error || 'Failed to send mail');
    return { ok: true };
  }

  async getAll({ page = 1, limit = 50 } = {}) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(200, Math.max(1, limit));
    const offset = (safePage - 1) * safeLimit;

    const feedPath = path.join(this._gtRoot, '.events.jsonl');
    try {
      await fsPromises.access(feedPath);
    } catch {
      this._feedCache.events = null;
      return { items: [], total: 0, page: safePage, limit: safeLimit, hasMore: false };
    }

    const mailEvents = await this._loadFeedEvents(feedPath);
    const total = mailEvents.length;
    const paginatedItems = mailEvents.slice(offset, offset + safeLimit);

    return {
      items: paginatedItems,
      total,
      page: safePage,
      limit: safeLimit,
      hasMore: offset + safeLimit < total,
    };
  }

  async get(id) {
    const result = await this._gt.exec(['mail', 'read', id, '--json'], { timeoutMs: 30000 });
    if (!result.ok) throw new Error('Mail not found');
    const mail = parseJsonOrNull((result.stdout || '').trim());
    return mail || { id, error: 'Not found' };
  }

  async markRead(id) {
    const result = await this._gt.exec(['mail', 'mark-read', id], { timeoutMs: 30000 });
    if (!result.ok) throw new Error(result.error || 'Failed to mark as read');
    return { ok: true, id, read: true };
  }

  async markUnread(id) {
    const result = await this._gt.exec(['mail', 'mark-unread', id], { timeoutMs: 30000 });
    if (!result.ok) throw new Error(result.error || 'Failed to mark as unread');
    return { ok: true, id, read: false };
  }

  async _loadFeedEvents(feedPath) {
    const stats = await fsPromises.stat(feedPath);
    if (this._feedCache.events &&
        this._feedCache.mtimeMs === stats.mtimeMs &&
        this._feedCache.size === stats.size) {
      return this._feedCache.events;
    }

    const fileStream = fs.createReadStream(feedPath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    const mailEvents = [];
    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        if (event.type === 'mail') {
          mailEvents.push({
            id: `feed-${event.ts}-${mailEvents.length}`,
            from: event.actor || 'unknown',
            to: event.payload?.to || 'unknown',
            subject: event.payload?.subject || event.summary || '(No Subject)',
            body: event.payload?.body || event.payload?.message || '',
            timestamp: event.ts,
            read: true,
            priority: event.payload?.priority || 'normal',
            feedEvent: true,
          });
        }
      } catch {
        // Skip malformed lines
      }
    }

    mailEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    this._feedCache = { events: mailEvents, mtimeMs: stats.mtimeMs, size: stats.size };
    return mailEvents;
  }
}
