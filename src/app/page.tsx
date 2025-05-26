
import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to the main dashboard, assuming it's under the (app) group.
  redirect('/dashboard'); 
  // Or, if your dashboard is at the root of (app) group, it would be just '/'
  // but since we are using (app) group, it is better to be explicit.
  // Let's assume the dashboard is / or /dashboard within the (app) group.
  // The (app)/page.tsx will serve as the dashboard.
  // So, redirecting to the root path should implicitly load (app)/page.tsx if it exists.
  // No, this redirect needs to be to a page INSIDE the (app) group, if this page.tsx is OUTSIDE.
  // The new structure is src/app/(app)/page.tsx for dashboard.
  // So, this root page.tsx should redirect to just '/'.
  // Next.js will then pick up (app)/page.tsx.
  redirect('/');
}
