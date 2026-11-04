import { redirect } from 'next/navigation';

/**
 * Legacy route kept only to forward existing bookmarks to the new unified auth page.
 */
export default function StudentResetPasswordRedirect() {
  redirect('/student/auth');
}
