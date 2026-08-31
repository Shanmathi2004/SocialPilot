import asyncio

from app.email.service import send_verification_email


async def main():
    await send_verification_email(
        "shanmathi893@gmail.com",
        "123456",
    )

    print("✅ Test email sent successfully!")


asyncio.run(main())