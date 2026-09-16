const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "z",
  з: "z",
  и: "i",
  й: "i",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "c",
  ч: "c",
  ш: "s",
  щ: "s",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "u",
  я: "a",
};

const DIGRAPHS: Array<[RegExp, string]> = [
  [/shch/g, "s"],
  [/sch/g, "s"],
  [/zh/g, "z"],
  [/kh/g, "h"],
  [/ch/g, "c"],
  [/sh/g, "s"],
  [/ts/g, "c"],
  [/yo/g, "e"],
  [/ya/g, "a"],
  [/yu/g, "u"],
  [/ye/g, "e"],
  [/j/g, "i"],
];

export function foldTerm(token: string): string {
  const latin = [...token.toLowerCase()]
    .map((letter) => CYRILLIC_TO_LATIN[letter] ?? letter)
    .join("");
  return DIGRAPHS.reduce(
    (folded, [pattern, replacement]) => folded.replace(pattern, replacement),
    latin,
  );
}
