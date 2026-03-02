import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  async sendPasswordResetEmail(email: string, resetLink: string) {
    const subject = 'Reset your SAWA RH password';
    const text = `Reset your password using this link: ${resetLink}`;

    await this.sendMail(email, subject, text);
  }

  async sendVerificationDecisionEmail(
    email: string,
    status: 'APPROVED' | 'REJECTED',
  ) {
    const subject =
      status === 'APPROVED'
        ? 'Your SAWA RH verification has been approved'
        : 'Your SAWA RH verification has been rejected';

    const text =
      status === 'APPROVED'
        ? 'Your profile is now approved. You can sign in and continue.'
        : 'Your profile verification was rejected. Please update your profile and resubmit.';

    await this.sendMail(email, subject, text);
  }

  async sendReviewSubmittedEmail(
    email: string,
    candidateName: string | null,
    cvTitle: string,
  ) {
    const subject = 'Your SAWA RH CV review is ready';
    const text = [
      `Hello${candidateName ? ` ${candidateName}` : ''},`,
      '',
      `A volunteer HR professional has completed the review for your CV "${cvTitle}".`,
      'Sign in to your SAWA RH account to read the feedback.',
    ].join('\n');

    await this.sendMail(email, subject, text);
  }

  private async sendMail(to: string, subject: string, text: string) {
    const from = this.configService.get<string>('SMTP_FROM');
    const host = this.configService.get<string>('SMTP_HOST');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!from || !host || !user || !pass) {
      this.logger.warn(`SMTP not configured, email skipped for ${to}: ${subject}`);
      return;
    }

    const transporter = this.getTransporter();

    await transporter.sendMail({
      from,
      to,
      subject,
      text,
    });
  }

  private getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('SMTP_HOST'),
        port: this.configService.get<number>('SMTP_PORT', 587),
        secure: false,
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });
    }

    return this.transporter;
  }
}
