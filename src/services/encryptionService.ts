// Simple encryption service using Web Crypto API for end-to-end encryption
export class EncryptionService {
  private static instance: EncryptionService;

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Derives a key from a password using PBKDF2
   */
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
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
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts text with a password
   */
  async encrypt(plaintext: string, password: string): Promise<{
    encrypted: string;
    salt: string;
    iv: string;
  }> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);
      
      // Generate random salt and IV
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Derive key from password
      const key = await this.deriveKey(password, salt);
      
      // Encrypt the data
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data
      );
      
      // Convert to base64 for storage
      return {
        encrypted: this.arrayBufferToBase64(encryptedData),
        salt: this.arrayBufferToBase64(salt),
        iv: this.arrayBufferToBase64(iv)
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypts text with a password
   */
  async decrypt(
    encryptedText: string,
    password: string,
    salt: string,
    iv: string
  ): Promise<string> {
    try {
      // Convert base64 back to ArrayBuffer
      const encryptedData = this.base64ToArrayBuffer(encryptedText);
      const saltArray = this.base64ToArrayBuffer(salt);
      const ivArray = this.base64ToArrayBuffer(iv);
      
      // Derive key from password
      const key = await this.deriveKey(password, new Uint8Array(saltArray));
      
      // Decrypt the data
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(ivArray) },
        key,
        encryptedData
      );
      
      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data - wrong password or corrupted data');
    }
  }

  /**
   * Validates if a password can decrypt the encrypted data
   */
  async validatePassword(
    encryptedText: string,
    password: string,
    salt: string,
    iv: string
  ): Promise<boolean> {
    try {
      await this.decrypt(encryptedText, password, salt, iv);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generates a secure random password
   */
  generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      password += charset[array[i] % charset.length];
    }
    
    return password;
  }

  /**
   * Utility function to convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Utility function to convert Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
