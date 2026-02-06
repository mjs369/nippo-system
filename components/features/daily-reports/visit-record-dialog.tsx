'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

const visitRecordSchema = z
  .object({
    customer_id: z.number().min(1, '顧客を選択してください'),
    visit_content: z
      .string()
      .min(1, '訪問内容を入力してください')
      .max(1000, '訪問内容は1000文字以内で入力してください'),
    visit_start_time: z.string().optional(),
    visit_end_time: z.string().optional(),
  })
  .refine(
    (data) => {
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

type VisitRecordForm = z.infer<typeof visitRecordSchema>;

interface VisitRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dailyReportId: number;
  visitRecord?: {
    id: number;
    customer_id: number;
    visit_content: string;
    visit_start_time?: string;
    visit_end_time?: string;
  };
  onSuccess?: () => void;
}

export function VisitRecordDialog({
  open,
  onOpenChange,
  dailyReportId,
  visitRecord,
  onSuccess,
}: VisitRecordDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = !!visitRecord;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<VisitRecordForm>({
    resolver: zodResolver(visitRecordSchema),
    defaultValues: visitRecord
      ? {
          customer_id: visitRecord.customer_id,
          visit_content: visitRecord.visit_content,
          visit_start_time: visitRecord.visit_start_time?.substring(0, 5) || '',
          visit_end_time: visitRecord.visit_end_time?.substring(0, 5) || '',
        }
      : {
          customer_id: 0,
          visit_content: '',
          visit_start_time: '',
          visit_end_time: '',
        },
  });

  const visitContent = watch('visit_content');

  const onSubmit = async (data: VisitRecordForm) => {
    setIsLoading(true);
    try {
      const url = isEdit
        ? `/api/visit-records/${visitRecord.id}`
        : `/api/daily-reports/${dailyReportId}/visit-records`;

      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: data.customer_id,
          visit_content: data.visit_content,
          visit_start_time: data.visit_start_time
            ? `${data.visit_start_time}:00`
            : undefined,
          visit_end_time: data.visit_end_time
            ? `${data.visit_end_time}:00`
            : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('訪問記録の保存に失敗しました');
      }

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error(error);
      alert('訪問記録の保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? '訪問記録の編集' : '訪問記録の登録'}</DialogTitle>
          <DialogDescription>
            訪問先の顧客と訪問内容を入力してください
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer_id">
              顧客 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watch('customer_id')?.toString()}
              onValueChange={(value) => setValue('customer_id', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="顧客を選択してください" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">株式会社ABC商事</SelectItem>
                <SelectItem value="11">DEF株式会社</SelectItem>
                <SelectItem value="12">GHI工業株式会社</SelectItem>
              </SelectContent>
            </Select>
            {errors.customer_id && (
              <p className="text-sm text-destructive">{errors.customer_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visit_start_time">訪問開始時刻</Label>
              <Input
                id="visit_start_time"
                type="time"
                {...register('visit_start_time')}
              />
              {errors.visit_start_time && (
                <p className="text-sm text-destructive">{errors.visit_start_time.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="visit_end_time">訪問終了時刻</Label>
              <Input
                id="visit_end_time"
                type="time"
                {...register('visit_end_time')}
              />
              {errors.visit_end_time && (
                <p className="text-sm text-destructive">{errors.visit_end_time.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visit_content">
              訪問内容 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="visit_content"
              rows={6}
              {...register('visit_content')}
              placeholder="訪問内容を入力してください"
            />
            <div className="flex justify-between text-sm">
              {errors.visit_content && (
                <p className="text-destructive">{errors.visit_content.message}</p>
              )}
              <p className="ml-auto text-muted-foreground">
                {visitContent?.length || 0}/1000文字
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
