const errorMap: Array<{ key: string; message: string }> = [
  { key: 'Invalid login credentials', message: 'E-mail ou senha incorretos.' },
  { key: 'Email not confirmed', message: 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.' },
  { key: 'User already registered', message: 'Este e-mail já está cadastrado.' },
  { key: 'Password should be at least 6 characters', message: 'A senha deve ter pelo menos 6 caracteres.' },
  { key: 'Email rate limit exceeded', message: 'Muitas tentativas. Aguarde alguns minutos.' },
  { key: 'For security purposes, you can only request this after', message: 'Por segurança, aguarde alguns segundos antes de tentar novamente.' },
  { key: 'New password should be different from the old password', message: 'A nova senha deve ser diferente da senha atual.' },
  { key: 'Unable to validate email address: invalid format', message: 'Formato de e-mail inválido.' },
];

export function translateAuthError(message: string): string {
  const match = errorMap.find((entry) => message.includes(entry.key));
  return match ? match.message : message;
}
