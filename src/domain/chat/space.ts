import type { Post } from './post.ts';
import type { Thread } from './thread.ts';

/**
 * What Google Chat reports back for a sent post.
 */
export interface Delivery {
  /** Message name, `spaces/<SPACE>/messages/<ID>`, when Google Chat reports it. */
  readonly name: string | undefined;
  /** Thread name, `spaces/<SPACE>/threads/<ID>`, when Google Chat reports it. */
  readonly thread: string | undefined;
}

/**
 * One Google Chat space the server can send to.
 *
 * The domain only knows this port. How a post actually travels lives in the infrastructure layer.
 */
export interface Space {
  /**
   * Sends a post to the space.
   *
   * @param post - Message or report to send.
   * @param thread - Thread to post in.
   * @returns What Google Chat reported back.
   * @throws {@link ChatException.Invalid} When the post is too large for Google Chat.
   * @throws {@link ChatException.Undelivered} When the post did not reach the space.
   */
  send(post: Post, thread?: Thread): Promise<Delivery>;
}
