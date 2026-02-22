"use client"

import Tooltip from './ToolTip'

interface CommissionSelectorProps {
  value: 'violences' | 'ethique' | 'ne_sais_pas'
  onChange: (value: 'violences' | 'ethique' | 'ne_sais_pas') => void
}

export default function CommissionSelector({ value, onChange }: CommissionSelectorProps) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-[var(--blue)]">À qui s'adresse votre signalement ?</h2>
      <div className="space-y-3">
        <label className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-gray-300 cursor-pointer hover:border-[var(--blue)] transition-colors">
          <input
            type="radio"
            name="typeCommission"
            value="violences"
            checked={value === 'violences'}
            onChange={(e) => onChange(e.target.value as 'violences' | 'ethique' | 'ne_sais_pas')}
            className="w-5 h-5 text-[var(--blue)]"
          />
          <div className="flex-1">
            <div className="font-semibold text-lg">🛡️ Commission contre les violences</div>
          </div>
        </label>

        <label className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-gray-300 cursor-pointer hover:border-[var(--blue)] transition-colors">
          <input
            type="radio"
            name="typeCommission"
            value="ethique"
            checked={value === 'ethique'}
            onChange={(e) => onChange(e.target.value as 'violences' | 'ethique' | 'ne_sais_pas')}
            className="w-5 h-5 text-[var(--blue)]"
          />
          <div className="flex-1">
            <div className="font-semibold text-lg">⚖️ Commission d'éthique</div>
          </div>
        </label>

        <label className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-gray-300 cursor-pointer hover:border-[var(--blue)] transition-colors">
          <input
            type="radio"
            name="typeCommission"
            value="ne_sais_pas"
            checked={value === 'ne_sais_pas'}
            onChange={(e) => onChange(e.target.value as 'violences' | 'ethique' | 'ne_sais_pas')}
            className="w-5 h-5 text-[var(--blue)]"
          />
          <div className="flex-1 flex items-center gap-2">
            <div>
              <div className="font-semibold text-lg">❓ Je ne sais pas</div>
            </div>
            <Tooltip content="Nous analyserons votre signalement et le transmettrons à la commission appropriée">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-400 text-white text-xs font-bold">
                i
              </div>
            </Tooltip>
          </div>
        </label>
      </div>
    </div>
  )
}