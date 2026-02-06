import { z } from 'zod';

/**
 * 訪問記録作成・更新のバリデーションスキーマ
 */
export const visitRecordSchema = z
  .object({
    customer_id: z
      .number({
        required_error: '顧客を選択してください',
        invalid_type_error: '顧客IDは数値である必要があります',
      })
      .int('顧客IDは整数である必要があります')
      .positive('顧客を選択してください'),
    visit_content: z
      .string({
        required_error: '訪問内容を入力してください',
        invalid_type_error: '訪問内容は文字列である必要があります',
      })
      .min(1, '訪問内容を入力してください')
      .max(1000, '訪問内容は1000文字以内で入力してください'),
    visit_start_time: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/, '訪問開始時刻はHH:MM:SS形式で入力してください')
      .optional(),
    visit_end_time: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/, '訪問終了時刻はHH:MM:SS形式で入力してください')
      .optional(),
  })
  .refine(
    (data) => {
      // 両方の時刻が入力されている場合のみ、終了時刻が開始時刻より後かチェック
      if (data.visit_start_time && data.visit_end_time) {
        return data.visit_end_time > data.visit_start_time;
      }
      return true;
    },
    {
      message: '訪問終了時刻は開始時刻より後に設定してください',
      path: ['visit_end_time'],
    }
  );

export type VisitRecordInput = z.infer<typeof visitRecordSchema>;
