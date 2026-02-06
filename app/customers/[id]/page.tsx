'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MainLayout } from '@/components/layouts/MainLayout';
import { customerSchema, type CustomerInput } from '@/lib/validators/customer';

// 仮のユーザーデータ
const mockUser = {
  name: '山田 太郎',
  department: '営業第一部',
  position: '部長',
};

// 仮の顧客詳細データ
const mockCustomer = {
  id: 10,
  name: '株式会社ABC商事',
  contact_person: '山田 一郎',
  phone: '03-1234-5678',
  address: '東京都千代田区丸の内1-1-1',
  industry: '卸売業',
  last_visit_date: '2026-02-01',
  visit_count: 15,
  visit_history: [
    {
      visit_date: '2026-02-01',
      sales_name: '山田 太郎',
      visit_content: '新商品のプレゼンテーションを実施。',
    },
    {
      visit_date: '2026-01-25',
      sales_name: '山田 太郎',
      visit_content: '定例訪問。',
    },
  ],
};

const industries = ['卸売業', '製造業', '小売業', 'IT業', 'サービス業'];

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 管理者権限チェック
  const isAdmin = mockUser.position === '部長';

  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      contact_person: '',
      phone: '',
      address: '',
      industry: '',
    },
  });

  useEffect(() => {
    // TODO: APIから顧客データを取得
    // 仮のデータ設定
    form.reset({
      name: mockCustomer.name,
      contact_person: mockCustomer.contact_person,
      phone: mockCustomer.phone,
      address: mockCustomer.address,
      industry: mockCustomer.industry,
    });
    setLoading(false);
  }, [customerId, form]);

  const onSubmit = async (data: CustomerInput) => {
    try {
      // TODO: APIを呼び出して顧客を更新
      console.log('顧客更新:', data);

      alert('顧客情報を更新しました');
      router.push('/customers');
    } catch (error) {
      console.error('顧客更新エラー:', error);
      alert('顧客情報の更新に失敗しました');
    }
  };

  const handleDelete = async () => {
    try {
      // TODO: APIを呼び出して顧客を削除
      console.log('顧客削除:', customerId);

      alert('顧客を削除しました');
      router.push('/customers');
    } catch (error) {
      console.error('顧客削除エラー:', error);
      alert('顧客の削除に失敗しました');
    }
  };

  if (loading) {
    return (
      <MainLayout user={mockUser}>
        <div className="flex h-96 items-center justify-center">
          <p>読み込み中...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout user={mockUser}>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center space-x-4">
          <Link href="/customers">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">顧客マスタ編集</h1>
            <p className="text-muted-foreground">顧客情報の編集</p>
          </div>
        </div>

        {/* フォーム */}
        <div className="rounded-lg border bg-card">
          <div className="border-b p-6">
            <h2 className="text-lg font-semibold">基本情報</h2>
          </div>
          <div className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        顧客名(会社名) <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="株式会社〇〇" {...field} disabled={!isAdmin} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_person"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>担当者名</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="山田 太郎"
                          {...field}
                          value={field.value || ''}
                          disabled={!isAdmin}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>電話番号</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="03-1234-5678"
                          {...field}
                          value={field.value || ''}
                          disabled={!isAdmin}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>業種</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={!isAdmin}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="業種を選択してください" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {industries.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>住所</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="東京都千代田区..."
                          {...field}
                          value={field.value || ''}
                          disabled={!isAdmin}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isAdmin && (
                  <div className="flex justify-end space-x-4">
                    <Link href="/customers">
                      <Button type="button" variant="outline">
                        キャンセル
                      </Button>
                    </Link>
                    <Button type="submit">保存</Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      削除
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </div>
        </div>

        {/* 訪問履歴 */}
        <div className="rounded-lg border bg-card">
          <div className="border-b p-6">
            <h2 className="text-lg font-semibold">訪問履歴</h2>
          </div>
          <div className="p-6">
            <div className="mb-4 space-y-1">
              <p className="text-sm">
                <span className="font-medium">最終訪問日:</span> {mockCustomer.last_visit_date}
              </p>
              <p className="text-sm">
                <span className="font-medium">訪問回数:</span> {mockCustomer.visit_count}回 (過去6ヶ月)
              </p>
            </div>
            <div className="space-y-4">
              {mockCustomer.visit_history.map((visit, index) => (
                <div key={index} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium">{visit.visit_date}</p>
                    <p className="text-sm text-muted-foreground">{visit.sales_name}</p>
                  </div>
                  <p className="text-sm">{visit.visit_content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 削除確認ダイアログ */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">確認</h2>
              <p className="mb-6 text-sm">
                本当に削除してもよろしいですか?
                <br />
                この操作は取り消せません。
              </p>
              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  キャンセル
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  削除する
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
