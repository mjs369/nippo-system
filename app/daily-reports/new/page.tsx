'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateDailyReport } from '@/lib/hooks/use-daily-report';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

export default function NewDailyReportPage() {
  const router = useRouter();
  const createDailyReport = useCreateDailyReport();
  const [reportDate, setReportDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reportDate) {
      alert('報告日を入力してください');
      return;
    }

    try {
      const result = await createDailyReport.mutateAsync({
        report_date: reportDate,
      });

      router.push(`/daily-reports/${result.id}`);
    } catch (error) {
      console.error(error);
      alert('日報の作成に失敗しました');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => router.push('/daily-reports')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        一覧に戻る
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">新規日報作成</h1>
        <p className="text-muted-foreground">報告日を選択して日報を作成します</p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
          <CardDescription>日報の報告日を入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report_date">
                報告日 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="report_date"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                required
              />
            </div>

            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/daily-reports')}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={createDailyReport.isPending}>
                {createDailyReport.isPending ? '作成中...' : '作成'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
