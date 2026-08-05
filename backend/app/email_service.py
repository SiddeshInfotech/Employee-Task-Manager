import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

logger = logging.getLogger(__name__)


def send_welcome_email(
    to_email: str,
    username: str,
    password: str,
    role: str
) -> bool:
    """
    Send a welcome email to the newly added employee
    with their login credentials via Gmail SMTP.
    Returns True if sent successfully, False otherwise.
    """

    if not settings.SMTP_EMAIL or not settings.SMTP_PASSWORD:
        logger.warning(
            "SMTP credentials not configured. "
            "Skipping email for %s", to_email
        )
        return False

    subject = f"Welcome to {settings.PROJECT_NAME}!"

    html_body = f"""
    <html>
    <body style="margin:0; padding:0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f0f4f8;">
      <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
            Welcome to the Team! 🎉
          </h1>
          <p style="color: rgba(255,255,255,0.85); margin: 10px 0 0; font-size: 15px;">
            {settings.PROJECT_NAME}
          </p>
        </div>

        <!-- Body -->
        <div style="padding: 35px 30px;">
          <p style="font-size: 16px; color: #334155; margin: 0 0 20px;">
            Hello <strong>{username}</strong>,
          </p>
          <p style="font-size: 14px; color: #475569; line-height: 1.7; margin: 0 0 25px;">
            You have been added to the <strong>{settings.PROJECT_NAME}</strong> system
            by the administrator. Below are your login credentials to access the platform.
          </p>

          <!-- Credentials Card -->
          <div style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 0 0 25px;">
            <h3 style="margin: 0 0 16px; font-size: 15px; color: #1e3a8a; font-weight: 700;">
              🔐 Your Login Credentials
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600;">Username:</td>
                <td style="padding: 8px 0; font-size: 14px; color: #0f172a; font-weight: 700;">{username}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600;">Password:</td>
                <td style="padding: 8px 0; font-size: 14px; color: #0f172a; font-weight: 700;">{password}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600;">Role:</td>
                <td style="padding: 8px 0; font-size: 14px; color: #0f172a; font-weight: 700;">{role}</td>
              </tr>
            </table>
          </div>

          <!-- Warning -->
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 0 8px 8px 0; margin: 0 0 25px;">
            <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.6;">
              ⚠️ <strong>Important:</strong> Please change your password after your first login
              for security purposes.
            </p>
          </div>

          <p style="font-size: 14px; color: #475569; line-height: 1.7; margin: 0;">
            If you have any questions, please contact your administrator.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 30px; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">
            © 2026 {settings.PROJECT_NAME} | All Rights Reserved
          </p>
          <p style="margin: 6px 0 0; font-size: 11px; color: #cbd5e1;">
            This is an automated message. Please do not reply.
          </p>
        </div>

      </div>
    </body>
    </html>
    """

    # Build the email message
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{settings.PROJECT_NAME} <{settings.SMTP_EMAIL}>"
    message["To"] = to_email

    # Plain text fallback
    plain_text = (
        f"Welcome to {settings.PROJECT_NAME}!\n\n"
        f"Hello {username},\n\n"
        f"You have been added to the system.\n\n"
        f"Your Login Credentials:\n"
        f"  Username: {username}\n"
        f"  Password: {password}\n"
        f"  Role: {role}\n\n"
        f"Please change your password after your first login.\n\n"
        f"- {settings.PROJECT_NAME} Team"
    )

    message.attach(MIMEText(plain_text, "plain"))
    message.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(
            settings.SMTP_HOST,
            settings.SMTP_PORT
        ) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(
                settings.SMTP_EMAIL,
                settings.SMTP_PASSWORD
            )
            server.sendmail(
                settings.SMTP_EMAIL,
                to_email,
                message.as_string()
            )

        logger.info(
            "Welcome email sent successfully to %s",
            to_email
        )
        return True

    except smtplib.SMTPAuthenticationError:
        logger.error(
            "SMTP authentication failed. Check your "
            "SMTP_EMAIL and SMTP_PASSWORD (App Password)."
        )
        return False

    except smtplib.SMTPException as e:
        logger.error(
            "Failed to send email to %s: %s",
            to_email, str(e)
        )
        return False

    except Exception as e:
        logger.error(
            "Unexpected error sending email to %s: %s",
            to_email, str(e)
        )
        return False
