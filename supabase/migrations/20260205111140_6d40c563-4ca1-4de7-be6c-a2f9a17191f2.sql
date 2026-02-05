-- Adicionar novos valores ao enum vendor_category
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'cerimonialista';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'personalizados';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'espaco';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'buffet';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'recreacao';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'foto-filme';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'baloes';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'aluguel';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'churrasqueiro';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'equipes';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'bar';