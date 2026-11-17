import { blank } from '../../shared/strings.ts';
import * as ChatException from './exceptions.ts';

/**
 * A thread that groups related posts. Posts with the same key end up in the same thread, and
 * the first one starts it.
 */
export class Thread {
  readonly key: string;

  private constructor(key: string) {
    this.key = key;
  }

  /**
   * Creates a thread from its key.
   *
   * @param key - Any name the caller picks for the thread.
   * @returns The thread.
   * @throws {@link ChatException.Invalid} When `key` is blank.
   */
  static of(key: string): Thread {
    if (blank(key)) {
      throw ChatException.Invalid.emptyThreadKey();
    }
    return new Thread(key);
  }
}
