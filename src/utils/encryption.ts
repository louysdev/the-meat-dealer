// Utilidades de cifrado para archivos
export class FileEncryption {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12; // 96 bits para AES-GCM

  // Generar una clave de cifrado a partir de una contraseña
  private static async generateKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Cifrar un archivo
  static async encryptFile(file: ArrayBuffer, password: string): Promise<{
    encryptedData: ArrayBuffer;
    salt: Uint8Array;
    iv: Uint8Array;
    originalType: string;
    originalSize: number;
  }> {
    try {
      // Generar salt e IV aleatorios
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

      // Generar clave de cifrado
      const key = await this.generateKey(password, salt);

      // Cifrar el archivo
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        key,
        file
      );

      return {
        encryptedData,
        salt,
        iv,
        originalType: 'application/octet-stream', // Tipo genérico para ocultar el contenido
        originalSize: file.byteLength
      };
    } catch (error) {
      console.error('Error cifrando archivo:', error);
      throw new Error('Error al cifrar el archivo');
    }
  }

  // Descifrar un archivo
  static async decryptFile(
    encryptedData: ArrayBuffer,
    password: string,
    salt: Uint8Array,
    iv: Uint8Array
  ): Promise<ArrayBuffer> {
    try {
      // Generar la misma clave de cifrado
      const key = await this.generateKey(password, salt);

      // Descifrar el archivo
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        key,
        encryptedData
      );

      return decryptedData;
    } catch (error) {
      console.error('Error descifrando archivo:', error);
      throw new Error('Error al descifrar el archivo');
    }
  }

  // Convertir ArrayBuffer a base64 para almacenamiento
  static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Convertir base64 a ArrayBuffer
  static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Convertir Uint8Array a base64
  static uint8ArrayToBase64(array: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < array.byteLength; i++) {
      binary += String.fromCharCode(array[i]);
    }
    return btoa(binary);
  }

  // Convertir base64 a Uint8Array
  static base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

// Generar una contraseña de cifrado única para cada perfil
export const generateProfileEncryptionKey = (profileId: string): string => {
  // Combinar el ID del perfil con una clave maestra
  const masterKey = 'meatdealer_encryption_master_key_2025';
  return `${masterKey}_${profileId}_${Date.now()}`;
};

// Metadata de archivo cifrado
export interface EncryptedFileMetadata {
  salt: string; // base64
  iv: string; // base64
  originalType: string;
  originalSize: number;
  encryptionKey: string; // Clave específica del perfil
}