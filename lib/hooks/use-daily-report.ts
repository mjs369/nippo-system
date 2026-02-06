'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface VisitRecord {
  id: number;
  customer_id: number;
  customer_name: string;
  visit_content: string;
  visit_start_time?: string;
  visit_end_time?: string;
  created_at: string;
}

export interface Comment {
  id: number;
  commenter_id: number;
  commenter_name: string;
  commenter_position: string;
  content: string;
  created_at: string;
}

export interface Problem {
  id: number;
  content: string;
  comments: Comment[];
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: number;
  content: string;
  comments: Comment[];
  created_at: string;
  updated_at: string;
}

export interface DailyReportDetail {
  id: number;
  sales_id: number;
  sales_name: string;
  report_date: string;
  visit_records: VisitRecord[];
  problems: Problem[];
  plans: Plan[];
  created_at: string;
  updated_at: string;
}

export function useDailyReport(id: string | number) {
  return useQuery<DailyReportDetail>({
    queryKey: ['daily-report', id],
    queryFn: async () => {
      const response = await fetch(`/api/daily-reports/${id}`);

      if (!response.ok) {
        throw new Error('日報の取得に失敗しました');
      }

      return response.json();
    },
    enabled: !!id && id !== 'new',
  });
}

export function useCreateDailyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { report_date: string }) => {
      const response = await fetch('/api/daily-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('日報の作成に失敗しました');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-reports'] });
    },
  });
}

export function useDeleteDailyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/daily-reports/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('日報の削除に失敗しました');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-reports'] });
    },
  });
}
