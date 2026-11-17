import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as ChatException from '../../../src/domain/chat/exceptions.ts';
import { Report } from '../../../src/domain/chat/report.ts';

const FIELD = { label: 'Symbol', value: 'LEC' };

describe('Report', () => {
  describe('of', () => {
    it('needs title', () => {
      assert.throws(() => Report.of({ title: ' ', fields: [FIELD] }), ChatException.Invalid);
    });

    it('needs text or field', () => {
      assert.throws(() => Report.of({ title: 'Order failed' }), ChatException.Invalid);
    });

    it('accepts text only', () => {
      assert.doesNotThrow(() => Report.of({ title: 'Order failed', text: 'VNSC returned no result.' }));
    });

    it('drops blank text', () => {
      assert.equal(Report.of({ title: 'T', text: '  ', fields: [FIELD] }).text, undefined);
    });

    it('needs complete fields', () => {
      assert.throws(() => Report.of({ title: 'T', fields: [{ label: 'Symbol', value: ' ' }] }), ChatException.Invalid);
    });

    it('needs web links', () => {
      assert.throws(() => Report.of({ title: 'T', fields: [FIELD], links: [{ label: 'Open', url: 'ftp://x' }] }), ChatException.Invalid);
    });
  });
});
