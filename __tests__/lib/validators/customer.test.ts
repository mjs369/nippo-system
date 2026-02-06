import { describe, it, expect } from 'vitest';
import { customerSchema } from '@/lib/validators/customer';

describe('customerSchema', () => {
  describe('正常系', () => {
    it('有効な顧客データでバリデーションが成功する', () => {
      const validData = {
        name: '株式会社ABC商事',
        contact_person: '山田 太郎',
        phone: '03-1234-5678',
        address: '東京都千代田区丸の内1-1-1',
        industry: '卸売業',
      };

      const result = customerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('必須項目のみでバリデーションが成功する', () => {
      const validData = {
        name: '株式会社ABC商事',
      };

      const result = customerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('空文字列のオプション項目を許可する', () => {
      const validData = {
        name: '株式会社ABC商事',
        contact_person: '',
        phone: '',
        address: '',
        industry: '',
      };

      const result = customerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('異常系', () => {
    it('顧客名が空の場合エラーになる', () => {
      const invalidData = {
        name: '',
      };

      const result = customerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('顧客名を入力してください');
      }
    });

    it('顧客名が200文字を超える場合エラーになる', () => {
      const invalidData = {
        name: 'あ'.repeat(201),
      };

      const result = customerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('顧客名は200文字以内で入力してください');
      }
    });

    it('担当者名が100文字を超える場合エラーになる', () => {
      const invalidData = {
        name: '株式会社ABC商事',
        contact_person: 'あ'.repeat(101),
      };

      const result = customerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('担当者名は100文字以内で入力してください');
      }
    });

    it('電話番号が不正な形式の場合エラーになる', () => {
      const invalidData = {
        name: '株式会社ABC商事',
        phone: '1234567890',
      };

      const result = customerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('電話番号の形式が正しくありません');
      }
    });

    it('住所が255文字を超える場合エラーになる', () => {
      const invalidData = {
        name: '株式会社ABC商事',
        address: 'あ'.repeat(256),
      };

      const result = customerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('住所は255文字以内で入力してください');
      }
    });

    it('業種が100文字を超える場合エラーになる', () => {
      const invalidData = {
        name: '株式会社ABC商事',
        industry: 'あ'.repeat(101),
      };

      const result = customerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('業種は100文字以内で入力してください');
      }
    });
  });

  describe('境界値', () => {
    it('顧客名が200文字ちょうどの場合成功する', () => {
      const validData = {
        name: 'あ'.repeat(200),
      };

      const result = customerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('担当者名が100文字ちょうどの場合成功する', () => {
      const validData = {
        name: '株式会社ABC商事',
        contact_person: 'あ'.repeat(100),
      };

      const result = customerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('住所が255文字ちょうどの場合成功する', () => {
      const validData = {
        name: '株式会社ABC商事',
        address: 'あ'.repeat(255),
      };

      const result = customerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('業種が100文字ちょうどの場合成功する', () => {
      const validData = {
        name: '株式会社ABC商事',
        industry: 'あ'.repeat(100),
      };

      const result = customerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('電話番号パターン', () => {
    it.each([
      ['03-1234-5678', true],
      ['0120-123-456', true],
      ['090-1234-5678', true],
      ['06-6789-1234', true],
      ['0570-12-3456', true],
    ])('電話番号 "%s" は %s', (phone, expected) => {
      const data = {
        name: '株式会社ABC商事',
        phone,
      };

      const result = customerSchema.safeParse(data);
      expect(result.success).toBe(expected);
    });
  });
});
