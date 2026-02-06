import { describe, it, expect } from 'vitest';

import { parseReportDate, formatReportDate, isValidReportDate } from '@/lib/date-helpers';

describe('date-helpers', () => {
  describe('parseReportDate', () => {
    it('正常系: YYYY-MM-DD形式の日付文字列をパースできる', () => {
      const result = parseReportDate('2026-02-01');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(1); // 0-indexed
      expect(result.getDate()).toBe(1);
    });

    it('正常系: 過去の日付をパースできる', () => {
      const result = parseReportDate('2020-01-15');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2020);
    });

    it('正常系: 未来の日付をパースできる', () => {
      const result = parseReportDate('2030-12-31');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2030);
    });

    it('異常系: 不正な日付形式でエラーをスローする', () => {
      expect(() => parseReportDate('2026/02/01')).toThrow('Invalid date format');
      expect(() => parseReportDate('invalid')).toThrow('Invalid date format');
      expect(() => parseReportDate('')).toThrow('Invalid date format');
    });

    it('異常系: 存在しない日付でエラーをスローする', () => {
      expect(() => parseReportDate('2026-02-30')).toThrow('Invalid date format');
      expect(() => parseReportDate('2026-13-01')).toThrow('Invalid date format');
    });
  });

  describe('formatReportDate', () => {
    it('正常系: 日付オブジェクトをYYYY-MM-DD形式の文字列に変換できる', () => {
      const date = new Date('2026-02-01T00:00:00Z');
      const result = formatReportDate(date);
      expect(result).toBe('2026-02-01');
    });

    it('正常系: 時刻情報を含む日付オブジェクトも正しく変換できる', () => {
      const date = new Date('2026-02-01T18:30:00Z');
      const result = formatReportDate(date);
      expect(result).toBe('2026-02-01');
    });
  });

  describe('isValidReportDate', () => {
    it('正常系: 有効な日付文字列でtrueを返す', () => {
      expect(isValidReportDate('2026-02-01')).toBe(true);
      expect(isValidReportDate('2020-01-15')).toBe(true);
      expect(isValidReportDate('2030-12-31')).toBe(true);
    });

    it('異常系: 無効な日付文字列でfalseを返す', () => {
      expect(isValidReportDate('2026/02/01')).toBe(false);
      expect(isValidReportDate('invalid')).toBe(false);
      expect(isValidReportDate('')).toBe(false);
      expect(isValidReportDate('2026-02-30')).toBe(false);
      expect(isValidReportDate('2026-13-01')).toBe(false);
    });
  });
});
