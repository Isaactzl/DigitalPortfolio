import { describe, expect, it } from 'vitest';
import { jsonForScript } from './json-script';

describe('jsonForScript', () => {
  it('cannot close the script tag it sits in', () => {
    const out = jsonForScript({ text: '</script><script>alert(1)</script>' });
    expect(out).not.toMatch(/<\/?script/i);
    expect(out).not.toContain('<');
  });

  it('still parses back to the same value', () => {
    const value = { text: 'a < b && c > d', list: [1, '<!--'] };
    expect(JSON.parse(jsonForScript(value))).toEqual(value);
  });
});
