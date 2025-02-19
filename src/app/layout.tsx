import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Link to Image - 链接转图片工具",
  description: "一个简单易用的工具，可以将任何网页链接转换成包含二维码、网站标题和简介的精美图片。特别适合微信公众号运营者在文章中插入外部链接。",
  keywords: "链接转图片,二维码生成,微信公众号,外部链接,图片生成",
  authors: [{ name: '开发者', url: 'https://github.com/[username]' }],
  creator: '开发者',
  publisher: '开发者',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://your-domain.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Link to Image - 链接转图片工具',
    description: '一个简单易用的工具，可以将任何网页链接转换成包含二维码、网站标题和简介的精美图片。特别适合微信公众号运营者在文章中插入外部链接。',
    url: 'https://your-domain.com',
    siteName: 'Link to Image',
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Link to Image - 链接转图片工具',
    description: '一个简单易用的工具，可以将任何网页链接转换成包含二维码、网站标题和简介的精美图片。特别适合微信公众号运营者在文章中插入外部链接。',
    creator: '@your-twitter-handle',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-site-verification',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <head>
        <meta name="application-name" content="Link to Image" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Link to Image" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
