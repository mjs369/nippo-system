import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// 各テスト前にブラウザAPIのモックをセットアップ
beforeEach(() => {
  // Storage.prototypeを使ってlocalStorageとsessionStorageを両方モック
  const storageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };

  Object.defineProperty(window, 'localStorage', {
    value: storageMock,
    writable: true,
  });

  Object.defineProperty(window, 'sessionStorage', {
    value: storageMock,
    writable: true,
  });
});

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
