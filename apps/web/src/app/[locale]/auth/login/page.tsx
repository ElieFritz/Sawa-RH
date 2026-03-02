import { getTranslations } from 'next-intl/server';

import { AuthPanel } from '@/components/auth/auth-panel';
import { LoginForm } from '@/components/auth/login-form';

export default async function LoginPage() {
  const t = await getTranslations('Auth');

  return (
    <AuthPanel
      eyebrow={t('loginEyebrow')}
      title={t('loginTitle')}
      description={t('loginDescription')}
      railTitle={t('loginRailTitle')}
      railDescription={t('loginRailDescription')}
      footerNote={t('loginFooterNote')}
      highlights={[
        {
          label: t('loginHighlightOneLabel'),
          value: t('loginHighlightOneValue'),
          description: t('loginHighlightOneDescription'),
          tone: 'amber',
        },
        {
          label: t('loginHighlightTwoLabel'),
          value: t('loginHighlightTwoValue'),
          description: t('loginHighlightTwoDescription'),
          tone: 'sky',
        },
        {
          label: t('loginHighlightThreeLabel'),
          value: t('loginHighlightThreeValue'),
          description: t('loginHighlightThreeDescription'),
          tone: 'emerald',
        },
      ]}
    >
      <LoginForm />
    </AuthPanel>
  );
}
