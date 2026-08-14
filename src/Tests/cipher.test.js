import { answersMatchLoose, autoCloze, cipherFromCard, gradeCloze, renderCloze } from '../components/Study/cipher';
import { answersMatchLoose as gradeAnswersMatchLoose, playableCard } from '../components/Study/gradeAnswer';

function blankCount(side) {
  return (side?.segments || []).filter((segment) => segment.type === 'blank').length;
}

function visibleWordCount(side) {
  return (side?.segments || [])
    .filter((segment) => segment.type === 'text')
    .map((segment) => segment.value)
    .join('')
    .split(/\s+/)
    .filter((token) => /[A-Za-z0-9]/.test(token)).length;
}

describe('renderCloze', () => {
  test('turns Anki markup into inline blank segments', () => {
    const result = renderCloze('The {{c1::mitochondria}} is the {{c2::powerhouse}} of the cell.');
    expect(result.answers).toEqual(['mitochondria', 'powerhouse']);
    expect(result.prompt).toBe('The _____ is the _____ of the cell.');
    expect(result.segments).toEqual([
      { type: 'text', value: 'The ' },
      { type: 'blank', answer: 'mitochondria' },
      { type: 'text', value: ' is the ' },
      { type: 'blank', answer: 'powerhouse' },
      { type: 'text', value: ' of the cell.' },
    ]);
  });

  test('strips cloze hints', () => {
    const result = renderCloze('{{c1::Paris::city}} is in France');
    expect(result.answers).toEqual(['Paris']);
    expect(result.segments[0]).toEqual({ type: 'blank', answer: 'Paris' });
  });
});

describe('gradeCloze', () => {
  test('grades one guess per blank', () => {
    expect(gradeCloze(['mitochondria', 'powerhouse'], ['mitochondria', 'powerhouse'])).toBe(true);
    expect(gradeCloze(['mitochondria', 'engine'], ['mitochondria', 'powerhouse'])).toBe(false);
    expect(gradeCloze(['', 'powerhouse'], ['mitochondria', 'powerhouse'])).toBe(false);
  });

  test('still accepts comma-separated guesses', () => {
    expect(gradeCloze('mitochondria, powerhouse', ['mitochondria', 'powerhouse'])).toBe(true);
  });

  test('grades blanks from both sides together', () => {
    expect(gradeCloze(['capital', 'Paris'], ['capital', 'Paris'])).toBe(true);
    expect(gradeCloze(['capital', 'Lyon'], ['capital', 'Paris'])).toBe(false);
  });

  test('uses the shared loose matcher for case and punctuation', () => {
    expect(gradeCloze(['Mitochondria!'], ['mitochondria'])).toBe(true);
    expect(answersMatchLoose('Paris!', 'paris')).toBe(true);
    expect(answersMatchLoose).toBe(gradeAnswersMatchLoose);
  });
});

describe('cipherFromCard', () => {
  test('auto-clozes both the question and the answer', () => {
    const result = cipherFromCard({
      question: 'What is the powerhouse of the cell?',
      answer: 'The mitochondria is the powerhouse of the cell.',
    });
    expect(blankCount(result.front)).toBeGreaterThan(0);
    expect(blankCount(result.back)).toBeGreaterThan(0);
    expect(visibleWordCount(result.front)).toBeGreaterThan(0);
    expect(visibleWordCount(result.back)).toBeGreaterThan(0);
    expect(result.answers).toEqual([...(result.front.answers || []), ...(result.back.answers || [])]);
    expect(result.answers.length).toBe(blankCount(result.front) + blankCount(result.back));
  });

  test('honors Anki markup on the question and still auto-clozes the answer', () => {
    const result = cipherFromCard({
      question: 'Water freezes at {{c1::0}} degrees',
      answer: '0 degrees Celsius is the freezing point',
    });
    expect(result.front.answers).toEqual(['0']);
    expect(blankCount(result.back)).toBeGreaterThan(0);
    expect(result.answers[0]).toBe('0');
    expect(result.answers.length).toBeGreaterThan(1);
  });

  test('still shows the answer when it is the decoded cloze sentence', () => {
    const result = cipherFromCard({
      question: 'Water freezes at {{c1::0}} degrees',
      answer: 'Water freezes at 0 degrees',
    });
    expect(result.front.answers).toEqual(['0']);
    expect(blankCount(result.back)).toBeGreaterThan(0);
    expect(result.answers.length).toBe(blankCount(result.front) + blankCount(result.back));
  });

  test('fills an answer line even when the card has no back text', () => {
    const result = cipherFromCard({
      question: 'The {{c1::mitochondria}} is the {{c2::powerhouse}}',
      answer: '',
    });
    expect(result.front.answers).toEqual(['mitochondria', 'powerhouse']);
    expect(result.back.answers).toEqual(['mitochondria', 'powerhouse']);
    expect(blankCount(result.back)).toBe(2);
  });

  test('honors Anki markup on the answer and still auto-clozes the question', () => {
    const result = cipherFromCard({
      question: 'What organelle is the powerhouse of the cell?',
      answer: 'The {{c1::mitochondria}} is the powerhouse',
    });
    expect(result.back.answers).toEqual(['mitochondria']);
    expect(blankCount(result.front)).toBeGreaterThan(0);
    expect(result.answers).toContain('mitochondria');
  });

  test('honors Anki markup on both sides', () => {
    const result = cipherFromCard({
      question: 'The {{c1::nucleus}} stores DNA',
      answer: 'It is found in {{c1::eukaryotic}} cells',
    });
    expect(result.front.answers).toEqual(['nucleus']);
    expect(result.back.answers).toEqual(['eukaryotic']);
    expect(result.answers).toEqual(['nucleus', 'eukaryotic']);
  });

  test('a short answer still appears as a blank to fill', () => {
    const result = cipherFromCard({
      question: 'What is the capital of France?',
      answer: 'Paris',
    });
    expect(blankCount(result.front)).toBeGreaterThan(0);
    expect(result.back.answers).toEqual(['Paris']);
    expect(result.answers).toContain('Paris');
  });

  test('reverse swaps which line is which, and both keep blanks', () => {
    const card = playableCard(
      {
        question: 'What is the usual name for 2 plus 2?',
        answer: 'Four is the usual answer here',
        frontMode: 0,
        backMode: 0,
      },
      true
    );
    const restore = (side) =>
      (side.segments || [])
        .map((segment) => (segment.type === 'blank' ? segment.answer : segment.value))
        .join('');
    const result = cipherFromCard(card);
    expect(restore(result.front).toLowerCase()).toContain('four');
    expect(restore(result.back).toLowerCase()).toContain('plus');
    expect(blankCount(result.front)).toBeGreaterThan(0);
    expect(blankCount(result.back)).toBeGreaterThan(0);
  });

  test('autoCloze hides content words and keeps others visible', () => {
    const result = autoCloze('The mitochondria is the powerhouse of the cell.', 1);
    expect(result.answers.length).toBeGreaterThan(0);
    expect(result.segments.filter((segment) => segment.type === 'blank')).toHaveLength(result.answers.length);
    expect(result.prompt).toContain('_____');
    expect(visibleWordCount(result)).toBeGreaterThan(0);
    expect(result.answers.length).toBeLessThan(result.prompt.split(/\s+/).filter(Boolean).length);
    expect(result.answers.some((answer) => /mitochondria|powerhouse|cell/i.test(answer))).toBe(true);
    expect(result.answers.every((answer) => !['the', 'is', 'of'].includes(answer.toLowerCase()))).toBe(true);
  });
});
