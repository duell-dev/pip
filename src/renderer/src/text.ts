// Textarea offsets count CRLF as one newline; stored source text keeps both bytes.
function rawOffset(text: string, visibleOffset: number) {
  let i = 0;
  for (let n = 0; n < visibleOffset && i < text.length; n++, i++)
    if (text[i] === "\r" && text[i + 1] === "\n") i++;
  return i;
}
export function replaceSelection(
  text: string,
  start: number,
  end: number,
  inserted: string,
) {
  return (
    text.slice(0, rawOffset(text, start)) +
    inserted +
    text.slice(rawOffset(text, end))
  );
}
export function applyEdit(original: string, next: string) {
  const visible = original.replace(/\r\n?/g, "\n");
  let start = 0,
    suffix = 0;
  while (
    start < visible.length &&
    start < next.length &&
    visible[start] === next[start]
  )
    start++;
  while (
    suffix < visible.length - start &&
    suffix < next.length - start &&
    visible[visible.length - 1 - suffix] === next[next.length - 1 - suffix]
  )
    suffix++;
  return replaceSelection(
    original,
    start,
    visible.length - suffix,
    next.slice(start, next.length - suffix),
  );
}
