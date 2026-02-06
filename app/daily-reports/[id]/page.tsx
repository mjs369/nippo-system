'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDailyReport, useDeleteDailyReport } from '@/lib/hooks/use-daily-report';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { VisitRecordDialog } from '@/components/features/daily-reports/visit-record-dialog';
import { ProblemDialog } from '@/components/features/daily-reports/problem-dialog';
import { PlanDialog } from '@/components/features/daily-reports/plan-dialog';
import { format } from 'date-fns';
import { ArrowLeft, Plus, Edit, Trash2, MessageSquare } from 'lucide-react';
import type { VisitRecord, Problem, Plan } from '@/lib/hooks/use-daily-report';

interface PageProps {
  params: {
    id: string;
  };
}

export default function DailyReportDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { data: report, isLoading, error, refetch } = useDailyReport(params.id);
  const deleteDailyReport = useDeleteDailyReport();

  const [visitRecordDialog, setVisitRecordDialog] = useState<{
    open: boolean;
    visitRecord?: VisitRecord;
  }>({ open: false });

  const [problemDialog, setProblemDialog] = useState<{
    open: boolean;
    problem?: Problem;
  }>({ open: false });

  const [planDialog, setPlanDialog] = useState<{
    open: boolean;
    plan?: Plan;
  }>({ open: false });

  const handleDelete = async () => {
    if (!report) return;

    if (confirm('本当に削除してもよろしいですか？\nこの操作は取り消せません。')) {
      try {
        await deleteDailyReport.mutateAsync(report.id);
        router.push('/daily-reports');
      } catch (error) {
        console.error(error);
        alert('日報の削除に失敗しました');
      }
    }
  };

  const handleDeleteVisitRecord = async (id: number) => {
    if (confirm('この訪問記録を削除してもよろしいですか？')) {
      try {
        const response = await fetch(`/api/visit-records/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('訪問記録の削除に失敗しました');
        }

        refetch();
      } catch (error) {
        console.error(error);
        alert('訪問記録の削除に失敗しました');
      }
    }
  };

  const handleDeleteProblem = async (id: number) => {
    if (confirm('このProblemを削除してもよろしいですか？')) {
      try {
        const response = await fetch(`/api/problems/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Problemの削除に失敗しました');
        }

        refetch();
      } catch (error) {
        console.error(error);
        alert('Problemの削除に失敗しました');
      }
    }
  };

  const handleDeletePlan = async (id: number) => {
    if (confirm('このPlanを削除してもよろしいですか？')) {
      try {
        const response = await fetch(`/api/plans/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Planの削除に失敗しました');
        }

        refetch();
      } catch (error) {
        console.error(error);
        alert('Planの削除に失敗しました');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto flex h-screen items-center justify-center py-8">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>日報の取得に失敗しました</AlertDescription>
        </Alert>
      </div>
    );
  }

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

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">日報詳細・編集</h1>
          <p className="text-muted-foreground">
            報告日: {format(new Date(report.report_date), 'yyyy年MM月dd日')} | 営業担当者:{' '}
            {report.sales_name}
          </p>
        </div>
        <div className="space-x-2">
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </Button>
        </div>
      </div>

      {/* 訪問記録セクション */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>訪問記録 ({report.visit_records.length}件)</CardTitle>
              <CardDescription>顧客への訪問記録を管理します</CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setVisitRecordDialog({ open: true })}
            >
              <Plus className="mr-2 h-4 w-4" />
              追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {report.visit_records.length === 0 ? (
            <p className="text-center text-muted-foreground">訪問記録がありません</p>
          ) : (
            <div className="space-y-4">
              {report.visit_records.map((record, index) => (
                <Card key={record.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center space-x-2">
                          <span className="font-semibold">
                            ① {record.customer_name}
                          </span>
                          {(record.visit_start_time || record.visit_end_time) && (
                            <span className="text-sm text-muted-foreground">
                              {record.visit_start_time?.substring(0, 5)}-
                              {record.visit_end_time?.substring(0, 5)}
                            </span>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap">{record.visit_content}</p>
                      </div>
                      <div className="ml-4 flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setVisitRecordDialog({ open: true, visitRecord: record })
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteVisitRecord(record.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Problemセクション */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Problem (課題・相談) ({report.problems.length}件)</CardTitle>
              <CardDescription>課題や相談事項を管理します</CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setProblemDialog({ open: true })}
            >
              <Plus className="mr-2 h-4 w-4" />
              追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {report.problems.length === 0 ? (
            <p className="text-center text-muted-foreground">Problemがありません</p>
          ) : (
            <div className="space-y-4">
              {report.problems.map((problem, index) => (
                <Card key={problem.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="mb-2 whitespace-pre-wrap">{problem.content}</p>
                        {problem.comments.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MessageSquare className="mr-1 h-4 w-4" />
                              上長コメント ({problem.comments.length}件)
                            </div>
                            {problem.comments.map((comment) => (
                              <Card key={comment.id} className="bg-muted">
                                <CardContent className="pt-4">
                                  <div className="mb-1 text-sm font-semibold">
                                    {comment.commenter_name} ({comment.commenter_position})
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      {format(new Date(comment.created_at), 'yyyy/MM/dd HH:mm')}
                                    </span>
                                  </div>
                                  <p className="whitespace-pre-wrap text-sm">{comment.content}</p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setProblemDialog({ open: true, problem })
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteProblem(problem.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Planセクション */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plan (明日の予定) ({report.plans.length}件)</CardTitle>
              <CardDescription>明日の予定を管理します</CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setPlanDialog({ open: true })}
            >
              <Plus className="mr-2 h-4 w-4" />
              追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {report.plans.length === 0 ? (
            <p className="text-center text-muted-foreground">Planがありません</p>
          ) : (
            <div className="space-y-4">
              {report.plans.map((plan, index) => (
                <Card key={plan.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="mb-2 whitespace-pre-wrap">{plan.content}</p>
                        {plan.comments.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MessageSquare className="mr-1 h-4 w-4" />
                              上長コメント ({plan.comments.length}件)
                            </div>
                            {plan.comments.map((comment) => (
                              <Card key={comment.id} className="bg-muted">
                                <CardContent className="pt-4">
                                  <div className="mb-1 text-sm font-semibold">
                                    {comment.commenter_name} ({comment.commenter_position})
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      {format(new Date(comment.created_at), 'yyyy/MM/dd HH:mm')}
                                    </span>
                                  </div>
                                  <p className="whitespace-pre-wrap text-sm">{comment.content}</p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setPlanDialog({ open: true, plan })
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeletePlan(plan.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ダイアログ */}
      <VisitRecordDialog
        open={visitRecordDialog.open}
        onOpenChange={(open) => setVisitRecordDialog({ open })}
        dailyReportId={report.id}
        visitRecord={visitRecordDialog.visitRecord}
        onSuccess={() => refetch()}
      />

      <ProblemDialog
        open={problemDialog.open}
        onOpenChange={(open) => setProblemDialog({ open })}
        dailyReportId={report.id}
        problem={problemDialog.problem}
        onSuccess={() => refetch()}
      />

      <PlanDialog
        open={planDialog.open}
        onOpenChange={(open) => setPlanDialog({ open })}
        dailyReportId={report.id}
        plan={planDialog.plan}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
