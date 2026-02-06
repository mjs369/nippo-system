'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MainLayout } from '@/components/layouts/MainLayout';

// 仮のユーザーデータ(本番ではAPIから取得)
const mockUser = {
  name: '山田 太郎',
  department: '営業第一部',
  position: '部長',
};

// 仮の顧客データ(本番ではAPIから取得)
const mockCustomers = [
  {
    id: 10,
    name: '株式会社ABC商事',
    contact_person: '山田 一郎',
    phone: '03-1234-5678',
    industry: '卸売業',
    last_visit_date: '2026-02-01',
  },
  {
    id: 11,
    name: 'DEF株式会社',
    contact_person: '鈴木 花子',
    phone: '03-2345-6789',
    industry: '製造業',
    last_visit_date: '2026-01-31',
  },
  {
    id: 12,
    name: 'GHI工業株式会社',
    contact_person: '田中 次郎',
    phone: '03-3456-7890',
    industry: '製造業',
    last_visit_date: '2026-02-01',
  },
  {
    id: 13,
    name: 'JKL商事',
    contact_person: '佐藤 美咲',
    phone: '03-4567-8901',
    industry: '小売業',
    last_visit_date: '2026-01-28',
  },
];

const industries = ['卸売業', '製造業', '小売業', 'IT業', 'サービス業'];

export default function CustomersPage() {
  const [searchName, setSearchName] = useState('');
  const [searchIndustry, setSearchIndustry] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'name' | 'industry' | 'last_visit_date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 管理者権限チェック(本番ではAPIから取得したユーザー情報を使用)
  const isAdmin = mockUser.position === '部長';

  // 検索処理
  const filteredCustomers = mockCustomers.filter((customer) => {
    if (searchName && !customer.name.includes(searchName)) {
      return false;
    }
    if (searchIndustry && customer.industry !== searchIndustry) {
      return false;
    }
    return true;
  });

  // ソート処理
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    let aValue: string | undefined;
    let bValue: string | undefined;

    if (sortField === 'name') {
      aValue = a.name;
      bValue = b.name;
    } else if (sortField === 'industry') {
      aValue = a.industry;
      bValue = b.industry;
    } else if (sortField === 'last_visit_date') {
      aValue = a.last_visit_date;
      bValue = b.last_visit_date;
    }

    if (!aValue || !bValue) return 0;

    if (sortOrder === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  // ページネーション
  const perPage = 10;
  const totalPages = Math.ceil(sortedCustomers.length / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedCustomers = sortedCustomers.slice(startIndex, endIndex);

  // 検索クリア
  const handleClearSearch = () => {
    setSearchName('');
    setSearchIndustry('');
    setCurrentPage(1);
  };

  // ソート切り替え
  const handleSort = (field: 'name' | 'industry' | 'last_visit_date') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <MainLayout user={mockUser}>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">顧客マスタ</h1>
            <p className="text-muted-foreground">顧客情報の検索・一覧表示</p>
          </div>
        </div>

        {/* 検索条件 */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">検索条件</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">顧客名</label>
              <Input
                placeholder="顧客名で検索"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">業種</label>
              <Select value={searchIndustry} onValueChange={setSearchIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="業種を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">すべて</SelectItem>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end space-x-2">
              <Button onClick={() => setCurrentPage(1)}>
                <Search className="mr-2 h-4 w-4" />
                検索
              </Button>
              <Button variant="outline" onClick={handleClearSearch}>
                クリア
              </Button>
            </div>
          </div>
        </div>

        {/* 新規登録ボタンと件数表示 */}
        <div className="flex items-center justify-between">
          {isAdmin && (
            <Link href="/customers/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                新規顧客登録
              </Button>
            </Link>
          )}
          {!isAdmin && <div />}
          <p className="text-sm text-muted-foreground">
            全{sortedCustomers.length}件 ({currentPage}/{totalPages}ページ)
          </p>
        </div>

        {/* 顧客一覧テーブル */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  顧客名 {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>担当者名</TableHead>
                <TableHead>電話番号</TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort('industry')}
                >
                  業種 {sortField === 'industry' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort('last_visit_date')}
                >
                  最終訪問日{' '}
                  {sortField === 'last_visit_date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    該当する顧客が見つかりません
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCustomers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer"
                    onClick={() => (window.location.href = `/customers/${customer.id}`)}
                  >
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.contact_person}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.industry}</TableCell>
                    <TableCell>{customer.last_visit_date}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              前へ
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              次へ
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
