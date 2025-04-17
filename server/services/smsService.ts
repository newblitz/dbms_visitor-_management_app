import { log } from "../vite";

// This interface would be implemented using an actual SMS gateway in production
export interface ISmsService {
  sendSms(phoneNumber: string, message: string): Promise<boolean>;
  sendVerificationCode(phoneNumber: string, code: string): Promise<boolean>;
  sendVisitorApproval(phoneNumber: string, name: string, host: string): Promise<boolean>;
  sendVisitorRejection(phoneNumber: string, name: string, host: string, reason?: string): Promise<boolean>;
  sendVisitorCheckin(phoneNumber: string, visitorName: string, time: string): Promise<boolean>;
}

// For development purposes, this SMS service simply logs messages
export class DevelopmentSmsService implements ISmsService {
  async sendSms(phoneNumber: string, message: string): Promise<boolean> {
    log(`SMS to ${phoneNumber}: ${message}`, "sms-service");
    return true;
  }

  async sendVerificationCode(phoneNumber: string, code: string): Promise<boolean> {
    const message = `Your verification code is: ${code}. Valid for 10 minutes.`;
    return this.sendSms(phoneNumber, message);
  }

  async sendVisitorApproval(phoneNumber: string, name: string, host: string): Promise<boolean> {
    const message = `Hello ${name}, your visit has been approved by ${host}. Please proceed to the reception desk.`;
    return this.sendSms(phoneNumber, message);
  }

  async sendVisitorRejection(phoneNumber: string, name: string, host: string, reason?: string): Promise<boolean> {
    let message = `Hello ${name}, unfortunately your visit request has been declined by ${host}.`;
    if (reason) {
      message += ` Reason: ${reason}`;
    }
    return this.sendSms(phoneNumber, message);
  }

  async sendVisitorCheckin(phoneNumber: string, visitorName: string, time: string): Promise<boolean> {
    const message = `Visitor ${visitorName} has checked in at ${time}.`;
    return this.sendSms(phoneNumber, message);
  }
}

// In production, implement this with a real SMS gateway like Twilio
export class TwilioSmsService implements ISmsService {
  private accountSid: string;
  private authToken: string;
  private from: string;

  constructor(accountSid: string, authToken: string, from: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.from = from;
  }

  async sendSms(phoneNumber: string, message: string): Promise<boolean> {
    try {
      // In production, use actual Twilio SDK
      log(`SMS via Twilio to ${phoneNumber}: ${message}`, "sms-service");
      
      // Example of how Twilio integration would work
      /*
      const client = require('twilio')(this.accountSid, this.authToken);
      await client.messages.create({
        body: message,
        from: this.from,
        to: phoneNumber
      });
      */
      return true;
    } catch (error) {
      console.error('Error sending SMS via Twilio:', error);
      return false;
    }
  }

  async sendVerificationCode(phoneNumber: string, code: string): Promise<boolean> {
    const message = `Your verification code is: ${code}. Valid for 10 minutes.`;
    return this.sendSms(phoneNumber, message);
  }

  async sendVisitorApproval(phoneNumber: string, name: string, host: string): Promise<boolean> {
    const message = `Hello ${name}, your visit has been approved by ${host}. Please proceed to the reception desk.`;
    return this.sendSms(phoneNumber, message);
  }

  async sendVisitorRejection(phoneNumber: string, name: string, host: string, reason?: string): Promise<boolean> {
    let message = `Hello ${name}, unfortunately your visit request has been declined by ${host}.`;
    if (reason) {
      message += ` Reason: ${reason}`;
    }
    return this.sendSms(phoneNumber, message);
  }

  async sendVisitorCheckin(phoneNumber: string, visitorName: string, time: string): Promise<boolean> {
    const message = `Visitor ${visitorName} has checked in at ${time}.`;
    return this.sendSms(phoneNumber, message);
  }
}

// Create a singleton instance of the SMS service to use throughout the application
export const smsService: ISmsService = new DevelopmentSmsService();

// If environment variables are available, use Twilio
/*
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
  smsService = new TwilioSmsService(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN,
    process.env.TWILIO_PHONE_NUMBER
  );
}
*/