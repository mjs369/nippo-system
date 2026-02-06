import { describe, it, expect } from 'vitest';

import { dailyReportSchema } from '@/lib/validators/daily-report';

describe('validators/daily-report', () => {
  describe('dailyReportSchema', () => {
    it('正常系: 有効な日報データをパースできる', () => {
      const input = {
        report_date: '2026-02-01',
      };

      const result = dailyReportSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.report_date).toBe('2026-02-01');
      }
    });

    it('正常系: 過去の日付を受け入れる', () => {
      const input = {
        report_date: '2020-01-15',
      };

      const result = dailyReportSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('正常系: 未来の日付を受け入れる', () => {
      const input = {
        report_date: '2030-12-31',
      };

      const result = dailyReportSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('異常系: report_dateが未入力でエラーを返す', () => {
      const input = {};

      const result = dailyReportSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('報告日を入力してください');
      }
    });

    it('異常系: report_dateが空文字列でエラーを返す', () => {
      const input = {
        report_date: '',
      };

      const result = dailyReportSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('報告日を入力してください');
      }
    });

    it('異常系: report_dateの形式が不正でエラーを返す', () => {
      const input = {
        report_date: '2026/02/01', // スラッシュ区切り
      };

      const result = dailyReportSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('報告日はYYYY-MM-DD形式で入力してください');
      }
    });

    it('異常系: report_dateが存在しない日付でエラーを返す', () => {
      const input = {
        report_date: '2026-02-30', // 2月は30日まで存在しない
      };

      const result = dailyReportSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('有効な日付を入力してください');
      }
    });

    it('異常系: report_dateが不正な文字列でエラーを返す', () => {
      const input = {
        report_date: 'invalid-date',
      };

      const result = dailyReportSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('異常系: report_dateが数値でエラーを返す', () => {
      const input = {
        report_date: 20260201,
      };

      const result = dailyReportSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('報告日の形式が正しくありません');
      }
    });
  });
});
