import { z } from 'zod';

/**
 * コメント作成・更新のバリデーションスキーマ
 */
export const commentSchema = z.object({
  content: z
    .string({
      required_error: 'コメント内容を入力してください',
      invalid_type_error: 'コメント内容は文字列である必要があります',
    })
    .min(1, 'コメント内容を入力してください')
    .max(1000, 'コメント内容は1000文字以内で入力してください'),
});

export type CommentInput = z.infer<typeof commentSchema>;
