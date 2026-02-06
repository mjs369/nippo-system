import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VisitRecordDialog } from '@/components/features/daily-reports/visit-record-dialog';

describe('VisitRecordDialog', () => {
  it('ダイアログが開いているときにタイトルが表示される', () => {
    render(
      <VisitRecordDialog
        open={true}
        onOpenChange={vi.fn()}
        dailyReportId={1}
      />
    );

    expect(screen.getByText('訪問記録の登録')).toBeInTheDocument();
  });

  it('編集モードのときに編集タイトルが表示される', () => {
    render(
      <VisitRecordDialog
        open={true}
        onOpenChange={vi.fn()}
        dailyReportId={1}
        visitRecord={{
          id: 1,
          customer_id: 10,
          visit_content: 'テスト訪問内容',
        }}
      />
    );

    expect(screen.getByText('訪問記録の編集')).toBeInTheDocument();
  });

  it('必須項目のラベルにアスタリスクが表示される', () => {
    render(
      <VisitRecordDialog
        open={true}
        onOpenChange={vi.fn()}
        dailyReportId={1}
      />
    );

    const labels = screen.getAllByText('*');
    expect(labels.length).toBeGreaterThan(0);
  });
});
