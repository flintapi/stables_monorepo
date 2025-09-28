import crypto from "crypto"

export class Generator {

    private static readonly DEFAULT_LENGTH = 46;
    private static readonly ALLOWED_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    static async generateUniqueAPIKey(prefix: string, length: number): Promise<string> {

        if (length < Generator.DEFAULT_LENGTH) {
            throw new Error('API key length must be at least 16 characters');
        }

        const generateRandomPart = (remainingLength: number): string => {
            const randomBytes = crypto.randomBytes(remainingLength);
            let result = '';

            for (let i = 0; i < remainingLength; i++) {
                result += Generator.ALLOWED_CHARACTERS[randomBytes[i] % Generator.ALLOWED_CHARACTERS.length];
            }

            const totalLength = prefix.length + 1 + result.length;
            if (totalLength < length) {
                return result + generateRandomPart(length - totalLength);
            }

            return result;
        };

        const generateAndCheckKey = async (): Promise<string> => {
            const randomPart = generateRandomPart(length - prefix.length - 1);
            const apiKey = `${prefix}_${randomPart}`;


            return apiKey;
        };

        return generateAndCheckKey();
    }
}
