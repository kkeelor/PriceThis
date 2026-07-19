import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resolveScanTarget } from './resolve-scan.js';

describe('resolveScanTarget', () => {
  it('uses Gemini when no model is requested', () => {
    const target = resolveScanTarget();
    assert.equal(target.provider, 'gemini');
    assert.equal(target.preset, 'gemini');
  });

  it('accepts the Gemini preset', () => {
    assert.equal(resolveScanTarget('gemini').provider, 'gemini');
  });

  it('rejects all other model selections', () => {
    assert.throws(() => resolveScanTarget('claude-opus'), /Only the Gemini model/);
  });
});
