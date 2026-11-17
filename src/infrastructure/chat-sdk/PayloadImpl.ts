import { cardToGoogleCard } from '@chat-adapter/gchat';
import { Actions, Card, type CardChild, CardText, Field, Fields, LinkButton } from 'chat';
import escape from 'escape-html';
import type { Message } from '../../domain/chat/message.ts';
import type { PostVisitor } from '../../domain/chat/post.ts';
import type { Report } from '../../domain/chat/report.ts';
import { replace } from '../../shared/strings.ts';

/** Google Chat request body. */
export type Payload = Record<string, unknown>;

/**
 * Builds the Google Chat request body for each kind of post.
 *
 * A report becomes a card through the Chat SDK card builders.
 */
export class PayloadImpl implements PostVisitor<Payload> {
  private constructor() {}

  static create(): PayloadImpl {
    return new PayloadImpl();
  }

  message(message: Message): Payload {
    return { text: message.text };
  }

  report(report: Report): Payload {
    const children: CardChild[] = [];
    if (report.text !== undefined) {
      children.push(CardText(plain(report.text)));
    }
    if (report.fields.length > 0) {
      children.push(Fields(report.fields.map((field) => Field({ label: plain(field.label), value: plain(field.value) }))));
    }
    if (report.links.length > 0) {
      children.push(Actions(report.links.map((link) => LinkButton({ label: link.label, url: link.url }))));
    }
    const card = Card({ title: report.title, subtitle: report.subtitle, children });
    return { cardsV2: [cardToGoogleCard(card, { cardId: 'report' })] };
  }
}

/** Google Chat reads card text, labels and values as HTML, so caller text is escaped to keep it intact. */
function plain(text: string): string {
  return replace(escape(text), '\n', '<br>');
}
