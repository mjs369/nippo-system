'use client';

import { Header } from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
  user?: {
    name: string;
    department?: string | null;
    position?: string | null;
  };
}

export function MainLayout({ children, user }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto py-6">{children}</main>
    </div>
  );
}
