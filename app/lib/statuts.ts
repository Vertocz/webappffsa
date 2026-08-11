// Libellés et couleurs associés au statut de traitement d'un signalement.
// Centralisés ici pour éviter la duplication entre /suivi et /suivi/[id].

export const STATUT_LABELS: Record<string, string> = {
  non_traite:          'Non traité',
  non_avenu:           'Non avenu',
  transmis_ethique:    "Transmis au comité d'éthique",
  transmis_discipline: 'Transmis à la commission de discipline',
  traite:              'Traité',
}

export const STATUT_BADGE_COLORS: Record<string, string> = {
  non_traite:          'bg-gray-200 text-gray-800',
  non_avenu:           'bg-slate-800 text-slate-300',
  transmis_ethique:    'bg-[var(--yellow)] text-yellow-900',
  transmis_discipline: 'bg-[var(--red)] text-red-100',
  traite:              'bg-green-900 text-green-200',
}

export const STATUT_BORDER_COLORS: Record<string, string> = {
  non_traite:          'border-l-gray-400',
  non_avenu:           'border-l-slate-700',
  transmis_ethique:    'border-l-yellow-500',
  transmis_discipline: 'border-l-red-500',
  traite:              'border-l-green-600',
}

export function getStatutLabel(statut: string): string {
  return STATUT_LABELS[statut] ?? statut
}
