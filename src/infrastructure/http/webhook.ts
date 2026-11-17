import * as ChatException from '../../domain/chat/exceptions.ts';
import { blank } from '../../shared/strings.ts';

const HOST = 'chat.googleapis.com';
const SPACE_PATH = /^\/v1\/spaces\/([^/]+)\/messages$/;

/**
 * The incoming webhook of one Google Chat space.
 *
 * Its URL carries a key and token, so anyone holding it can post. The URL stays in a private
 * field, which `JSON.stringify` and loggers never print. Only the space id is public.
 */
export class Webhook {
  /** Google Chat id of the space, safe to log. */
  readonly spaceId: string;
  readonly #url: URL;

  private constructor(url: URL, spaceId: string) {
    this.#url = url;
    this.spaceId = spaceId;
  }

  /**
   * Reads a webhook URL copied from Google Chat.
   *
   * @param raw - URL like `https://chat.googleapis.com/v1/spaces/<SPACE>/messages?key=...&token=...`.
   * @param name - Name of the space it is configured for, used in the exception.
   * @returns The webhook.
   * @throws {@link ChatException.Invalid} When the URL is not a complete Google Chat webhook.
   *   The message never repeats the URL.
   */
  static parse(raw: string, name: string): Webhook {
    const url = URL.parse(raw);
    const match = SPACE_PATH.exec(url?.pathname ?? '');
    if (url === null || url.protocol !== 'https:' || url.host !== HOST || match === null) {
      throw ChatException.Invalid.notWebhook(name);
    }
    if (blank(url.searchParams.get('key')) || blank(url.searchParams.get('token'))) {
      throw ChatException.Invalid.incompleteWebhook(name);
    }
    return new Webhook(url, match[1]);
  }

  /**
   * A fresh copy of the webhook URL, safe to change.
   *
   * @returns The URL with its key and token. Never log it.
   */
  get url(): URL {
    return new URL(this.#url);
  }
}
