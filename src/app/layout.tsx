import { Ubuntu } from 'next/font/google';
import './globals.css';
import ReduxProvider from '@/components/store/ReduxProvider';
import ToastProvider from '@/components/providers/ToastProvider';
import QueryProvider from '@/components/providers/QueryProvider';
import OnlineStatusProvider from '@/components/providers/OnlineStatusProvider';
import DynamicMetadata from '@/components/providers/DynamicMetadata';
import MaintenanceProvider from '@/components/providers/MaintenanceProvider';

const ubuntu = Ubuntu({
  variable: '--font-ubuntu',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${ubuntu.variable} antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <DynamicMetadata />
          <ReduxProvider>
            <OnlineStatusProvider>
              <MaintenanceProvider>
                {children}
                <ToastProvider />
              </MaintenanceProvider>
            </OnlineStatusProvider>
          </ReduxProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
