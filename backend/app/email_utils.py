import smtplib
import threading
from email.message import EmailMessage
from app.config import settings

def _send_email_sync(to_email: str, subject: str, body: str):
    if not to_email:
        return

    # If SMTP credentials are not configured or are set to placeholders, skip sending
    if (not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD or
            "your_gmail" in settings.SMTP_USERNAME or
            "your_16_char_app_password" in settings.SMTP_PASSWORD):
        print(f"SMTP not configured (or placeholders used). Would have sent email to {to_email}: {subject}")
        return

    msg = EmailMessage()
    msg.set_content(body)
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_USERNAME
    msg["To"] = to_email

    try:
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=5) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
            print(f"Email successfully sent to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")

def send_email(to_email: str, subject: str, body: str):
    thread = threading.Thread(target=_send_email_sync, args=(to_email, subject, body), daemon=True)
    thread.start()

