import { z } from 'zod';

/**
 * 顧客作成・更新のバリデーションスキーマ
 */
export const customerSchema = z.object({
  name: z
    .string({
      required_error: '顧客名を入力してください',
      invalid_type_error: '顧客名の形式が正しくありません',
    })
    .min(1, '顧客名を入力してください')
    .max(200, '顧客名は200文字以内で入力してください'),
  contact_person: z
    .string()
    .max(100, '担当者名は100文字以内で入力してください')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(/^[0-9]{2,4}-[0-9]{2,4}-[0-9]{3,4}$/, '電話番号の形式が正しくありません (例: 03-1234-5678)')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .max(255, '住所は255文字以内で入力してください')
    .optional()
    .or(z.literal('')),
  industry: z
    .string()
    .max(100, '業種は100文字以内で入力してください')
    .optional()
    .or(z.literal('')),
});

export type CustomerInput = z.infer<typeof customerSchema>;

/**
 * 顧客検索クエリパラメータのバリデーションスキーマ
 */
export const customerQuerySchema = z.object({
  name: z.string().optional(),
  industry: z.string().optional(),
  page: z.string().optional().default('1'),
  per_page: z.string().optional().default('10'),
  sort: z.enum(['name', 'industry', 'updated_at']).optional().default('name'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type CustomerQuery = z.infer<typeof customerQuerySchema>;
