import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind CSSのクラス名を結合するユーティリティ関数
 * clsxとtailwind-mergeを組み合わせて、競合するクラスを適切にマージします
 *
 * @param inputs - クラス名の配列または条件付きオブジェクト
 * @returns マージされたクラス名文字列
 *
 * @example
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4'
 * cn('text-red-500', condition && 'text-blue-500') // => 条件に応じて変化
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
