from pathlib import Path
from uuid import uuid4
import os

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.models.user import User
from app.security.dependencies import get_current_user

router = APIRouter(
    prefix="/api/uploads",
    tags=["Uploads"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

PUBLIC_BASE_URL = os.getenv(
    "PUBLIC_BASE_URL",
    "https://nancy-northwest-hall-andreas.trycloudflare.com",
)

@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if not file.content_type:
        raise HTTPException(
            status_code=400,
            detail="Image type could not be determined.",
        )

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, and WebP images are supported.",
        )

    file_extension = ALLOWED_CONTENT_TYPES[file.content_type]
    filename = f"{uuid4().hex}{file_extension}"

    file_path = UPLOAD_DIR / filename

    contents = await file.read()

    max_size = 10 * 1024 * 1024

    if len(contents) > max_size:
        raise HTTPException(
            status_code=400,
            detail="Image size must be less than 10 MB.",
        )

    try:
        with open(file_path, "wb") as output_file:
            output_file.write(contents)

    except OSError as error:
        raise HTTPException(
            status_code=500,
            detail="Unable to save image.",
        ) from error

    public_url = f"{PUBLIC_BASE_URL}/uploads/{filename}"

    return JSONResponse(
        content={
            "filename": filename,
            "url": public_url,
        }
    )