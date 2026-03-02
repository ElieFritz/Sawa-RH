import { getTranslations } from 'next-intl/server';

import { AuthPanel } from '@/components/auth/auth-panel';
import { OnboardingProfileForm } from '@/components/auth/onboarding-profile-form';

export default async function OnboardingProfilePage() {
  const t = await getTranslations('Onboarding');

  return (
    <AuthPanel
      eyebrow={t('eyebrow')}
      title={t('title')}
      description={t('description')}
      railTitle={t('railTitle')}
      railDescription={t('railDescription')}
      footerNote={t('footerNote')}
      highlights={[
        {
          label: t('highlightOneLabel'),
          value: t('highlightOneValue'),
          description: t('highlightOneDescription'),
          tone: 'amber',
        },
        {
          label: t('highlightTwoLabel'),
          value: t('highlightTwoValue'),
          description: t('highlightTwoDescription'),
          tone: 'sky',
        },
        {
          label: t('highlightThreeLabel'),
          value: t('highlightThreeValue'),
          description: t('highlightThreeDescription'),
          tone: 'emerald',
        },
      ]}
    >
      <OnboardingProfileForm />
    </AuthPanel>
  );
}
