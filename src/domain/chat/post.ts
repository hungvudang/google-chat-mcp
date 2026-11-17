import type { Message } from './message.ts';
import type { Report } from './report.ts';

/**
 * Something that can be sent to a space: a plain message or a report.
 *
 * Visitor pattern: the infrastructure turns each kind into its own request without checking
 * types, and adding a new kind makes the compiler point at every place that must handle it.
 */
export interface Post {
  /** Hands this post to the matching method of `visitor`. */
  accept<T>(visitor: PostVisitor<T>): T;
}

/**
 * One method per kind of {@link Post}.
 */
export interface PostVisitor<T> {
  message(message: Message): T;
  report(report: Report): T;
}
