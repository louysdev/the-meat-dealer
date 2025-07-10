import { supabase } from '../lib/supabase';
import { FileEncryption, generateProfileEncryptionKey, EncryptedFileMetadata } from '../utils/encryption';

export class EncryptedStorageService {
  // Subir archivo cifrado
  static async uploadEncryptedFile(
    file: File,
    profileId: string,
    order: number,
    type: 'photo' | 'video'
  ): Promise<{ url: string; metadata: EncryptedFileMetadata }> {
    try {
      console.log('Iniciando cifrado y subida de archivo:', file.name);

      // Generar clave de cifrado única para este perfil
      const encryptionKey = generateProfileEncryptionKey(profileId);

      // Convertir archivo a ArrayBuffer
      const fileBuffer = await file.arrayBuffer();

      // Cifrar el archivo
      const encryptedResult = await FileEncryption.encryptFile(fileBuffer, encryptionKey);

      // Crear metadata del archivo cifrado
      const metadata: EncryptedFileMetadata = {
        salt: FileEncryption.uint8ArrayToBase64(encryptedResult.salt),
        iv: FileEncryption.uint8ArrayToBase64(encryptedResult.iv),
        originalType: file.type,
        originalSize: file.size,
        encryptionKey: encryptionKey
      };

      // Crear un archivo cifrado con extensión genérica
      const encryptedFile = new File(
        [encryptedResult.encryptedData],
        `encrypted_${order}.dat`, // Extensión genérica
        { type: 'application/octet-stream' }
      );

      // Subir archivo cifrado a Supabase
      const bucket = 'encrypted-files'; // Bucket específico para archivos cifrados
      const fileName = `${profileId}/${type}_${order}_${Date.now()}.dat`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, encryptedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        throw new Error(`Error subiendo archivo cifrado: ${error.message}`);
      }

      // Obtener URL pública del archivo cifrado
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      console.log('Archivo cifrado subido exitosamente:', publicUrl);

      return { url: publicUrl, metadata };
    } catch (error) {
      console.error('Error en uploadEncryptedFile:', error);
      throw error;
    }
  }

  // Descargar y descifrar archivo
  static async downloadAndDecryptFile(
    url: string,
    metadata: EncryptedFileMetadata
  ): Promise<string> {
    try {
      console.log('Descargando y descifrando archivo:', url);

      // Descargar archivo cifrado
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Error descargando archivo cifrado');
      }

      const encryptedData = await response.arrayBuffer();

      // Convertir metadata de base64
      const salt = FileEncryption.base64ToUint8Array(metadata.salt);
      const iv = FileEncryption.base64ToUint8Array(metadata.iv);

      // Descifrar archivo
      const decryptedData = await FileEncryption.decryptFile(
        encryptedData,
        metadata.encryptionKey,
        salt,
        iv
      );

      // Convertir a blob con el tipo original
      const blob = new Blob([decryptedData], { type: metadata.originalType });

      // Crear URL temporal para mostrar el archivo
      const objectUrl = URL.createObjectURL(blob);

      console.log('Archivo descifrado exitosamente');
      return objectUrl;
    } catch (error) {
      console.error('Error en downloadAndDecryptFile:', error);
      throw error;
    }
  }

  // Eliminar archivo cifrado
  static async deleteEncryptedFile(url: string): Promise<void> {
    try {
      // Extraer el path del archivo de la URL
      const urlParts = url.split('/');
      const fileName = urlParts.slice(-2).join('/'); // profileId/filename.dat

      const { error } = await supabase.storage
        .from('encrypted-files')
        .remove([fileName]);

      if (error) {
        console.error('Error eliminando archivo cifrado:', error);
      }
    } catch (error) {
      console.error('Error en deleteEncryptedFile:', error);
    }
  }

  // Limpiar URLs temporales (llamar cuando el componente se desmonte)
  static cleanupTempUrls(urls: string[]): void {
    urls.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  }
}