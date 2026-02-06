import { describe, it, expect } from 'vitest';

import { problemSchema } from '@/lib/validators/problem';

describe('validators/problem', () => {
  describe('problemSchema', () => {
    it('正常系: 有効なProblemデータをパースできる', () => {
      const input = {
        content: 'GHI工業との価格交渉について相談があります。',
      };

      const result = problemSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('GHI工業との価格交渉について相談があります。');
      }
    });

    it('正常系: 1000文字の内容を受け入れる', () => {
      const input = {
        content: 'あ'.repeat(1000),
      };

      const result = problemSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('異常系: contentが未入力でエラーを返す', () => {
      const input = {};

      const result = problemSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('課題・相談内容を入力してください');
      }
    });

    it('異常系: contentが空文字列でエラーを返す', () => {
      const input = {
        content: '',
      };

      const result = problemSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('課題・相談内容を入力してください');
      }
    });

    it('異常系: contentが1001文字でエラーを返す', () => {
      const input = {
        content: 'あ'.repeat(1001),
      };

      const result = problemSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          '課題・相談内容は1000文字以内で入力してください'
        );
      }
    });

    it('異常系: contentが数値でエラーを返す', () => {
      const input = {
        content: 12345,
      };

      const result = problemSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('課題・相談内容の形式が正しくありません');
      }
    });

    it('異常系: contentがオブジェクトでエラーを返す', () => {
      const input = {
        content: { text: 'test' },
      };

      const result = problemSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});
