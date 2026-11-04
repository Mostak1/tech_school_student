'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import { toast } from 'sonner';

import AuthForm, {
  AuthFormData,
} from '@/components/features/student/auth/AuthForm';
import { useStudentLogin } from '@/lib/api/student';
import { studentForgotPassword } from '@/lib/api/student/functions';
import { safeApiCall } from '@/lib/api/student/responseHandler';
import { useFCMToken } from '@/lib/firebase/useFCMToken';
import { RootState } from '@/components/store';
import { useSystemBranding } from '@/lib/api/student/queryHooks';
import { useLanguage } from '@/components/hooks/useLanguage';

type FormType = 'login' | 'reset-password';

/**
 * StudentAuthPage
 * Centralizes login + reset-password on "/student/auth" and optional "/student/auth/[schoolCode]"
 * Automatically locks the school code field when it is provided via the URL.
 */
export default function StudentAuthPage() {
  const router = useRouter();
  const params = useParams<{ schoolCode?: string[] }>();
  const searchParams = useSearchParams();
  const { translations } = useLanguage();

  // Prepare every path segment so we can understand whether the user visited
  // /student/auth, /student/auth/reset-password, or /student/auth/SCH123 etc.
  const pathname = usePathname();


  let effectiveSegments: string[] = [];

  if (Array.isArray(params?.schoolCode) && params.schoolCode.length > 0) {
    effectiveSegments = params.schoolCode;
  } else if (pathname) {
    const pathParts = pathname.split('/').filter(Boolean);
    const authIndex = pathParts.findIndex(
      (p: string) => p.toLowerCase() === 'auth',
    );
    if (authIndex !== -1 && authIndex < pathParts.length - 1) {
      effectiveSegments = pathParts.slice(authIndex + 1);
    }
  }

  const sanitizedSegments = effectiveSegments.filter(Boolean);
  const viewSegment = sanitizedSegments.find((segment) => {
    const lowered = segment.toLowerCase();
    return lowered === 'login' || lowered === 'reset-password';
  });
  const codeSegment = sanitizedSegments.find((segment) => {
    const lowered = segment.toLowerCase();
    return lowered !== 'login' && lowered !== 'reset-password';
  });
  const normalizedSchoolCode = codeSegment?.trim() || undefined;

  // Track URL driven seating for UI switching (login is default view).
  const viewFromQuery = (searchParams.get('view') || '').toLowerCase();
  const urlRequestedForm: FormType =
    viewFromQuery === 'reset' ||
    viewFromQuery === 'reset-password' ||
    viewSegment === 'reset-password'
      ? 'reset-password'
      : 'login';
  const [formType, setFormType] = useState<FormType>(urlRequestedForm);
  const {
    data: brandingResponse,
    isLoading: isBrandingLoading,
    error: brandingError,
  } = useSystemBranding(normalizedSchoolCode);
  const branding = useMemo(() => {
    if (!brandingResponse || brandingResponse.error) {
      return {};
    }
    const data = brandingResponse.data || {};
    return {
      logoSrc: data.horizontal_logo || data.vertical_logo,
      themeColor: data.theme_color,
      rightImageSrc: data.student_web_background_image,
      // Extract privacy policy and terms links from system settings
      privacyPolicyLink: data.student_parent_privacy_policy,
      termsLink: data.student_terms_condition,
    };
  }, [brandingResponse]);
  const resolvedLogo =
    !isBrandingLoading && branding.logoSrc
      ? branding.logoSrc
      : '/assets/images/common/logo.png';
  const resolvedThemeColor =
    !isBrandingLoading && branding.themeColor ? branding.themeColor : undefined;
  const resolvedRightImage =
    !isBrandingLoading && branding.rightImageSrc
      ? branding.rightImageSrc
      : undefined;

  useEffect(() => {
    setFormType(urlRequestedForm);
  }, [urlRequestedForm]);

  useEffect(() => {
    if (brandingError) {
      console.error('[Branding] Failed to load system settings', brandingError);
    }
  }, [brandingError]);

  // Pull Redux student auth state so we can redirect once authenticated.
  const { isAuthenticated } = useSelector(
    (state: RootState) => state.studentAuth,
  );

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/student/dashboard');
    } else {
      // Clear deactivation flag when user reaches login page
      // This allows them to try logging in again
      if (typeof window !== 'undefined') {
        localStorage.removeItem('account_deactivated');
        localStorage.removeItem('deactivation_message');
      }
    }
  }, [isAuthenticated, router]);

  // Mutations + tokens reused from the legacy separate pages.
  const loginMutation = useStudentLogin();
  const {
    token: fcmToken,
    isLoading: isFCMLoading,
    error: fcmError,
    requestToken,
  } = useFCMToken();

  useEffect(() => {
    // console.log('[FCM Debug] StudentAuthPage token snapshot:', {
    //   token: fcmToken ? `${fcmToken.substring(0, 20)}...` : null,
    //   isLoading: isFCMLoading,
    //   error: fcmError?.message ?? null,
    // });
  }, [fcmToken, isFCMLoading, fcmError]);

  // Form state reused for both flows.
  const showDefaultCredentials =
    process.env.NEXT_PUBLIC_SHOW_DEFAULT_CREDENTIALS === 'true';

  const [formData, setFormData] = useState<AuthFormData>({
    schoolCode: showDefaultCredentials
      ? (process.env.NEXT_PUBLIC_DEFAULT_SCHOOL_CODE ?? '')
      : '',
    grNumber: showDefaultCredentials
      ? (process.env.NEXT_PUBLIC_DEFAULT_STUDENT_GR_NUMBER ?? '')
      : '',
    password: showDefaultCredentials
      ? (process.env.NEXT_PUBLIC_DEFAULT_STUDENT_PASSWORD ?? '')
      : '',
    dateOfBirth: undefined,
  });
  const [isResetLoading, setIsResetLoading] = useState(false);

  const isSchoolCodeLocked = Boolean(normalizedSchoolCode);

  useEffect(() => {
    if (normalizedSchoolCode) {
      setFormData((prev) => {
        if (prev.schoolCode === normalizedSchoolCode) {
          return prev;
        }
        return {
          ...prev,
          schoolCode: normalizedSchoolCode,
        };
      });
      return;
    }

    // If code disappears from URL we simply unlock the field (value stays for convenience).
  }, [normalizedSchoolCode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData((prev) => ({
      ...prev,
      dateOfBirth: date,
    }));
  };

  // Submit dispatcher decides which flow should run.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formType === 'login') {
      await handleLoginSubmit();
    } else {
      await handleResetSubmit();
    }
  };

  const handleLoginSubmit = async () => {
    if (!formData.schoolCode || !formData.grNumber || !formData.password) {
      toast.error(
        translations.fillRequiredLoginFields ||
          'Please fill in every required login field',
      );
      return;
    }

    // Try to get FCM token manually if not already available
    // This handles Safari/Firefox where auto-request is blocked
    let currentFcmToken = fcmToken;
    if (!currentFcmToken) {
      // console.log('[FCM] Requesting token on login submit...');
      try {
        currentFcmToken = await requestToken();
      } catch (err) {
        console.error('[FCM] Failed to request token manually:', err);
      }
    }

    console.log('[FCM Debug] Login attempt payload snapshot:', {
      hasToken: Boolean(currentFcmToken),
      tokenLength: currentFcmToken?.length ?? 0,
    });

    const loginData = {
      school_code: formData.schoolCode,
      gr_number: formData.grNumber,
      password: formData.password,
      web_fcm: currentFcmToken || undefined,
    };

    if (currentFcmToken) {
      localStorage.setItem('eschool_fcm_token', currentFcmToken);
    }

    loginMutation.mutate(loginData);
  };

  const handleResetSubmit = async () => {
    if (!formData.schoolCode || !formData.grNumber || !formData.dateOfBirth) {
      toast.error(
        translations.fillRequiredResetFields ||
          'Please fill in every required reset field',
      );
      return;
    }

    setIsResetLoading(true);

    // Format date as YYYY-MM-DD for API submission
    const formattedDate = format(formData.dateOfBirth, 'yyyy-MM-dd');

    const { data: response, error } = await safeApiCall(() =>
      studentForgotPassword({
        gr_no: formData.grNumber,
        dob: formattedDate,
        school_code: formData.schoolCode,
      }),
    );

    setIsResetLoading(false);

    if (error) {
      toast.error(error);
      return;
    }

    // Check if the request was successful
    if (response?.success) {
      // Show success message - if new_password is provided, include it
      const successMessage = response.data?.new_password
        ? `${translations.passwordResetSuccessful || 'Password reset successful! Your new password is:'} ${response.data.new_password}`
        : response?.message ||
          translations.passwordResetRequestSent ||
          'Password reset request sent successfully!';

      toast.success(successMessage, { duration: 10000 });

      // Flip the UI back to login (after letting them read the toast).
      setTimeout(() => {
        router.push(baseAuthPath);
      }, 10000);
    } else {
      // Show error message if request failed
      toast.error(
        response?.message ||
          translations.passwordResetFailed ||
          'Password reset failed',
      );
    }
  };

  // Build strings + button labels without duplicating conditionals in JSX.
  const formCopy = useMemo(() => {
    if (formType === 'login') {
      return {
        title: translations.loginToContinue || 'Log In to Continue',
        description:
          translations.loginDescription ||
          'Log in to your account to manage your profile, check updates, and stay connected with your school.',
        buttonText: translations.logIn || 'Log In',
        buttonLoadingText: translations.loggingIn || 'Logging in...',
      };
    }
    return {
      title: translations.resetYourPassword || 'Reset Your Password',
      description:
        translations.resetPasswordDescription ||
        'Enter your details and date of birth to reset your password.',
      buttonText: translations.resetPassword || 'Reset Password',
      buttonLoadingText:
        translations.resettingPassword || 'Resetting Password...',
    };
  }, [formType, translations]);

  const baseAuthPath = normalizedSchoolCode
    ? `/student/auth/${encodeURIComponent(normalizedSchoolCode)}`
    : '/student/auth';

  const resetPasswordLink = `${baseAuthPath}?view=reset`;
  const loginLink = baseAuthPath;

  return (
    <AuthForm
      formType={formType}
      isSchoolCodeLocked={isSchoolCodeLocked}
      logoSrc={resolvedLogo}
      primaryColor={resolvedThemeColor}
      primaryHoverColor={resolvedThemeColor}
      showImage
      imageSrc={resolvedRightImage}
      imageAlt={translations.authenticationImage || 'Authentication Image'}
      formData={formData}
      onInputChange={handleInputChange}
      onDateChange={
        formType === 'reset-password' ? handleDateChange : undefined
      }
      onSubmit={handleSubmit}
      isLoading={
        formType === 'login' ? loginMutation.isPending : isResetLoading
      }
      title={formCopy.title}
      description={formCopy.description}
      buttonText={formCopy.buttonText}
      buttonLoadingText={formCopy.buttonLoadingText}
      resetPasswordLink={resetPasswordLink}
      loginLink={loginLink}
      // Local toggle keeps the experience single-route while still allowing
      // us to deep-link via query/segments when we need to.
      onFormTypeToggle={(next) => setFormType(next)}
      passwordLabel={translations.password || 'Password'}
      passwordPlaceholder={translations.enterPassword || 'Enter Password'}
      // Pass privacy policy and terms links from system settings
      privacyPolicyLink={branding.privacyPolicyLink}
      termsLink={branding.termsLink}
    />
  );
}
