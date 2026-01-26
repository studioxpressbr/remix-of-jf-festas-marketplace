export const VENDOR_CATEGORIES = [
  { value: 'confeitaria', label: 'Confeitaria', emoji: '🎂' },
  { value: 'doces', label: 'Doces', emoji: '🍬' },
  { value: 'salgados', label: 'Salgados', emoji: '🥟' },
  { value: 'decoracao', label: 'Decoração', emoji: '🎈' },
  { value: 'outros', label: 'Outros', emoji: '✨' },
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  confeitaria: 'bg-coral-light/30 text-coral-dark',
  doces: 'bg-sage-light text-accent-foreground',
  salgados: 'bg-champagne text-secondary-foreground',
  decoracao: 'bg-coral-light/20 text-coral-dark',
  outros: 'bg-muted text-muted-foreground',
};

export const SUBSCRIPTION_PRICE = 99; // R$ 99/year
export const LEAD_PRICE = 2; // R$ 2/lead
