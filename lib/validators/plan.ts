import { z } from 'zod';

/**
 * Plan作成・更新のバリデーションスキーマ
 */
export const planSchema = z.object({
  content: z
    .string({
      required_error: '明日の予定を入力してください',
      invalid_type_error: '明日の予定の形式が正しくありません',
    })
    .min(1, '明日の予定を入力してください')
    .max(1000, '明日の予定は1000文字以内で入力してください'),
});

export type PlanInput = z.infer<typeof planSchema>;
