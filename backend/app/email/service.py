import os

from dotenv import load_dotenv
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType


load_dotenv()


mail_config = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", "587")),
    MAIL_STARTTLS=os.getenv("MAIL_STARTTLS", "True").lower() == "true",
    MAIL_SSL_TLS=os.getenv("MAIL_SSL_TLS", "False").lower() == "true",
    USE_CREDENTIALS=True,
)


async def send_verification_email(
    email: str,
    code: str,
):
    message = MessageSchema(
        subject="SocialPilot Email Verification",
        recipients=[email],
        body=f"""
Hello,

Welcome to SocialPilot!

Your email verification code is:

{code}

This code will expire in 10 minutes.

If you did not create a SocialPilot account, please ignore this email.

Regards,
SocialPilot Team
""",
        subtype=MessageType.plain,
    )

    fast_mail = FastMail(mail_config)

    await fast_mail.send_message(message)