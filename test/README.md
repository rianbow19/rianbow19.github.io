# ARTFOLIO - 精美藝術作品集網站

一個現代高級的藝術作品集展示網站，使用 Next.js、TypeScript 和 Tailwind CSS 開發。

## 功能特點

- 響應式設計，適配所有設備尺寸
- 黑暗模式 / 明亮模式支持
- 精美現代的 UI 設計
- 高效能 SPA 應用
- SEO 友好的頁面結構

## 頁面組成

- **首頁**: 展示精選作品與藝術家介紹
- **作品集**: 展示所有藝術作品，支持分類和排序
- **作品詳情**: 查看單個作品的詳細信息
- **關於藝術家**: 介紹藝術家的背景、風格和創作歷程
- **聯繫頁面**: 包含聯絡表單和聯繫信息

## 技術棧

- [Next.js](https://nextjs.org/) - React 框架
- [TypeScript](https://www.typescriptlang.org/) - 類型安全的 JavaScript 超集
- [Tailwind CSS](https://tailwindcss.com/) - 功能優先的 CSS 框架
- [React Hooks](https://reactjs.org/docs/hooks-intro.html) - 用於狀態管理和副作用

## 快速開始

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

訪問 [http://localhost:3000](http://localhost:3000) 查看網站。

### 構建生產版本

```bash
npm run build
```

### 運行生產版本

```bash
npm run start
```

## 項目結構

```
src/
  ├── app/                  # App目錄 (Next.js App Router)
  │    ├── components/      # 共享組件
  │    ├── about/           # 關於頁面
  │    ├── contact/         # 聯絡頁面
  │    ├── gallery/         # 作品集頁面
  │    │     └── [id]/      # 作品詳情頁面（動態路由）
  │    ├── globals.css      # 全局樣式
  │    ├── layout.tsx       # 根佈局組件
  │    └── page.tsx         # 首頁
  └── ...
```

## 自定義與擴展

### 添加新作品

在 `src/app/gallery/page.tsx` 和 `src/app/gallery/[id]/page.tsx` 文件中，找到 `artworks` 數組，按照現有格式添加新的作品對象。

### 修改樣式

本項目使用 Tailwind CSS，可以通過修改類名來調整樣式。全局樣式定義在 `src/app/globals.css` 文件中。

### 添加新頁面

利用 Next.js 的文件系統路由，只需在 `src/app` 目錄下創建新的目錄和 `page.tsx` 文件即可添加新頁面。

## 許可證

MIT
