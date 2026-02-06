'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
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

const industries = ['卸売業', '製造業', '小売業', 'IT業', 'サービス業'];

export default function NewCustomerPage() {
  const router = useRouter();
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

  const onSubmit = async (data: CustomerInput) => {
    try {
      // TODO: APIを呼び出して顧客を作成
      console.log('顧客作成:', data);

      // 仮の成功処理
      alert('顧客を作成しました');
      router.push('/customers');
    } catch (error) {
      console.error('顧客作成エラー:', error);
      alert('顧客の作成に失敗しました');
    }
  };

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
            <h1 className="text-3xl font-bold tracking-tight">顧客マスタ登録</h1>
            <p className="text-muted-foreground">新規顧客情報を登録</p>
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
                        <Input placeholder="株式会社〇〇" {...field} />
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
                        <Input placeholder="山田 太郎" {...field} value={field.value || ''} />
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
                        <Input placeholder="03-1234-5678" {...field} value={field.value || ''} />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Input placeholder="東京都千代田区..." {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4">
                  <Link href="/customers">
                    <Button type="button" variant="outline">
                      キャンセル
                    </Button>
                  </Link>
                  <Button type="submit">保存</Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
