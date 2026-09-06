// app/[lang]/(site)/template.tsx
// A template, not a layout: Next.js remounts it on every navigation, which is
// exactly what a page transition needs. The layout above keeps the header,
// ticker and footer mounted so they never flicker.
import { PageTransition } from '@/components/motion/page-transition';

export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
