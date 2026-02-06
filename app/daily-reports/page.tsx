'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDailyReports, type DailyReportsFilters } from '@/lib/hooks/use-daily-reports';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { MessageSquare, Plus } from 'lucide-react';

export default function DailyReportsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<DailyReportsFilters>({
    scope: 'own',
    page: 1,
    per_page: 10,
    sort: 'report_date',
    order: 'desc',
  });

  const { data, isLoading, error } = useDailyReports(filters);

  const handleFilterChange = (key: keyof DailyReportsFilters, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // 検索条件変更時はページを1に戻す
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      scope: 'own',
      page: 1,
      per_page: 10,
      sort: 'report_date',
      order: 'desc',
    });
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleRowClick = (id: number) => {
    router.push(`/daily-reports/${id}`);
  };

  const handleCreateReport = () => {
    router.push('/daily-reports/new');
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">日報一覧</h1>
          <p className="text-muted-foreground">営業日報の検索・閲覧</p>
        </div>
        <Button onClick={handleCreateReport}>
          <Plus className="mr-2 h-4 w-4" />
          新規日報作成
        </Button>
      </div>

      {/* 検索条件 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>検索条件</CardTitle>
          <CardDescription>日報を絞り込むための条件を指定してください</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>表示対象</Label>
              <Select
                value={filters.scope}
                onValueChange={(value) => handleFilterChange('scope', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="表示対象を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="own">自分の日報</SelectItem>
                  <SelectItem value="subordinates">部下の日報</SelectItem>
                  <SelectItem value="all">全て</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report_date_from">報告日（開始）</Label>
              <Input
                id="report_date_from"
                type="date"
                value={filters.report_date_from || ''}
                onChange={(e) => handleFilterChange('report_date_from', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="report_date_to">報告日（終了）</Label>
              <Input
                id="report_date_to"
                type="date"
                value={filters.report_date_to || ''}
                onChange={(e) => handleFilterChange('report_date_to', e.target.value)}
              />
            </div>

            <div className="flex items-end space-x-2">
              <Button onClick={() => setFilters({ ...filters, page: 1 })} className="flex-1">
                検索
              </Button>
              <Button variant="outline" onClick={handleClearFilters} className="flex-1">
                クリア
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* データテーブル */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">読み込み中...</p>
            </div>
          ) : error ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-destructive">エラーが発生しました</p>
            </div>
          ) : data && data.data.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">日報が見つかりませんでした</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>報告日</TableHead>
                    <TableHead>営業担当者</TableHead>
                    <TableHead className="text-center">訪問件数</TableHead>
                    <TableHead className="text-center">Problem</TableHead>
                    <TableHead className="text-center">Plan</TableHead>
                    <TableHead>最終更新</TableHead>
                    <TableHead className="text-center">コメント</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((report) => (
                    <TableRow
                      key={report.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(report.id)}
                    >
                      <TableCell>{format(new Date(report.report_date), 'yyyy/MM/dd')}</TableCell>
                      <TableCell>{report.sales_name}</TableCell>
                      <TableCell className="text-center">{report.visit_count}件</TableCell>
                      <TableCell className="text-center">{report.problem_count}件</TableCell>
                      <TableCell className="text-center">{report.plan_count}件</TableCell>
                      <TableCell>
                        {format(new Date(report.updated_at), 'yyyy/MM/dd HH:mm')}
                      </TableCell>
                      <TableCell className="text-center">
                        {report.has_comments && <MessageSquare className="inline h-4 w-4" />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* ページネーション */}
              {data && data.pagination.total_pages > 1 && (
                <div className="flex items-center justify-between border-t p-4">
                  <p className="text-sm text-muted-foreground">
                    全{data.pagination.total_count}件 ({data.pagination.current_page}/
                    {data.pagination.total_pages}ページ)
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(data.pagination.current_page - 1)}
                      disabled={data.pagination.current_page === 1}
                    >
                      前へ
                    </Button>
                    {Array.from({ length: data.pagination.total_pages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === data.pagination.total_pages ||
                          Math.abs(page - data.pagination.current_page) <= 1
                      )
                      .map((page, index, array) => {
                        const showEllipsis = index > 0 && page - array[index - 1] > 1;
                        return (
                          <div key={page} className="flex items-center">
                            {showEllipsis && <span className="px-2">...</span>}
                            <Button
                              variant={page === data.pagination.current_page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </Button>
                          </div>
                        );
                      })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(data.pagination.current_page + 1)}
                      disabled={data.pagination.current_page === data.pagination.total_pages}
                    >
                      次へ
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
