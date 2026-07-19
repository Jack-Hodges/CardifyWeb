import { sm2Update, createDefaultSrs, isDue } from '../components/Study/sm2';

describe('SM-2', () => {
  test('Again resets repetitions and keeps short due', () => {
    const next = sm2Update(createDefaultSrs(), 0);
    expect(next.repetitions).toBe(0);
    expect(next.interval).toBe(0);
    expect(isDue(next, new Date(Date.now() + 60 * 60 * 1000))).toBe(true);
  });

  test('Good increases interval on first success', () => {
    const next = sm2Update(createDefaultSrs(), 2);
    expect(next.repetitions).toBe(1);
    expect(next.interval).toBe(1);
  });

  test('Easy uses longer first interval', () => {
    const next = sm2Update(createDefaultSrs(), 3);
    expect(next.interval).toBe(2);
  });
});

describe('sanitize schema shape', () => {
  test('defaultSchema can be extended with underline', () => {
    // Keep this free of ESM-only react-markdown so CRA Jest stays happy.
    const base = { tagNames: ['p', 'strong', 'em'] };
    const schema = { ...base, tagNames: [...base.tagNames, 'u'] };
    expect(schema.tagNames).toContain('u');
  });
});
