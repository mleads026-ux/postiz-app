import type { Metadata } from 'next';
import { ViralStudio } from '@gitroom/frontend/components/viral-studio/viral-studio';

export const metadata: Metadata = {
  title: 'Viral Title Studio | Postiz',
  description: 'Create platform-specific Arabic video hooks, titles, captions, and hashtags.',
};

export default function ViralStudioPage() {
  return <ViralStudio />;
}
