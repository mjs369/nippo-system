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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

const planSchema = z.object({
  content: z
    .string()
    .min(1, '明日の予定を入力してください')
    .max(1000, '明日の予定は1000文字以内で入力してください'),
});

type PlanForm = z.infer<typeof planSchema>;

interface PlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dailyReportId: number;
  plan?: {
    id: number;
    content: string;
  };
  onSuccess?: () => void;
}

export function PlanDialog({
  open,
  onOpenChange,
  dailyReportId,
  plan,
  onSuccess,
}: PlanDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = !!plan;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<PlanForm>({
    resolver: zodResolver(planSchema),
    defaultValues: plan
      ? {
          content: plan.content,
        }
      : {
          content: '',
        },
  });

  const content = watch('content');

  const onSubmit = async (data: PlanForm) => {
    setIsLoading(true);
    try {
      const url = isEdit
        ? `/api/plans/${plan.id}`
        : `/api/daily-reports/${dailyReportId}/plans`;

      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Planの保存に失敗しました');
      }

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error(error);
      alert('Planの保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Planの編集' : 'Planの登録'}</DialogTitle>
          <DialogDescription>
            明日の予定を入力してください
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">
              明日の予定 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="content"
              rows={8}
              {...register('content')}
              placeholder="明日の予定を入力してください"
            />
            <div className="flex justify-between text-sm">
              {errors.content && (
                <p className="text-destructive">{errors.content.message}</p>
              )}
              <p className="ml-auto text-muted-foreground">
                {content?.length || 0}/1000文字
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
