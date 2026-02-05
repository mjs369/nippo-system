import { z } from 'zod';

/**
 * ログインフォームのバリデーションスキーマ
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .max(255, 'メールアドレスは255文字以内で入力してください')
    .email('メールアドレスの形式が正しくありません'),
  password: z
    .string()
    .min(1, 'パスワードを入力してください')
    .max(128, 'パスワードは128文字以内で入力してください'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
