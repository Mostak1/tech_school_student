'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslate } from '@/components/hooks/useTranslate';

export default function UpgradePlan() {
  const translate = useTranslate();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-lg mx-auto border-none shadow-lg bg-white dark:bg-card">
        <CardHeader className="text-center pb-2">
        
          <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)]">
            {translate('welcome_dashboard')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-lg text-muted-foreground mb-4">
            {translate('no_features_message')}
          </p>
        </CardContent>
      
      </Card>
    </div>
  );
}
