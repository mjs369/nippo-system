import { z } from 'zod';

/**
 * 日報作成・更新のバリデーションスキーマ
 */
export const dailyReportSchema = z.object({
  report_date: z
    .string({
      required_error: '報告日を入力してください',
      invalid_type_error: '報告日の形式が正しくありません',
    })
    .min(1, '報告日を入力してください')
    .regex(/^\d{4}-\d{2}-\d{2}$/, '報告日はYYYY-MM-DD形式で入力してください')
    .refine(
      (date) => {
        const parsed = new Date(date);
        if (isNaN(parsed.getTime())) {
          return false;
        }
        // 日付が正確に一致するかチェック（例: 2026-02-30は3月2日になるので不一致）
        const [year, month, day] = date.split('-').map(Number);
        return (
          parsed.getFullYear() === year &&
          parsed.getMonth() === month - 1 &&
          parsed.getDate() === day
        );
      },
      {
        message: '有効な日付を入力してください',
      }
    ),
});

export type DailyReportInput = z.infer<typeof dailyReportSchema>;

/**
 * 日報検索クエリパラメータのバリデーションスキーマ
 */
export const dailyReportQuerySchema = z.object({
  scope: z.enum(['own', 'subordinates', 'all']).optional().default('own'),
  sales_id: z.string().optional(),
  customer_id: z.string().optional(),
  report_date_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  report_date_to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  page: z.string().optional().default('1'),
  per_page: z.string().optional().default('10'),
  sort: z.enum(['report_date', 'updated_at']).optional().default('report_date'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type DailyReportQuery = z.infer<typeof dailyReportQuerySchema>;
