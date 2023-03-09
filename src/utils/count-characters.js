function countCharacters(text, characters) {
  characters = new Set(characters);
  const result = Object.create(null);
  for (const character of characters) {
    result[character] = 0;
  }

  for (const character of text) {
    if (characters.has(character)) {
      result[character]++;
    }
  }

  return result;
}

export default countCharacters;
