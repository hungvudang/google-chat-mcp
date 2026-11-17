import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as ChatException from '../../../src/domain/chat/exceptions.ts';

const { Invalid } = ChatException;

describe('Invalid', () => {
  it('lists spaces to choose from', () => {
    const message = Invalid.missingSpace(['alerts', 'dev']).message;
    assert.ok(message.includes('alerts') && message.includes('dev'));
  });
});
