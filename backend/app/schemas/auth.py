from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    username: str = Field(
        min_length=3,
        max_length=20,
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
    )

    confirm_password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        if not value.isalnum():
            raise ValueError(
                "Username must contain only letters and numbers."
            )

        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not any(char.isupper() for char in value):
            raise ValueError(
                "Password must contain at least one uppercase letter."
            )

        if not any(char.islower() for char in value):
            raise ValueError(
                "Password must contain at least one lowercase letter."
            )

        if not any(char.isdigit() for char in value):
            raise ValueError(
                "Password must contain at least one number."
            )

        if not any(not char.isalnum() for char in value):
            raise ValueError(
                "Password must contain at least one special character."
            )

        return value

    @field_validator("confirm_password")
    @classmethod
    def validate_confirm_password(
        cls,
        value: str,
        info,
    ) -> str:
        password = info.data.get("password")

        if password is not None and value != password:
            raise ValueError("Passwords do not match.")

        return value

class VerifyEmailRequest(BaseModel):
    email: EmailStr

    code: str = Field(
        min_length=6,
        max_length=6,
        pattern=r"^\d{6}$",
    )  
class LoginRequest(BaseModel):
    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
    )


class LoginResponse(BaseModel):
    message: str
    access_token: str
    token_type: str
    user: dict