import { computed } from 'vue';
import { useForm } from 'vee-validate';
import { useRouter } from 'vue-router';

import { getFieldErrorMessage, parseApiError } from '@/lib/api-error';
import { typedRegisterSchema } from '@/schemas/auth.schema';
import { authService } from '@/services/auth.service';

type RegisterFeedback = {
  title: string;
  description: string;
};

export const useRegisterViewModel = () => {
  const router = useRouter();

  const form = useForm({
    validationSchema: typedRegisterSchema,
    initialValues: {
      username: '',
      email: '',
      name: '',
      password: '',
      confirmPassword: '',
      avatarUrl: '',
      job: '',
    },
  });

  const [username, usernameProps] = form.defineField('username');
  const [email, emailProps] = form.defineField('email');
  const [name, nameProps] = form.defineField('name');
  const [password, passwordProps] = form.defineField('password');
  const [confirmPassword, confirmPasswordProps] = form.defineField('confirmPassword');
  const [avatarUrl, avatarUrlProps] = form.defineField('avatarUrl');
  const [job, jobProps] = form.defineField('job');

  const feedback = computed<RegisterFeedback | null>(() => null);

  const passwordChecks = computed(() => {
    const currentPassword = password.value ?? '';

    return [
      {
        label: 'At least 8 characters',
        isMet: currentPassword.length >= 8,
      },
      {
        label: 'At least 1 number',
        isMet: /\d/.test(currentPassword),
      },
      {
        label: 'At least 1 special character',
        isMet: /[^A-Za-z0-9]/.test(currentPassword),
      },
    ];
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      await authService.register({
        username: values.username,
        email: values.email,
        name: values.name,
        password: values.password,
        confirmPassword: values.confirmPassword,
        ...(values.avatarUrl
          ? {
              avatarUrl: values.avatarUrl,
            }
          : {}),
        ...(values.job
          ? {
              job: values.job,
            }
          : {}),
      });

      await router.push({
        name: 'login',
      });
    } catch (error) {
      const parsedError = parseApiError(error);

      if (parsedError.code === 'validation_error' && parsedError.details) {
        form.setErrors({
          username: getFieldErrorMessage(parsedError.details.username),
          email: getFieldErrorMessage(parsedError.details.email),
          name: getFieldErrorMessage(parsedError.details.name),
          password: getFieldErrorMessage(parsedError.details.password),
          confirmPassword: getFieldErrorMessage(parsedError.details.confirmPassword),
          avatarUrl: getFieldErrorMessage(parsedError.details.avatarUrl),
          job: getFieldErrorMessage(parsedError.details.job),
        });
        return;
      }

      if (parsedError.code === 'email_conflict') {
        form.setFieldError('email', 'This email is already registered');
        return;
      }

      if (parsedError.code === 'username_conflict') {
        form.setFieldError('username', 'This username is already taken');
        return;
      }

      if (parsedError.code === 'weak_password') {
        form.setFieldError('password', 'Password does not match the required strength rules');
        return;
      }

      if (parsedError.code === 'password_mismatch') {
        form.setFieldError('confirmPassword', 'Passwords do not match');
        return;
      }

      form.setErrors({
        email: parsedError.message,
      });
    }
  });

  return {
    username,
    usernameProps,
    email,
    emailProps,
    name,
    nameProps,
    password,
    passwordProps,
    confirmPassword,
    confirmPasswordProps,
    avatarUrl,
    avatarUrlProps,
    job,
    jobProps,
    errors: computed(() => form.errors.value),
    isSubmitting: computed(() => form.isSubmitting.value),
    passwordChecks,
    feedback,
    submit,
  };
};
