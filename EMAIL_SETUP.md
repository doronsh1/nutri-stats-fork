# Email Configuration Guide

This guide explains how to configure email notifications for user registration alerts in the NutriStats application.

## Overview

The application sends email notifications to administrators when new users register. This feature uses SMTP to send emails and supports various email providers including Gmail, SendGrid, and other SMTP services.

## Required Environment Variables

Add these variables to your `.env` file:

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Addresses
ADMIN_EMAIL=admin@yourdomain.com
EMAIL_FROM=noreply@yourdomain.com
```

## Configuration Examples

### Gmail Setup

Gmail requires App Passwords when using 2-factor authentication (recommended).

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this 16-character password (not your regular Gmail password)

```bash
# Gmail Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=abcd-efgh-ijkl-mnop  # 16-character app password
ADMIN_EMAIL=admin@yourdomain.com
EMAIL_FROM=your-gmail@gmail.com
```

**Important Gmail Notes:**
- Port 587 uses STARTTLS (recommended)
- Port 465 uses SSL/TLS (also supported)
- App passwords are required when 2FA is enabled
- Less secure app access is deprecated and not recommended

### SendGrid Setup

SendGrid is recommended for production environments.

1. **Create a SendGrid account** at https://sendgrid.com
2. **Generate an API Key**:
   - Go to Settings → API Keys
   - Create API Key with "Mail Send" permissions
   - Copy the generated API key

```bash
# SendGrid Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-sendgrid-api-key-here
ADMIN_EMAIL=admin@yourdomain.com
EMAIL_FROM=noreply@yourdomain.com
```

**SendGrid Benefits:**
- Higher delivery rates
- Better spam filtering
- Detailed analytics
- No daily sending limits (paid plans)
- Dedicated IP options

### AWS SES Setup

Amazon Simple Email Service is another production option.

```bash
# AWS SES Configuration
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
ADMIN_EMAIL=admin@yourdomain.com
EMAIL_FROM=verified-sender@yourdomain.com
```

**AWS SES Requirements:**
- Verify sender email addresses or domains
- Request production access (starts in sandbox mode)
- Configure SMTP credentials in AWS console

### Other SMTP Providers

The application works with any SMTP provider:

```bash
# Generic SMTP Configuration
SMTP_HOST=mail.yourprovider.com
SMTP_PORT=587  # or 465 for SSL
SMTP_USER=your-username
SMTP_PASS=your-password
ADMIN_EMAIL=admin@yourdomain.com
EMAIL_FROM=noreply@yourdomain.com
```

## Configuration Validation

The application validates email configuration on startup and logs the status:

```
Email service configuration status: {
  smtpConfigured: true,
  adminEmailSet: true,
  fromEmailSet: true,
  transporterReady: true
}
```

### Common Configuration Issues

1. **Missing ADMIN_EMAIL**: Notifications will be skipped
   ```
   ADMIN_EMAIL not configured - registration notifications will be skipped
   ```

2. **Missing EMAIL_FROM**: Will use SMTP_USER as sender
   ```
   EMAIL_FROM not configured - using SMTP_USER as sender
   ```

3. **Invalid SMTP credentials**: Email service will be disabled
   ```
   Email service disabled - Missing configuration: host, user, pass
   ```

## Testing Email Configuration

### 1. Check Startup Logs

When the server starts, look for email service initialization messages:

```
Initializing email service...
Email service initialized successfully
Email service configuration status: { ... }
```

### 2. Test Registration

1. Register a new user through the application
2. Check server logs for email sending attempts:
   ```
   Processing async registration notification for user: test@example.com
   Attempting to send email (attempt 1/3) to: admin@yourdomain.com
   Email sent successfully to admin@yourdomain.com. Message ID: <message-id>
   ```

### 3. Manual Testing

You can test email configuration by temporarily adding test code to your application or using the email service directly in a Node.js script.

## Security Best Practices

### 1. Environment Variables
- Never commit email credentials to version control
- Use `.env` files for local development
- Use secure environment variable management in production

### 2. SMTP Security
- Always use TLS/SSL encryption (ports 587 or 465)
- Use app-specific passwords instead of account passwords
- Regularly rotate SMTP credentials

### 3. Email Content
- The application sanitizes user data before including in emails
- Only necessary registration information is included
- No sensitive user data is exposed in notifications

## Troubleshooting

### Gmail Issues

**Problem**: "Username and Password not accepted"
- **Solution**: Enable 2FA and use App Password instead of regular password

**Problem**: "Less secure app access"
- **Solution**: Use App Passwords (Google deprecated less secure app access)

### SendGrid Issues

**Problem**: Authentication failed
- **Solution**: Ensure API key has "Mail Send" permissions and use "apikey" as username

### Network Issues

**Problem**: Connection timeout
- **Solution**: Check if SMTP ports (587, 465) are blocked by firewall
- **Alternative**: Use different port or email provider

### Google Cloud VM Issues

**Problem**: SMTP blocked on Google Cloud
- **Solution**: Google Cloud blocks outbound SMTP on ports 25, 465, 587 by default
- **Workaround**: Use SendGrid, Mailgun, or other email APIs instead of direct SMTP

## Production Recommendations

1. **Use Professional Email Service**:
   - SendGrid, Mailgun, AWS SES, or similar
   - Better deliverability and reliability
   - Detailed analytics and monitoring

2. **Configure Proper DNS**:
   - Set up SPF, DKIM, and DMARC records
   - Use verified sender domains
   - Improves email deliverability

3. **Monitor Email Delivery**:
   - Set up logging and monitoring
   - Track delivery rates and failures
   - Configure alerts for email service issues

4. **Rate Limiting**:
   - Consider implementing rate limiting for registration
   - Prevents email spam from automated registrations
   - Protects email service quotas

## Email Template Customization

The email templates are defined in `src/services/emailService.js`. You can customize:

- **Subject line**: Modify `generateSubject()` method
- **HTML template**: Update `generateHtmlTemplate()` method  
- **Text template**: Update `generateTextTemplate()` method

Example customization:
```javascript
generateSubject(userEmail) {
    return `[NutriStats] New Registration: ${userEmail}`;
}
```

## Disabling Email Notifications

To disable email notifications:

1. **Remove email configuration** from `.env` file
2. **Or set empty values**:
   ```bash
   SMTP_HOST=
   SMTP_USER=
   SMTP_PASS=
   ADMIN_EMAIL=
   ```

The application will detect missing configuration and skip email sending gracefully without affecting user registration.