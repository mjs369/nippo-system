'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, Users, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  user?: {
    name: string;
    department?: string | null;
    position?: string | null;
  };
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      router.push('/login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
      // エラーが発生してもログアウト処理を続行
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      router.push('/login');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* ロゴ */}
        <Link href="/daily-reports" className="flex items-center space-x-2">
          <FileText className="h-6 w-6" />
          <span className="text-xl font-bold">営業日報システム</span>
        </Link>

        {/* ナビゲーション */}
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/daily-reports"
            className={`transition-colors hover:text-foreground/80 ${
              pathname?.startsWith('/daily-reports') ? 'text-foreground' : 'text-foreground/60'
            }`}
          >
            日報一覧
          </Link>
          <Link
            href="/customers"
            className={`transition-colors hover:text-foreground/80 ${
              pathname?.startsWith('/customers') ? 'text-foreground' : 'text-foreground/60'
            }`}
          >
            顧客マスタ
          </Link>
        </nav>

        {/* ユーザーメニュー */}
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>{user?.name || 'ユーザー'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{user?.name}</p>
                  {user?.department && <p className="text-xs text-muted-foreground">{user.department}</p>}
                  {user?.position && <p className="text-xs text-muted-foreground">{user.position}</p>}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>ログアウト</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
