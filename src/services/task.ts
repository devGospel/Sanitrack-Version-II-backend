import * as qrcode from 'qrcode';
import jsQR from 'jsqr';
import Jimp from 'jimp';

// Function to generate a QR code with the required data
const generateQRCode = async (data: string): Promise<any> => {
    try {
        const qrCode = await qrcode.toDataURL(data);
        return {
            status: true,
            data: qrCode
        };
    } catch (error) {
        console.error('Error generating QR code:', error);
        return {
            status: false,
            message: 'Error generating QR code',
        }
    }
};

// Function to decode a QR code
const decodeQRCode = async(data: any): Promise<any> => {
    try {
        const qrBuffer = Buffer.from(data.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
        
        const image = await Jimp.read(qrBuffer);
    
        // Get the image data
        const imageData = {
            data: new Uint8ClampedArray(image.bitmap.data),
            width: image.bitmap.width,
            height: image.bitmap.height,
        };

        // Use jsQR to decode the QR code
        const decodedQR = jsQR(imageData.data, imageData.width, imageData.height);

        if (!decodedQR) {
            return {
                status: false,
                message: 'Failed to decode QR code.',
            };
        }
        return {
            status: true,
            data: decodedQR.data
        };

    } catch (error) {
        return {
            status: false,
            message: 'Error decoding QR code',
        }
    }
};

export default {
    generateQRCode,   
    decodeQRCode,
};