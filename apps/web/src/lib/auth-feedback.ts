const SOCIAL_AUTH_ERROR_TITLE =
  'Nao foi possivel realizar o login social selecionado, por favor realize o cadastro na plataforma';

const socialAuthReasonDescriptionMap = {
  email_conflict: 'Ja existe uma conta com este email. Entre com email e senha para continuar.',
  missing_email: 'O GitHub nao forneceu um email utilizavel para concluir o acesso.',
  unknown: 'Ocorreu uma falha inesperada ao concluir o login social.',
} as const;

export const getSocialAuthToastContent = (reason: string | null | undefined) => ({
  title: SOCIAL_AUTH_ERROR_TITLE,
  description:
    socialAuthReasonDescriptionMap[
      (reason ?? 'unknown') as keyof typeof socialAuthReasonDescriptionMap
    ],
});
