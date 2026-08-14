import {
  answersMatch,
  answersMatchLoose,
  answersMatchTyped,
  gradeTypedTokens,
  normalizeAnswer,
} from '../components/Study/gradeAnswer';
import { decodeCloze } from '../components/Study/cipher';

function typeCheck(guess, expected) {
  return answersMatchTyped(guess, decodeCloze(expected));
}

describe('answersMatchLoose', () => {
  test('ignores case and punctuation', () => {
    expect(answersMatchLoose('Paris!', 'paris')).toBe(true);
    expect(answersMatchLoose('PARIS', 'Paris')).toBe(true);
    expect(answersMatchLoose('New York.', 'new york')).toBe(true);
  });

  test('ignores extra spaces and remaining spaces', () => {
    expect(answersMatchLoose('  New   York  ', 'New York')).toBe(true);
    expect(answersMatchLoose('NewYork', 'New York')).toBe(true);
  });

  test('rejects empty guess or expected', () => {
    expect(answersMatchLoose('', 'Paris')).toBe(false);
    expect(answersMatchLoose('Paris', '')).toBe(false);
    expect(answersMatchLoose('   ', 'Paris')).toBe(false);
  });

  test('rejects a different answer', () => {
    expect(answersMatchLoose('Lyon', 'Paris')).toBe(false);
  });

  test('does not accept fuzzy typos', () => {
    expect(answersMatchLoose('Pariz', 'Paris')).toBe(false);
    expect(answersMatch('Pariz', 'Paris')).toBe(true);
  });

  test('handles latex-ish answers via normalizeAnswer', () => {
    expect(normalizeAnswer('\\frac{1}{2}')).toBe(normalizeAnswer('1/2'));
    expect(answersMatchLoose('\\frac{1}{2}', '1/2')).toBe(true);
    expect(answersMatchLoose('$x^2$', 'x2')).toBe(true);
  });
});

describe('Type-style checking', () => {
  test('accepts slash, pipe, and semicolon alternatives', () => {
    expect(answersMatchTyped('Paris', 'Paris / Paris, France')).toBe(true);
    expect(answersMatchTyped('Paris, France', 'Paris / Paris, France')).toBe(true);
    expect(answersMatchTyped('Paris', 'Paris | Lutetia')).toBe(true);
    expect(answersMatchTyped('Lutetia', 'Paris; Lutetia')).toBe(true);
    expect(answersMatchTyped('Lyon', 'Paris / Paris, France')).toBe(false);
  });

  test('decodes Anki cloze markup on the expected answer', () => {
    expect(typeCheck('Paris', '{{c1::Paris}}')).toBe(true);
    expect(typeCheck('Paris', '{{c1::Paris::city}}')).toBe(true);
    expect(typeCheck('Lyon', '{{c1::Paris}}')).toBe(false);
  });

  test('still ignores case and punctuation after cloze decode', () => {
    expect(typeCheck('paris!', '{{c1::Paris}}')).toBe(true);
  });
});

describe('gradeTypedTokens', () => {
  test('marks matching words green and misses with the expected word', () => {
    const tokens = gradeTypedTokens(
      'The mitochondria is the engine',
      'The mitochondria is the powerhouse'
    );
    expect(tokens.map((token) => token.correct)).toEqual([true, true, true, true, false]);
    expect(tokens[4]).toEqual({ guess: 'engine', expected: 'powerhouse', correct: false });
  });

  test('marks the whole guess correct when the typed answer matches', () => {
    expect(gradeTypedTokens('Paris!', 'paris').every((token) => token.correct)).toBe(true);
    expect(gradeTypedTokens('Paris', 'Paris / Paris, France').every((token) => token.correct)).toBe(true);
  });

  test('shows missing expected words and extra guessed words', () => {
    const short = gradeTypedTokens('The mitochondria', 'The mitochondria is the powerhouse');
    expect(short.slice(0, 2).every((token) => token.correct)).toBe(true);
    expect(short[2]).toEqual({ guess: '', expected: 'is', correct: false });
    const extra = gradeTypedTokens('Paris France', 'Paris');
    expect(extra[0].correct).toBe(true);
    expect(extra[1]).toEqual({ guess: 'France', expected: '', correct: false });
  });
});
