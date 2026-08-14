function stripLatex(value) {
  return String(value || '')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2')
    .replace(/\\sqrt\{([^{}]+)\}/g, 'sqrt$1')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[{}$]/g, ' ');
}

export function normalizeAnswer(value) {
  return stripLatex(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const rows = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let prev = i - 1;
    rows[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = rows[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[j] = Math.min(rows[j] + 1, rows[j - 1] + 1, prev + cost);
      prev = current;
    }
  }
  return rows[b.length];
}

function normalizedEquals(guess, expected) {
  const a = normalizeAnswer(guess);
  const b = normalizeAnswer(expected);
  if (!a || !b) return false;
  if (a === b) return true;
  return a.replace(/\s/g, '') === b.replace(/\s/g, '');
}

/** Cipher-style exact match: ignore case, punctuation, and extra spaces. No fuzzy typos. */
export function answersMatchLoose(guess, expected) {
  return normalizedEquals(guess, expected);
}

function typedAlternatives(expected) {
  const full = String(expected || '').trim();
  const parts = full
    .split(/\s*[\/|;]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return [full];
  return [full, ...parts];
}

export function tokenizeAnswer(value) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/** Type-mode match: Cipher exact matching, plus slash/pipe/semicolon alternatives. */
export function answersMatchTyped(guess, expected) {
  if (answersMatchLoose(guess, expected)) return true;
  const alternatives = typedAlternatives(expected);
  if (alternatives.length < 2) return false;
  return alternatives.some((alt) => answersMatchLoose(guess, alt));
}

function alignAnswerTokens(guessParts, expectedParts) {
  const length = Math.max(guessParts.length, expectedParts.length);
  const tokens = [];
  for (let i = 0; i < length; i += 1) {
    const guess = guessParts[i] || '';
    const expected = expectedParts[i] || '';
    tokens.push({
      guess,
      expected,
      correct: Boolean(guess) && Boolean(expected) && answersMatchLoose(guess, expected),
    });
  }
  return tokens;
}

/** Word-by-word Cipher-style marks for Type's whole-answer box. */
export function gradeTypedTokens(guess, expected) {
  const guessParts = tokenizeAnswer(guess);
  if (answersMatchTyped(guess, expected)) {
    const parts = guessParts.length ? guessParts : tokenizeAnswer(expected);
    return parts.map((word) => ({ guess: word, expected: word, correct: true }));
  }

  let best = alignAnswerTokens(guessParts, tokenizeAnswer(expected));
  let bestScore = best.filter((token) => token.correct).length;
  typedAlternatives(expected).forEach((candidate) => {
    const tokens = alignAnswerTokens(guessParts, tokenizeAnswer(candidate));
    const score = tokens.filter((token) => token.correct).length;
    if (score > bestScore) {
      best = tokens;
      bestScore = score;
    }
  });
  return best;
}

export function answersMatch(guess, expected) {
  if (normalizedEquals(guess, expected)) return true;
  const a = normalizeAnswer(guess);
  const b = normalizeAnswer(expected);
  if (!a || !b) return false;
  const distance = levenshtein(a, b);
  const allowed = Math.max(1, Math.floor(b.length * 0.18));
  return distance <= allowed && Math.abs(a.length - b.length) <= allowed + 1;
}

export function reversedCard(card) {
  if (!card) return card;
  return {
    ...card,
    question: card.answer,
    answer: card.question,
    frontMode: card.backMode,
    backMode: card.frontMode,
  };
}

export function canReverseCard(card) {
  if (!card) return false;
  const backIsImage = card.backMode === 2 || card.backMode === 3;
  const frontIsImage = card.frontMode === 2 || card.frontMode === 3;
  return !backIsImage && !frontIsImage && Boolean(card.answer) && Boolean(card.question);
}

export function playableCard(card, reverse) {
  if (!reverse) return card;
  return canReverseCard(card) ? reversedCard(card) : card;
}
