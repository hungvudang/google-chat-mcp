import { blank, presence } from '../../shared/strings.ts';
import * as ChatException from './exceptions.ts';
import type { Post, PostVisitor } from './post.ts';

/** A labelled detail, such as `Order ID: 1794473377817017`. */
export interface Field {
  readonly label: string;
  readonly value: string;
}

/** A button that opens a web page. */
export interface Link {
  readonly label: string;
  readonly url: string;
}

/** What a report is made of. */
export interface ReportContent {
  readonly title: string;
  readonly subtitle?: string;
  readonly text?: string;
  readonly fields?: readonly Field[];
  readonly links?: readonly Link[];
}

/**
 * A structured post about something that happened: a title, a few plain sentences, labelled
 * details and links. Google Chat shows it as a card.
 */
export class Report implements Post {
  readonly title: string;
  readonly subtitle: string | undefined;
  readonly text: string | undefined;
  readonly fields: readonly Field[];
  readonly links: readonly Link[];

  private constructor(content: Required<Pick<ReportContent, 'fields' | 'links'>> & ReportContent) {
    this.title = content.title;
    this.subtitle = content.subtitle;
    this.text = content.text;
    this.fields = content.fields;
    this.links = content.links;
  }

  /**
   * Creates a report.
   *
   * @param content - Title, optional subtitle and text, details and links.
   * @returns The report.
   * @throws {@link ChatException.Invalid} When the title is blank, there is neither text nor a
   *   detail, a detail or link is incomplete, or a link is not a web address.
   */
  static of(content: ReportContent): Report {
    const fields = Object.freeze([...(content.fields ?? [])]);
    const links = Object.freeze([...(content.links ?? [])]);
    if (blank(content.title)) {
      throw ChatException.Invalid.emptyTitle();
    }
    if (blank(content.text) && fields.length === 0) {
      throw ChatException.Invalid.emptyReport();
    }
    if (fields.some((field) => blank(field.label) || blank(field.value))) {
      throw ChatException.Invalid.emptyField();
    }
    if (links.some((link) => blank(link.label) || !webAddress(link.url))) {
      throw ChatException.Invalid.badLink();
    }
    return new Report({ ...content, text: presence(content.text), fields, links });
  }

  /** {@inheritDoc Post.accept} */
  accept<T>(visitor: PostVisitor<T>): T {
    return visitor.report(this);
  }
}

function webAddress(url: string): boolean {
  const parsed = URL.parse(url);
  return parsed !== null && (parsed.protocol === 'https:' || parsed.protocol === 'http:');
}
