import { z } from 'zod';

/**
 * Problem作成・更新のバリデーションスキーマ
 */
export const problemSchema = z.object({
  content: z
    .string({
      required_error: '課題・相談内容を入力してください',
      invalid_type_error: '課題・相談内容の形式が正しくありません',
    })
    .min(1, '課題・相談内容を入力してください')
    .max(1000, '課題・相談内容は1000文字以内で入力してください'),
});

export type ProblemInput = z.infer<typeof problemSchema>;
