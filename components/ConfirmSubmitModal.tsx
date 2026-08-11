"use client"

interface ConfirmSubmitModalProps {
  typeDepot: 'vocal' | 'ecrit'
  isAnonymous: boolean
  nomPrenom: string
  recordingTime?: number
  onConfirm: () => void
  onCancel: () => void
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m} min ${s} s` : `${s} secondes`
}

export default function ConfirmSubmitModal({
  typeDepot,
  isAnonymous,
  nomPrenom,
  recordingTime = 0,
  onConfirm,
  onCancel,
}: ConfirmSubmitModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-6">

        <div className="text-center">
          <div className="text-4xl mb-3">📋</div>
          <h2 className="text-2xl font-bold text-[var(--blue)]">
            Confirmer votre signalement
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Vérifiez les informations avant d&apos;envoyer
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-500 font-medium">Format</span>
            <span className="font-semibold text-gray-800">
              {typeDepot === 'vocal'
                ? `🎤 Message vocal (${formatDuration(recordingTime)})`
                : '✍️ Message écrit'}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-500 font-medium">Identité</span>
            <span className="font-semibold text-gray-800">
              {isAnonymous
                ? '👤 Anonyme'
                : nomPrenom || 'Identifié (nom non renseigné)'}
            </span>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
          🔒 Votre signalement sera <strong>chiffré</strong> avant envoi.
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:border-gray-400 transition-colors"
          >
            ← Modifier
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 rounded-xl bg-[var(--yellow)] text-white font-bold hover:bg-[var(--red)] transition-colors shadow-lg"
          >
            Envoyer →
          </button>
        </div>
      </div>
    </div>
  )
}