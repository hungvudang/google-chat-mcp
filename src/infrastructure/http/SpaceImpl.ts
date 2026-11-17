import type { Logger } from 'pino';
import * as z from 'zod';
import * as ChatException from '../../domain/chat/exceptions.ts';
import type { Post, PostVisitor } from '../../domain/chat/post.ts';
import type { Delivery, Space } from '../../domain/chat/space.ts';
import type { Thread } from '../../domain/chat/thread.ts';
import { byteLength } from '../../shared/strings.ts';
import type { Payload } from '../chat-sdk/PayloadImpl.ts';
import type { Webhook } from './webhook.ts';

/** Largest request Google Chat accepts, in UTF-8 bytes. */
const MAX_BYTES = 32_000;

/** Asks Google Chat to reply in the thread, or start it if it does not exist yet. */
const REPLY_OR_START_THREAD = 'REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD';

/** HTTP statuses that mean the webhook itself no longer works. */
const REVOKED = new Set([401, 403, 404]);

/** Body of a successful reply. Webhooks only fill in `name` and `thread.name`. */
const Created = z.object({
  name: z.string(),
  thread: z.object({ name: z.string() }).optional(),
});

/** Body of a failed reply, a `google.rpc.Status`. */
const Status = z.object({
  error: z.object({ message: z.string(), status: z.string().optional() }),
});

/**
 * {@link Space} that sends through a Google Chat incoming webhook.
 *
 * Adapter pattern: this class owns everything HTTP, from the size limit and the thread
 * parameter to status codes, and turns failures into chat exceptions. The domain and MCP
 * layers never see HTTP. Status codes are logged, not shown to users.
 */
export class SpaceImpl implements Space {
  readonly #webhook: Webhook;
  readonly #payloads: PostVisitor<Payload>;
  readonly #log: Logger;
  readonly #timeoutMs: number;

  private constructor(webhook: Webhook, payloads: PostVisitor<Payload>, log: Logger, timeoutMs: number) {
    this.#webhook = webhook;
    this.#payloads = payloads;
    this.#log = log;
    this.#timeoutMs = timeoutMs;
  }

  /**
   * Connects to a space through its webhook.
   *
   * @param webhook - Webhook of the space.
   * @param payloads - Builds the request body of each post.
   * @param log - Logger. It never receives the webhook URL.
   * @param timeoutMs - How long to wait for Google Chat, in milliseconds.
   * @returns The connected space.
   */
  static of(webhook: Webhook, payloads: PostVisitor<Payload>, log: Logger, timeoutMs: number): SpaceImpl {
    return new SpaceImpl(webhook, payloads, log.child({ spaceId: webhook.spaceId }), timeoutMs);
  }

  /** {@inheritDoc Space.send} */
  async send(post: Post, thread?: Thread): Promise<Delivery> {
    const { url, body } = this.#request(post, thread);
    if (byteLength(body) > MAX_BYTES) {
      throw ChatException.Invalid.tooLong();
    }
    this.#log.debug('space.sending');
    const response = await this.#transmit(url, body);
    const reply: unknown = await response.json().catch(() => undefined);
    if (!response.ok) {
      throw this.#refusal(response.status, reply);
    }
    return this.#delivery(response.status, reply);
  }

  /** The thread lives in both the query and the body, so both are set in one place. */
  #request(post: Post, thread: Thread | undefined): { url: URL; body: string } {
    const url = this.#webhook.url;
    const payload = post.accept(this.#payloads);
    if (thread !== undefined) {
      url.searchParams.set('messageReplyOption', REPLY_OR_START_THREAD);
      payload.thread = { threadKey: thread.key };
    }
    return { url, body: JSON.stringify(payload) };
  }

  async #transmit(url: URL, body: string): Promise<Response> {
    const signal = AbortSignal.timeout(this.#timeoutMs);
    try {
      return await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body,
        signal,
      });
    } catch (exception) {
      if (signal.aborted) {
        this.#log.warn({ timeoutMs: this.#timeoutMs }, 'space.timeout');
        throw ChatException.Undelivered.slow(this.#timeoutMs);
      }
      this.#log.warn({ err: exception }, 'space.unreachable');
      throw ChatException.Undelivered.unreachable();
    }
  }

  /** An unexpected success body still means the post went through, so it is not an error. */
  #delivery(status: number, reply: unknown): Delivery {
    const created = Created.safeParse(reply);
    if (!created.success) {
      this.#log.warn({ status }, 'space.sent-without-name');
      return { name: undefined, thread: undefined };
    }
    const delivery: Delivery = { name: created.data.name, thread: created.data.thread?.name };
    this.#log.info(delivery, 'space.sent');
    return delivery;
  }

  #refusal(status: number, reply: unknown): ChatException.Undelivered {
    const google = Status.safeParse(reply);
    this.#log.warn({ status, code: google.data?.error.status, detail: google.data?.error.message }, 'space.refused');
    if (status === 429) {
      return ChatException.Undelivered.busy();
    }
    if (status >= 500) {
      return ChatException.Undelivered.down();
    }
    if (REVOKED.has(status)) {
      return ChatException.Undelivered.revoked();
    }
    if (!google.success) {
      return ChatException.Undelivered.unexplained();
    }
    return ChatException.Undelivered.refused(google.data.error.message);
  }
}
