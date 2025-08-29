const nodemailer = require('nodemailer');

/**
 * Email service for handling SMTP email operations
 * Provides registration notification functionality with configuration validation
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.isEmailConfigured = false;
    this.adminEmail = process.env.ADMIN_EMAIL;
    this.fromEmail = process.env.EMAIL_FROM;

    this.initializeTransporter();
  }

  /**
   * Initialize SMTP transporter with environment configuration
   * Validates required configuration and sets up nodemailer transport
   */
  initializeTransporter() {
    const requiredConfig = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    };

    // Check if all required SMTP configuration is present
    const missingConfig = Object.entries(requiredConfig)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingConfig.length > 0) {
      console.warn(`Email service disabled - Missing configuration: ${missingConfig.join(', ')}`);
      this.isEmailConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: requiredConfig.host,
        port: parseInt(requiredConfig.port),
        secure: parseInt(requiredConfig.port) === 465, // true for 465, false for other ports
        auth: {
          user: requiredConfig.user,
          pass: requiredConfig.pass
        }
      });

      this.isEmailConfigured = true;
      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error.message);
      this.isEmailConfigured = false;
    }
  }

  /**
   * Check if email service is properly configured
   * @returns {boolean} True if email service is ready to send emails
   */
  isConfigured() {
    return this.isEmailConfigured && this.transporter !== null;
  }

  /**
   * Generate email subject line for registration notification
   * @param {string} userEmail - Email address of the new user
   * @returns {string} Formatted subject line
   */
  generateSubject(userEmail) {
    return `New User Registration - ${userEmail}`;
  }

  /**
   * Generate HTML email template for registration notification
   * @param {Object} userData - User registration data
   * @param {string} userData.userEmail - User's email address
   * @param {string} userData.userName - User's display name
   * @param {string} userData.registrationTime - ISO timestamp of registration
   * @param {string} userData.userId - UUID of the new user
   * @returns {string} HTML email content
   */
  generateHtmlTemplate(userData) {
    const { userEmail, userName, registrationTime, userId } = userData;
    const formattedDate = new Date(registrationTime).toLocaleString();

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New User Registration</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .content { background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .info-row { margin: 10px 0; }
        .label { font-weight: bold; color: #555; }
        .value { color: #333; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>New User Registration Notification</h2>
        </div>
        <div class="content">
            <p>A new user has successfully registered with the application.</p>
            
            <div class="info-row">
                <span class="label">Email:</span> 
                <span class="value">${userEmail}</span>
            </div>
            
            <div class="info-row">
                <span class="label">Name:</span> 
                <span class="value">${userName || 'Not provided'}</span>
            </div>
            
            <div class="info-row">
                <span class="label">Registration Time:</span> 
                <span class="value">${formattedDate}</span>
            </div>
            
            <div class="info-row">
                <span class="label">User ID:</span> 
                <span class="value">${userId}</span>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate plain text email template for registration notification
   * @param {Object} userData - User registration data
   * @param {string} userData.userEmail - User's email address
   * @param {string} userData.userName - User's display name
   * @param {string} userData.registrationTime - ISO timestamp of registration
   * @param {string} userData.userId - UUID of the new user
   * @returns {string} Plain text email content
   */
  generateTextTemplate(userData) {
    const { userEmail, userName, registrationTime, userId } = userData;
    const formattedDate = new Date(registrationTime).toLocaleString();

    return `
NEW USER REGISTRATION NOTIFICATION

A new user has successfully registered with the application.

User Details:
- Email: ${userEmail}
- Name: ${userName || 'Not provided'}
- Registration Time: ${formattedDate}
- User ID: ${userId}

This is an automated notification from the user registration system.
`;
  }

  /**
   * Send email with retry logic and exponential backoff
   * @param {string} to - Recipient email address
   * @param {string} subject - Email subject line
   * @param {string} htmlContent - HTML email content
   * @param {string} textContent - Plain text email content
   * @param {number} attempt - Current attempt number (for internal use)
   * @returns {Promise<boolean>} True if email sent successfully, false otherwise
   */
  async sendEmail(to, subject, htmlContent, textContent, attempt = 1) {
    const maxAttempts = 3;

    if (!this.isConfigured()) {
      console.warn('Email service not configured - skipping email send');
      return false;
    }

    if (!to) {
      console.error('Cannot send email - recipient address is required');
      return false;
    }

    const fromAddress = this.fromEmail || process.env.SMTP_USER;

    const mailOptions = {
      from: fromAddress,
      to: to,
      subject: subject,
      html: htmlContent,
      text: textContent
    };

    try {
      console.log(`Attempting to send email (attempt ${attempt}/${maxAttempts}) to: ${to}`);

      const info = await this.transporter.sendMail(mailOptions);

      console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
      return true;

    } catch (error) {
      console.error(`Email send attempt ${attempt} failed:`, {
        error: error.message,
        code: error.code,
        recipient: to,
        subject: subject
      });

      // If we haven't reached max attempts, retry with exponential backoff
      if (attempt < maxAttempts) {
        const backoffDelay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.log(`Retrying email send in ${backoffDelay}ms (attempt ${attempt + 1}/${maxAttempts})`);

        await this.delay(backoffDelay);
        return this.sendEmail(to, subject, htmlContent, textContent, attempt + 1);
      } else {
        console.error(`All ${maxAttempts} email send attempts failed for ${to}:`, error.message);
        return false;
      }
    }
  }

  /**
   * Utility method to create a delay for retry logic
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after the delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Send registration notification email to admin
   * Composes and sends email notification when a new user registers
   * @param {Object} userData - User registration data
   * @param {string} userData.userEmail - User's email address
   * @param {string} userData.userName - User's display name
   * @param {string} userData.registrationTime - ISO timestamp of registration
   * @param {string} userData.userId - UUID of the new user
   * @returns {Promise<boolean>} True if notification sent successfully, false otherwise
   */
  async sendRegistrationNotification(userData) {
    // Validate required user data
    if (!userData || !userData.userEmail || !userData.userId) {
      console.error('Cannot send registration notification - missing required user data:', {
        hasUserData: !!userData,
        hasEmail: !!(userData && userData.userEmail),
        hasUserId: !!(userData && userData.userId)
      });
      return false;
    }

    // Check if admin email is configured
    if (!this.adminEmail) {
      console.warn('Registration notification skipped - ADMIN_EMAIL not configured');
      return false;
    }

    // Check if email service is configured
    if (!this.isConfigured()) {
      console.warn('Registration notification skipped - email service not configured');
      return false;
    }

    try {
      // Ensure registration time is set
      const notificationData = {
        userEmail: userData.userEmail,
        userName: userData.userName || userData.userEmail.split('@')[0], // Fallback to email prefix if no name
        registrationTime: userData.registrationTime || new Date().toISOString(),
        userId: userData.userId
      };

      // Generate email content
      const subject = this.generateSubject(notificationData.userEmail);
      const htmlContent = this.generateHtmlTemplate(notificationData);
      const textContent = this.generateTextTemplate(notificationData);

      console.log(`Sending registration notification for user: ${notificationData.userEmail} (ID: ${notificationData.userId})`);

      // Send the notification email
      const success = await this.sendEmail(
        this.adminEmail,
        subject,
        htmlContent,
        textContent
      );

      if (success) {
        console.log(`Registration notification sent successfully for user: ${notificationData.userEmail}`);
      } else {
        console.error(`Failed to send registration notification for user: ${notificationData.userEmail}`);
      }

      return success;

    } catch (error) {
      console.error('Error in sendRegistrationNotification:', {
        error: error.message,
        userEmail: userData.userEmail,
        userId: userData.userId
      });
      return false;
    }
  }

  /**
   * Send registration notification asynchronously without blocking the calling process
   * Uses setImmediate() to ensure email processing happens after registration response
   * Ensures email failures don't affect registration completion
   * @param {Object} userData - User registration data
   * @param {string} userData.userEmail - User's email address
   * @param {string} userData.userName - User's display name
   * @param {string} userData.registrationTime - ISO timestamp of registration
   * @param {string} userData.userId - UUID of the new user
   */
  sendRegistrationNotificationAsync(userData) {
    // Use setImmediate to defer email processing until after the current event loop phase
    // This ensures the registration response is sent before email processing begins
    setImmediate(async () => {
      try {
        console.log(`Processing async registration notification for user: ${userData.userEmail}`);

        // Call the synchronous notification method
        await this.sendRegistrationNotification(userData);

      } catch (error) {
        // Catch and log any errors to prevent them from affecting the registration flow
        // Email failures should never impact user registration completion
        console.error('Async registration notification failed:', {
          error: error.message,
          stack: error.stack,
          userEmail: userData.userEmail,
          userId: userData.userId
        });
      }
    });

    // Log that async processing has been queued
    console.log(`Async registration notification queued for user: ${userData.userEmail}`);
  }

  /**
   * Alternative async method using process.nextTick for even higher priority scheduling
   * Can be used when immediate processing after I/O events is preferred
   * @param {Object} userData - User registration data
   */
  sendRegistrationNotificationNextTick(userData) {
    // Use process.nextTick to schedule email processing at the end of the current phase
    // This has higher priority than setImmediate but still allows registration response to complete
    process.nextTick(async () => {
      try {
        console.log(`Processing nextTick registration notification for user: ${userData.userEmail}`);

        await this.sendRegistrationNotification(userData);

      } catch (error) {
        console.error('NextTick registration notification failed:', {
          error: error.message,
          stack: error.stack,
          userEmail: userData.userEmail,
          userId: userData.userId
        });
      }
    });

    console.log(`NextTick registration notification queued for user: ${userData.userEmail}`);
  }

  /**
   * Validate email configuration on startup
   * Logs configuration status for debugging
   */
  validateConfiguration() {
    const configStatus = {
      smtpConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS),
      adminEmailSet: !!process.env.ADMIN_EMAIL,
      fromEmailSet: !!process.env.EMAIL_FROM,
      transporterReady: this.isConfigured()
    };

    console.log('Email service configuration status:', configStatus);

    if (!configStatus.adminEmailSet) {
      console.warn('ADMIN_EMAIL not configured - registration notifications will be skipped');
    }

    if (!configStatus.fromEmailSet) {
      console.warn('EMAIL_FROM not configured - using SMTP_USER as sender');
    }

    return configStatus;
  }
}

module.exports = EmailService;