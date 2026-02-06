import { describe, it, expect } from 'vitest';

import { planSchema } from '@/lib/validators/plan';

describe('validators/plan', () => {
  describe('planSchema', () => {
    it('正常系: 有効なPlanデータをパースできる', () => {
      const input = {
        content: 'ABC商事へ見積書を提出する予定です。',
      };

      const result = planSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('ABC商事へ見積書を提出する予定です。');
      }
    });

    it('正常系: 1000文字の内容を受け入れる', () => {
      const input = {
        content: 'あ'.repeat(1000),
      };

      const result = planSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('異常系: contentが未入力でエラーを返す', () => {
      const input = {};

      const result = planSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('明日の予定を入力してください');
      }
    });

    it('異常系: contentが空文字列でエラーを返す', () => {
      const input = {
        content: '',
      };

      const result = planSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('明日の予定を入力してください');
      }
    });

    it('異常系: contentが1001文字でエラーを返す', () => {
      const input = {
        content: 'あ'.repeat(1001),
      };

      const result = planSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('明日の予定は1000文字以内で入力してください');
      }
    });

    it('異常系: contentが数値でエラーを返す', () => {
      const input = {
        content: 12345,
      };

      const result = planSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('明日の予定の形式が正しくありません');
      }
    });

    it('異常系: contentがオブジェクトでエラーを返す', () => {
      const input = {
        content: { text: 'test' },
      };

      const result = planSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});
