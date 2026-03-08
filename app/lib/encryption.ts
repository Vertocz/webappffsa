// Module de chiffrement end-to-end pour les signalements
// Utilise WebCrypto API (natif dans les navigateurs modernes)

/**
 * Retourne crypto.subtle en s'assurant qu'on est bien côté navigateur.
 * Next.js effectue un SSR même pour les composants "use client" : cette
 * fonction évite que le module crashe pendant ce rendu serveur.
 */
function getSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) {
    throw new Error(
      'WebCrypto API non disponible. Le chiffrement doit être exécuté côté navigateur.'
    )
  }
  return subtle
}

/**
 * Génère une clé de chiffrement à partir d'une passphrase
 */
export async function deriveKey(
  passphrase: string,
  salt: BufferSource
): Promise<CryptoKey> {
  const subtle = getSubtle()
  const encoder = new TextEncoder()

  const passphraseKey = await subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passphraseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Chiffre du texte avec AES-256-GCM
 */
export async function encryptText(
  plaintext: string,
  passphrase: string
): Promise<{ ciphertext: string; iv: string; salt: string }> {
  const subtle = getSubtle()

  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16))
  const iv   = globalThis.crypto.getRandomValues(new Uint8Array(12))
  const key  = await deriveKey(passphrase, salt)

  const encoder = new TextEncoder()
  const ciphertextBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  )

  return {
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    iv:         arrayBufferToBase64(iv),
    salt:       arrayBufferToBase64(salt)
  }
}

/**
 * Déchiffre du texte chiffré
 */
export async function decryptText(
  ciphertext: string,
  iv: string,
  salt: string,
  passphrase: string
): Promise<string> {
  const subtle = getSubtle()

  const ciphertextBuffer = base64ToArrayBuffer(ciphertext)
  const ivBuffer         = base64ToArrayBuffer(iv)
  const saltBuffer       = base64ToArrayBuffer(salt)

  const key = await deriveKey(passphrase, new Uint8Array(saltBuffer))

  const plaintextBuffer = await subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(ivBuffer) },
    key,
    ciphertextBuffer
  )

  return new TextDecoder().decode(plaintextBuffer)
}

/**
 * Chiffre un fichier audio (Blob)
 */
export async function encryptBlob(
  blob: Blob,
  passphrase: string
): Promise<{ encryptedBlob: Blob; iv: string; salt: string }> {
  const subtle = getSubtle()

  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16))
  const iv   = globalThis.crypto.getRandomValues(new Uint8Array(12))
  const key  = await deriveKey(passphrase, salt)

  const arrayBuffer     = await blob.arrayBuffer()
  const encryptedBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    arrayBuffer
  )

  return {
    encryptedBlob: new Blob([encryptedBuffer], { type: 'application/octet-stream' }),
    iv:            arrayBufferToBase64(iv),
    salt:          arrayBufferToBase64(salt)
  }
}

/**
 * Déchiffre un fichier audio
 */
export async function decryptBlob(
  encryptedBlob: Blob,
  iv: string,
  salt: string,
  passphrase: string,
  originalType: string = 'audio/webm'
): Promise<Blob> {
  const subtle = getSubtle()

  const ivBuffer       = base64ToArrayBuffer(iv)
  const saltBuffer     = base64ToArrayBuffer(salt)
  const key            = await deriveKey(passphrase, new Uint8Array(saltBuffer))
  const encryptedBuffer = await encryptedBlob.arrayBuffer()

  const decryptedBuffer = await subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(ivBuffer) },
    key,
    encryptedBuffer
  )

  return new Blob([decryptedBuffer], { type: originalType })
}

// ─── Utilitaires de conversion ─────────────────────────────────────────────

function arrayBufferToBase64(buffer: BufferSource): string {
  let bytes: Uint8Array
  if (buffer instanceof ArrayBuffer) {
    bytes = new Uint8Array(buffer)
  } else {
    const view = buffer as ArrayBufferView
    bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
  }

  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Génère une passphrase forte (à faire une seule fois et stocker en env)
 */
export function generatePassphrase(): string {
  const array = new Uint8Array(32)
  globalThis.crypto.getRandomValues(array)
  return arrayBufferToBase64(array.buffer)
}