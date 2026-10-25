// Trigramme proposé à partir d'un nom : « Marie Dupont » → MDU, « Marie » → MAR
export function suggestTrigram(name) {
  const words = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z\s-]/g, '')
    .split(/[\s-]+/)
    .filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return (words[0][0] + words[words.length - 1].slice(0, 2)).toUpperCase();
}
