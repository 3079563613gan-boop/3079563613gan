import type { Metadata } from "next";
import { Theme } from "@radix-ui/themes";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import UnifiedNavbar from "@/components/layout/UnifiedNavbar";
import SplanFooter from "@/components/splan/SplanFooter";
import SubscriptionNotification from "@/components/custom/SubscriptionNotification";
import Providers from "@/components/providers/Providers";
import MouseFollower from "@/components/effects/MouseFollower";
import ScrollProgress, { BackToTop } from "@/components/effects/ScrollProgress";
import PageLoader from "@/components/effects/PageLoader";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://fxkiller.com'),
  title: {
    default: "阿甘资本 - Professional FX Trader Training Platform | 外汇交易职业交易员培训",
    template: "%s | 阿甘资本"
  },
  description: "阿甘资本 - 专注于外汇交易的职业交易员培训平台。提供系统化外汇交易培训、实战训练和资金支持。通过专业考核即可获得资金管理权限，分润比例高达90%。培养真正适合外汇市场的专业交易员。",
  keywords: ["阿甘资本", "外汇交易", "外汇培训", "职业交易员", "FX交易", "外汇交易员", "外汇培训平台", "forex交易", "专业交易员培训", "外汇实战", "外汇技能培训"],
  authors: [{ name: "阿甘资本" }],
  creator: "阿甘资本",
  publisher: "阿甘资本",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://fxkiller.com",
    siteName: "阿甘资本",
    title: "阿甘资本 - Professional FX Trader Training Platform",
    description: "专注于外汇交易的职业交易员培训平台。提供系统化外汇交易培训、实战训练和资金支持。通过专业考核即可获得资金管理权限，分润比例高达90%。",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "阿甘资本"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "阿甘资本 - Professional FX Trader Training Platform",
    description: "专注于外汇交易的职业交易员培训平台。提供系统化外汇交易培训、实战训练和资金支持。",
    images: ["/og-image.jpg"]
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
    // 可以添加 Google Search Console 验证码
    // google: 'google-site-verification-code',
    other: {
      'baidu-site-verification': 'codeva-kDRjETSiUu',
    },
  },
};

export default async function PortalLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en-US' : 'zh-CN';

  return (
    <html lang={lang} className={inter.variable} suppressHydrationWarning style={{ colorScheme: 'light dark' }}>
      <head>
        <meta name="baidu-site-verification" content="codeva-kDRjETSiUu" />
        <meta name="color-scheme" content="light dark" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.style.colorScheme = 'light';
                }
              } catch (e) {}
              
              // 移除 Calendly 组件和图标
              function removeCalendly() {
                // 移除所有包含 calendly 的元素
                const calendlyElements = document.querySelectorAll('[class*="calendly"], [id*="calendly"], iframe[src*="calendly"], .calendly-inline-widget, .calendly-popup-button, .calendly-badge-widget');
                calendlyElements.forEach(el => {
                  if (el && el.parentNode) {
                    el.parentNode.removeChild(el);
                  }
                });
                
                // 移除 calendly 相关的脚本
                const scripts = document.querySelectorAll('script[src*="calendly"]');
                scripts.forEach(script => {
                  if (script && script.parentNode) {
                    script.parentNode.removeChild(script);
                  }
                });
              }
              
              // 立即执行
              removeCalendly();
              
              // 监听 DOM 变化，持续移除
              const observer = new MutationObserver(removeCalendly);
              observer.observe(document.body, {
                childList: true,
                subtree: true
              });
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <PageLoader />
          <MouseFollower />
          <ScrollProgress />
          <UnifiedNavbar />
          <main className="pt-16">
            <Theme accentColor="gray" scaling="90%" grayColor="slate" appearance="inherit" radius="none">
              {children}
            </Theme>
          </main>
          <SplanFooter />
          <BackToTop />
          <SubscriptionNotification />
        </Providers>
      </body>
    </html>
  );
}
