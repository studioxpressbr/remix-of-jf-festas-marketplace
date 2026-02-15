export const VENDOR_CATEGORIES = [
  { value: 'confeitaria', label: 'Confeitaria', emoji: '🎂' },
  { value: 'doces', label: 'Doces', emoji: '🍬' },
  { value: 'salgados', label: 'Salgados', emoji: '🥟' },
  { value: 'decoracao', label: 'Decoração', emoji: '🎈' },
  { value: 'buffet', label: 'Buffet', emoji: '🍽️' },
  { value: 'cerimonialista', label: 'Cerimonialista', emoji: '👰' },
  { value: 'personalizados', label: 'Personalizados', emoji: '🎁' },
  { value: 'espaco', label: 'Espaço para Festas', emoji: '🏠' },
  { value: 'recreacao', label: 'Recreação', emoji: '🎪' },
  { value: 'foto-filme', label: 'Foto e Filme', emoji: '📸' },
  { value: 'baloes', label: 'Balões', emoji: '🎈' },
  { value: 'aluguel', label: 'Aluguel', emoji: '🪑' },
  { value: 'churrasqueiro', label: 'Churrasqueiro', emoji: '🍖' },
  { value: 'equipes', label: 'Equipes', emoji: '👥' },
  { value: 'bar', label: 'Bar e Bartender', emoji: '🍹' },
  { value: 'outros', label: 'Outros', emoji: '✨' },
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  confeitaria: 'bg-coral-light/30 text-coral-dark',
  doces: 'bg-sage-light text-accent-foreground',
  salgados: 'bg-champagne text-secondary-foreground',
  decoracao: 'bg-coral-light/20 text-coral-dark',
  buffet: 'bg-amber-100 text-amber-800',
  cerimonialista: 'bg-pink-100 text-pink-800',
  personalizados: 'bg-purple-100 text-purple-800',
  espaco: 'bg-blue-100 text-blue-800',
  recreacao: 'bg-orange-100 text-orange-800',
  'foto-filme': 'bg-slate-100 text-slate-800',
  baloes: 'bg-red-100 text-red-800',
  aluguel: 'bg-stone-100 text-stone-800',
  churrasqueiro: 'bg-rose-100 text-rose-800',
  equipes: 'bg-indigo-100 text-indigo-800',
  bar: 'bg-teal-100 text-teal-800',
  outros: 'bg-muted text-muted-foreground',
};

export const MEI_PLAN_PRICE = 99; // R$ 99/year
export const EMPRESARIAL_PLAN_PRICE = 499; // R$ 499/year
export const LEAD_PRICE = 2; // R$ 2/lead

// Stripe Product & Price IDs
export const STRIPE_MEI_PLAN = {
  priceId: 'price_1StuHiRDc1lDOFiCCvZkwhg9',
  productId: 'prod_TrdYUtmHlctYqF',
  label: 'Plano MEI',
};

export const STRIPE_EMPRESARIAL_PLAN = {
  priceId: 'price_1T1Dy9RDc1lDOFiCBOwBhCrW',
  productId: 'prod_TyKj9SRXANiUjY',
  label: 'Plano Empresarial',
};

export const STRIPE_LEAD_CREDITS = {
  priceId: 'price_1StuLVRDc1lDOFiCfmHwuIrg',
  productId: 'prod_Trdc7wGUjzkUS8',
};

// Vendor type labels
export const VENDOR_TYPE_LABELS: Record<string, string> = {
  mei: 'MEI',
  empresarial: 'Empresarial',
};
