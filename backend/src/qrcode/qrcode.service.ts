import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QrCodeService {
  async generateDataUrl(token: string): Promise<string> {
    return QRCode.toDataURL(token, { errorCorrectionLevel: 'M', margin: 1, width: 300 });
  }
}
