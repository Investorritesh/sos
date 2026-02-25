import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Lazy initialization of the Twilio client to prevent build-time crashes with placeholder keys
let client: any = null;

const getTwilioClient = () => {
    if (!client && accountSid && accountSid.startsWith('AC') && authToken) {
        try {
            client = twilio(accountSid, authToken);
        } catch (err) {
            console.error('Failed to initialize Twilio:', err);
        }
    }
    return client;
};

export const sendSMS = async (to: string, message: string) => {
    const twilioClient = getTwilioClient();

    if (!twilioClient) {
        console.warn('Twilio client not initialized. Skipping SMS dispatch.');
        return null;
    }

    try {
        const response = await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to
        });
        return response;
    } catch (error) {
        console.error('Twilio Error:', error);
        throw error;
    }
};
