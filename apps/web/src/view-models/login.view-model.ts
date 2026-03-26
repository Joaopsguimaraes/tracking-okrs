import { computed, ref } from 'vue';
import { useForm } from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

import { getFieldErrorMessage, parseApiError } from '@/lib/api-error';
import { getSocialAuthToastContent } from '@/lib/auth-feedback';
import { verificationPendingState } from '@/lib/verification-pending-state';
import { typedLoginSchema } from '@/schemas/auth.schema';
import { authService } from '@/services/auth.service';
import { useSessionStore } from '@/stores/session.store';
import { useToastStore } from '@/stores/toast.store';

type LoginFeedback = {
  title: string;
  description: string;
};

const SOCIAL_ERROR_PARAM = 'social_auth_failed';

export const useLoginViewModel = () => {
  const router = useRouter();
  const route = useRoute();
  const sessionStore = useSessionStore();
  const toastStore = useToastStore();
  const feedback = ref<LoginFeedback | null>(null);
  const unverifiedEmail = ref('');

  const form = useForm({
    validationSchema: typedLoginSchema,
    initialValues: {
      email: '',
      password: '',
    },
  });

  const [email, emailProps] = form.defineField('email');
  const [password, passwordProps] = form.defineField('password');

  const consumeSocialLoginError = async (): Promise<void> => {
    const error = typeof route.query.error === 'string' ? route.query.error : null;

    if (error !== SOCIAL_ERROR_PARAM) {
      return;
    }

    const reason = typeof route.query.reason === 'string' ? route.query.reason : null;
    const toastContent = getSocialAuthToastContent(reason);

    toastStore.push({
      ...toastContent,
      tone: 'error',
    });

    const nextQuery = { ...route.query };
    delete nextQuery.error;
    delete nextQuery.reason;

    await router.replace({
      name: 'login',
      query: nextQuery,
    });
  };

  void consumeSocialLoginError();

  const navigateToVerificationPending = async (): Promise<void> => {
    if (!unverifiedEmail.value) {
      return;
    }

    verificationPendingState.write({
      email: unverifiedEmail.value,
      resendAvailableAt: new Date().toISOString(),
      deliveryStatus: 'sent',
    });

    await router.push({
      name: 'verify-email-pending',
    });
  };

  const submit = form.handleSubmit(async (values) => {
    feedback.value = null;
    unverifiedEmail.value = '';

    try {
      const session = await authService.login(values);
      sessionStore.setUser(session.user);

      await router.push({
        name: 'dashboard',
      });
    } catch (error) {
      const parsedError = parseApiError(error);

      if (parsedError.code === 'validation_error' && parsedError.details) {
        form.setErrors({
          email: getFieldErrorMessage(parsedError.details.email),
          password: getFieldErrorMessage(parsedError.details.password),
        });
        return;
      }

      if (parsedError.code === 'email_not_verified') {
        unverifiedEmail.value = values.email;
        feedback.value = {
          title: 'Verify your email before logging in',
          description:
            'This account exists, but access stays blocked until the verification link is confirmed.',
        };
        return;
      }

      if (parsedError.code === 'invalid_credentials') {
        feedback.value = {
          title: 'Email or password is invalid',
          description: 'Check your credentials and try again.',
        };
        return;
      }

      feedback.value = {
        title: 'Could not complete login',
        description: parsedError.message,
      };
    }
  });

  const loginWithGithub = (): void => {
    window.location.href = authService.getGithubLoginUrl();
  };

  return {
    email,
    emailProps,
    password,
    passwordProps,
    errors: computed(() => form.errors.value),
    isSubmitting: computed(() => form.isSubmitting.value),
    feedback,
    hasUnverifiedAccount: computed(() => Boolean(unverifiedEmail.value)),
    submit,
    loginWithGithub,
    navigateToVerificationPending,
  };
};
