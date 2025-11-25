import QRCode from 'qrcode';

/**
 * QRService
 *
 * Servicio encargado de generar códigos QR para dispositivos frecuentes.
 * Los códigos QR contienen URLs que permiten hacer check-in/check-out
 * de forma rápida escaneando el código.
 */
export class QRService {
  /**
   * Genera un código QR como Data URL (base64)
   *
   * @param url URL que se codificará en el QR
   * @param options Opciones de configuración del QR
   * @returns Promise con el código QR en formato Data URL
   */
  static async generateQRCodeDataURL(
    url: string,
    options?: {
      width?: number;
      margin?: number;
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
      color?: {
        dark?: string;
        light?: string;
      };
    }
  ): Promise<string> {
    try {
      const defaultOptions = {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'M' as const,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      };

      const mergedOptions = { ...defaultOptions, ...options };

      return await QRCode.toDataURL(url, mergedOptions);
    } catch (error) {
      throw new Error(`Error generando código QR: ${error}`);
    }
  }

  /**
   * Genera un código QR como Buffer (útil para guardar como archivo)
   *
   * @param url URL que se codificará en el QR
   * @param options Opciones de configuración del QR
   * @returns Promise con el código QR como Buffer
   */
  static async generateQRCodeBuffer(
    url: string,
    options?: {
      width?: number;
      margin?: number;
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    }
  ): Promise<Buffer> {
    try {
      const defaultOptions = {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'M' as const
      };

      const mergedOptions = { ...defaultOptions, ...options };

      return await QRCode.toBuffer(url, mergedOptions);
    } catch (error) {
      throw new Error(`Error generando código QR: ${error}`);
    }
  }

  /**
   * Genera códigos QR para check-in y check-out de un dispositivo frecuente
   *
   * @param checkinURL URL para check-in
   * @param checkoutURL URL para check-out
   * @returns Promise con ambos códigos QR en formato Data URL
   */
  static async generateDeviceQRCodes(
    checkinURL: string,
    checkoutURL: string
  ): Promise<{
    checkinQR: string;
    checkoutQR: string;
  }> {
    const [checkinQR, checkoutQR] = await Promise.all([
      this.generateQRCodeDataURL(checkinURL, {
        color: {
          dark: '#10b981', // Verde para check-in
          light: '#FFFFFF'
        }
      }),
      this.generateQRCodeDataURL(checkoutURL, {
        color: {
          dark: '#ef4444', // Rojo para check-out
          light: '#FFFFFF'
        }
      })
    ]);

    return { checkinQR, checkoutQR };
  }
}
