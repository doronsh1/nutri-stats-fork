# Design Document

## Overview

This design implements a simple email notification system that sends alerts to administrators when new users register. The solution uses nodemailer with SMTP configuration and integrates seamlessly into the existing registration flow in `src/routes/auth.js`. The design prioritizes simplicity, reliability, and minimal impact on the current user registration performance.

## Architecture

### High-Level Flow
1. User completes registration via `/api/auth/register` endpoint
2. After successful user creation, the system triggers an asynchronous email notification
3. Email service attempts to send notification with retry logic
4. Registration completes regardless of email delivery status

### Integration Points
- **Registration Endpoint**: `src/routes/auth.js` - POST `/register` route
- **Email Service**: New service module for handling email operations
- **Configuration**: Environment variables for SMTP and admin email settings
- **Logging**: Enhanced logging for email delivery status and errors

## Components and Interfaces

### 1. Email Service Module (`src/services/emailService.js`)

```javascript
// Core interface
class EmailService {
  async sendRegistrationNotification(userData)
  async sendEmail(to, subject, htmlContent, textContent)
  isConfigured()
}
```

**Responsibilities:**
- SMTP configuration and connection management
- Email template generation for registration notifications
- Retry logic with exponential backoff
- Error handling and logging

### 2. Email Configuration

**Environment Variables:**
- `SMTP_HOST` - SMTP server hostname (e.g., smtp.gmail.com)
- `SMTP_PORT` - SMTP port (587 for TLS, 465 for SSL)
- `SMTP_USER` - SMTP username/email
- `SMTP_PASS` - SMTP password or app-specific password
- `ADMIN_EMAIL` - Email address to receive notifications
- `EMAIL_FROM` - From address for outgoing emails

**Configuration Validation:**
- Check required environment variables on service initialization
- Graceful degradation when email is not configured
- Clear logging when email features are disabled

### 3. Registration Integration

**Modified Registration Flow:**
1. Existing validation and user creation logic (unchanged)
2. **New**: Asynchronous email notification trigger
3. Return success response to user (unchanged)

**Implementation Approach:**
- Use `setImmediate()` or `process.nextTick()` for async email sending
- No await on email operations to avoid blocking registration response
- Comprehensive error handling to prevent email issues from affecting registration

## Data Models

### Email Notification Data Structure

```javascript
{
  userEmail: string,        // New user's email address
  userName: string,         // New user's display name
  registrationTime: string, // ISO timestamp of registration
  userId: string           // UUID of the new user
}
```

### Email Template Structure

**Subject Line:** `New User Registration - [User Email]`

**HTML Content:**
- Clean, simple HTML template
- User information display
- Registration timestamp
- Basic styling for readability

**Text Content:**
- Plain text fallback
- Same information as HTML version
- Formatted for readability

## Error Handling

### Email Service Error Scenarios

1. **SMTP Configuration Missing**
   - Log warning message
   - Skip email sending gracefully
   - Continue normal registration flow

2. **SMTP Connection Failure**
   - Retry up to 3 times with exponential backoff (1s, 2s, 4s)
   - Log each attempt and final failure
   - Do not block registration completion

3. **Email Sending Failure**
   - Retry mechanism with different error handling for different failure types
   - Log detailed error information for debugging
   - Graceful degradation

4. **Invalid Email Configuration**
   - Validate configuration on service startup
   - Log configuration issues clearly
   - Disable email features if configuration is invalid

### Logging Strategy

- **Info Level**: Successful email sends, configuration status
- **Warn Level**: Missing configuration, retry attempts
- **Error Level**: Failed email sends after all retries, configuration errors

## Testing Strategy

### Unit Tests

1. **Email Service Tests**
   - Test email template generation
   - Test configuration validation
   - Test retry logic with mocked failures
   - Test graceful handling of missing configuration

2. **Registration Integration Tests**
   - Test registration flow with email enabled
   - Test registration flow with email disabled
   - Test registration flow with email failures
   - Verify registration still succeeds when email fails

### Integration Tests

1. **SMTP Integration**
   - Test with real SMTP configuration (development environment)
   - Verify email delivery to test accounts
   - Test various SMTP error scenarios

2. **End-to-End Tests**
   - Register new user and verify email notification
   - Test with invalid SMTP configuration
   - Verify registration performance is not impacted

### Manual Testing Checklist

1. Configure SMTP settings in environment
2. Register new user and verify email received
3. Test with invalid SMTP configuration
4. Test with missing admin email configuration
5. Verify registration still works when email service is down

## Implementation Dependencies

### New NPM Packages Required

- **nodemailer** (^6.9.0): SMTP email sending library
- **nodemailer-smtp-transport** (optional): Enhanced SMTP transport

### Configuration Requirements

1. **Environment Variables Setup**
   - Add email configuration to `.env.example`
   - Document SMTP setup process
   - Provide Gmail and SendGrid configuration examples

2. **Google Cloud VM Considerations**
   - Ensure outbound SMTP ports (587, 465) are not blocked
   - Consider using Gmail App Passwords for authentication
   - Alternative: Use SendGrid or other email service APIs

### Security Considerations

1. **SMTP Credentials**
   - Store in environment variables, never in code
   - Use app-specific passwords for Gmail
   - Consider using OAuth2 for enhanced security

2. **Email Content**
   - Sanitize user data before including in emails
   - Avoid exposing sensitive user information
   - Include only necessary registration details

## Performance Considerations

1. **Asynchronous Processing**
   - Email sending happens after registration response
   - No impact on registration API response time
   - Use Node.js event loop efficiently

2. **Resource Usage**
   - Minimal memory footprint for email templates
   - Connection pooling for SMTP connections
   - Reasonable timeout values for SMTP operations

3. **Scalability**
   - Current design suitable for moderate registration volumes
   - For high volume, consider queue-based email processing
   - Monitor email sending performance and adjust retry logic as needed