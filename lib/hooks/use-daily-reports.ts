'use client';

import { useQuery } from '@tanstack/react-query';

export interface DailyReport {
  id: number;
  sales_id: number;
  sales_name: string;
  report_date: string;
  visit_count: number;
  problem_count: number;
  plan_count: number;
  has_comments: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyReportsResponse {
  data: DailyReport[];
  pagination: {
    current_page: number;
    per_page: number;
    total_pages: number;
    total_count: number;
  };
}

export interface DailyReportsFilters {
  scope?: 'own' | 'subordinates' | 'all';
  sales_id?: number;
  customer_id?: number;
  report_date_from?: string;
  report_date_to?: string;
  page?: number;
  per_page?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export function useDailyReports(filters: DailyReportsFilters = {}) {
  return useQuery<DailyReportsResponse>({
    queryKey: ['daily-reports', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.scope) params.append('scope', filters.scope);
      if (filters.sales_id) params.append('sales_id', filters.sales_id.toString());
      if (filters.customer_id) params.append('customer_id', filters.customer_id.toString());
      if (filters.report_date_from) params.append('report_date_from', filters.report_date_from);
      if (filters.report_date_to) params.append('report_date_to', filters.report_date_to);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.per_page) params.append('per_page', filters.per_page.toString());
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.order) params.append('order', filters.order);

      const response = await fetch(`/api/daily-reports?${params.toString()}`);

      if (!response.ok) {
        throw new Error('日報一覧の取得に失敗しました');
      }

      return response.json();
    },
  });
}
