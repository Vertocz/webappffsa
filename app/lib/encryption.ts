// Module de chiffrement end-to-end pour les signalements
// Utilise WebCrypto API (natif dans les navigateurs)

/**
 * Génère une clé de chiffrement à partir d'une passphrase
 * Cette clé sera stockée dans les variables d'environnement
 */
// La fonction accepte n'importe quel BufferSource (ArrayBuffer ou vue) afin
// d'éviter les incompatibilités de typage entre les définitions de lib.dom.
export async function deriveKey(
  passphrase: string,
  salt: BufferSource
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  return crypto.subtle.deriveKey(
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
  // Générer un salt et un IV aléatoires
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // Dériver la clé
  const key = await deriveKey(passphrase, salt)

  // Encoder le texte
  const encoder = new TextEncoder()
  const data = encoder.encode(plaintext)

  // Chiffrer
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    data
  )

  // Convertir en base64 pour stockage
  return {
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(salt)
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
  // Convertir depuis base64
  const ciphertextBuffer = base64ToArrayBuffer(ciphertext)
  const ivBuffer = base64ToArrayBuffer(iv)
  const saltBuffer = base64ToArrayBuffer(salt)

  // Dériver la clé
  const key = await deriveKey(passphrase, new Uint8Array(saltBuffer))

  // Déchiffrer
  const plaintextBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(ivBuffer)
    },
    key,
    ciphertextBuffer
  )

  // Décoder le texte
  const decoder = new TextDecoder()
  return decoder.decode(plaintextBuffer)
}

/**
 * Chiffre un fichier audio (Blob)
 */
export async function encryptBlob(
  blob: Blob,
  passphrase: string
): Promise<{ encryptedBlob: Blob; iv: string; salt: string }> {
  // Générer salt et IV
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // Dériver la clé
  const key = await deriveKey(passphrase, salt)

  // Lire le blob en ArrayBuffer
  const arrayBuffer = await blob.arrayBuffer()

  // Chiffrer
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    arrayBuffer
  )

  // Créer un nouveau blob chiffré
  const encryptedBlob = new Blob([encryptedBuffer], { type: 'application/octet-stream' })

  return {
    encryptedBlob,
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(salt)
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
  // Convertir depuis base64
  const ivBuffer = base64ToArrayBuffer(iv)
  const saltBuffer = base64ToArrayBuffer(salt)

  // Dériver la clé
  const key = await deriveKey(passphrase, new Uint8Array(saltBuffer))

  // Lire le blob chiffré
  const encryptedBuffer = await encryptedBlob.arrayBuffer()

  // Déchiffrer
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(ivBuffer)
    },
    key,
    encryptedBuffer
  )

  // Retourner le blob déchiffré avec le bon type MIME
  return new Blob([decryptedBuffer], { type: originalType })
}

/**
 * Utilitaires de conversion
 */
// accepte ArrayBuffer ou n'importe quelle vue (Uint8Array, etc.)
function arrayBufferToBase64(buffer: BufferSource): string {
  // convertir en Uint8Array peu importe l'entrée
  let bytes: Uint8Array
  if (buffer instanceof ArrayBuffer) {
    bytes = new Uint8Array(buffer)
  } else {
    // ArrayBufferView
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
  crypto.getRandomValues(array)
  return arrayBufferToBase64(array.buffer)
}