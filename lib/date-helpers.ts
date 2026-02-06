import { parseISO, startOfDay, isValid } from 'date-fns';

/**
 * YYYY-MM-DD形式の文字列を日付オブジェクトに変換する
 * タイムゾーンの影響を受けないように、UTCの00:00:00として扱う
 */
export function parseReportDate(dateString: string): Date {
  // YYYY-MM-DDをパースし、その日の開始時刻にする
  const parsed = parseISO(dateString);
  if (!isValid(parsed)) {
    throw new Error('Invalid date format');
  }
  return startOfDay(parsed);
}

/**
 * 日付オブジェクトをYYYY-MM-DD形式の文字列に変換する
 */
export function formatReportDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * 日付文字列が有効かチェックする
 */
export function isValidReportDate(dateString: string): boolean {
  try {
    const parsed = parseReportDate(dateString);
    return isValid(parsed);
  } catch {
    return false;
  }
}
