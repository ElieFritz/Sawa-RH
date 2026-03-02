import { getTranslations } from 'next-intl/server';

import { AuthPanel } from '@/components/auth/auth-panel';
import { RegisterForm } from '@/components/auth/register-form';

export default async function RegisterPage() {
  const t = await getTranslations('Auth');

  return (
    <AuthPanel
      eyebrow={t('registerEyebrow')}
      title={t('registerTitle')}
      description={t('registerDescription')}
      railTitle={t('registerRailTitle')}
      railDescription={t('registerRailDescription')}
      footerNote={t('registerFooterNote')}
      highlights={[
        {
          label: t('registerHighlightOneLabel'),
          value: t('registerHighlightOneValue'),
          description: t('registerHighlightOneDescription'),
          tone: 'amber',
        },
        {
          label: t('registerHighlightTwoLabel'),
          value: t('registerHighlightTwoValue'),
          description: t('registerHighlightTwoDescription'),
          tone: 'sky',
        },
        {
          label: t('registerHighlightThreeLabel'),
          value: t('registerHighlightThreeValue'),
          description: t('registerHighlightThreeDescription'),
          tone: 'emerald',
        },
      ]}
    >
      <RegisterForm />
    </AuthPanel>
  );
}
