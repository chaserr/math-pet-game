const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

export const ALPHABET_LETTERS = ALPHABET.split('');

export function normalizeAlphabetLetter(letter) {
  const key = String(letter || '').trim().toLowerCase()[0];
  return ALPHABET.includes(key) ? key : 'a';
}

export function letterAssetPath(letter) {
  return `/reading/letters/${normalizeAlphabetLetter(letter)}.png`;
}

export function isSingleAlphabetLetter(letter) {
  return /^[a-z]$/i.test(String(letter || ''));
}
