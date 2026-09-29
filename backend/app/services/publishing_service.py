
from datetime import datetime, timezone

import requests
from sqlalchemy.orm import Session

from app.models.post import Post
from app.models.social_account import SocialAccount
from app.models.publishing_log import PublishingLog


INSTAGRAM_GRAPH_URL = "https://graph.instagram.com/v24.0"


def publish_to_instagram(
    db: Session,
    post: Post,
    social_account: SocialAccount,
):
    """
    Publish an image post to one Instagram account.
    """

    if not post.media_url:
        raise ValueError(
            "Instagram publishing requires an image URL."
        )

    if not social_account.access_token:
        raise ValueError(
            "Instagram access token is missing."
        )

    instagram_user_id = social_account.platform_user_id
    access_token = social_account.access_token

    # --------------------------------------------------
    # STEP 1: Create Instagram media container
    # --------------------------------------------------

    create_url = (
        f"{INSTAGRAM_GRAPH_URL}/"
        f"{instagram_user_id}/media"
    )

    create_data = {
        "image_url": post.media_url,
        "caption": post.content,
        "access_token": access_token,
    }

    create_response = requests.post(
        create_url,
        data=create_data,
        timeout=30,
    )

    try:
        create_result = create_response.json()
    except ValueError:
        create_result = {}

    if create_response.status_code != 200:
        error_message = (
            create_result
            .get("error", {})
            .get("message")
            if isinstance(create_result.get("error"), dict)
            else None
        )

        raise ValueError(
            error_message
            or "Instagram could not create the media container."
        )

    creation_id = create_result.get("id")

    if not creation_id:
        raise ValueError(
            "Instagram did not return a media container ID."
        )

    # --------------------------------------------------
    # STEP 2: Publish the media container
    # --------------------------------------------------

    publish_url = (
        f"{INSTAGRAM_GRAPH_URL}/"
        f"{instagram_user_id}/media_publish"
    )

    publish_data = {
        "creation_id": creation_id,
        "access_token": access_token,
    }

    publish_response = requests.post(
        publish_url,
        data=publish_data,
        timeout=30,
    )

    try:
        publish_result = publish_response.json()
    except ValueError:
        publish_result = {}

    if publish_response.status_code != 200:
        error_message = (
            publish_result
            .get("error", {})
            .get("message")
            if isinstance(publish_result.get("error"), dict)
            else None
        )

        raise ValueError(
            error_message
            or "Instagram could not publish the media."
        )

    instagram_media_id = publish_result.get("id")

    if not instagram_media_id:
        raise ValueError(
            "Instagram did not return the published media ID."
        )

    return instagram_media_id


def publish_post(
    db: Session,
    post_id: int,
    platform: str | None = None,
):
    """
    Publish a post to all selected social accounts.

    Each selected account is processed independently.
    If one account fails, the other selected accounts
    will still be attempted.
    """

    post = (
        db.query(Post)
        .filter(Post.id == post_id)
        .first()
    )

    if not post:
        return {
            "success": False,
            "message": "Post not found.",
        }

    # --------------------------------------------------
    # Get all selected connected accounts
    # --------------------------------------------------

    selected_accounts = [
        account
        for account in post.social_accounts
        if account.status == "connected"
    ]

    if not selected_accounts:
        return {
            "success": False,
            "message": (
                "No connected social accounts were "
                "selected for this post."
            ),
            "post_id": post.id,
        }

    results = []
    successful_count = 0
    failed_count = 0

    # --------------------------------------------------
    # Publish to every selected account
    # --------------------------------------------------

    for social_account in selected_accounts:

        account_name = (
            social_account.display_name
            or social_account.platform_username
            or social_account.platform_user_id
        )

        platform_name = (
            social_account.platform.lower()
        )

        try:

            # --------------------------------------------------
            # INSTAGRAM
            # --------------------------------------------------

            if platform_name == "instagram":

                instagram_media_id = publish_to_instagram(
                    db=db,
                    post=post,
                    social_account=social_account,
                )

                log = PublishingLog(
                    post_id=post.id,
                    social_account_id=social_account.id,
                    platform="instagram",
                    platform_media_id=instagram_media_id,
                    status="published",
                    published_at=datetime.now(timezone.utc),
                )

                db.add(log)
                db.commit()
                db.refresh(log)

                successful_count += 1

                results.append(
                    {
                        "social_account_id": social_account.id,
                        "account_name": account_name,
                        "platform": "instagram",
                        "status": "published",
                        "log_id": log.id,
                        "instagram_media_id": instagram_media_id,
                    }
                )

            # --------------------------------------------------
            # OTHER PLATFORMS
            # --------------------------------------------------

            else:

                raise ValueError(
                    f"Publishing for platform "
                    f"'{social_account.platform}' "
                    "is not implemented yet."
                )

        except Exception as error:

            db.rollback()

            failed_log = PublishingLog(
                post_id=post.id,
                social_account_id=social_account.id,
                platform=social_account.platform,
                status="failed",
                error_message=(
                    f"Account {account_name}: {str(error)}"
                ),
            )

            db.add(failed_log)
            db.commit()
            db.refresh(failed_log)

            failed_count += 1

            results.append(
                {
                    "social_account_id": social_account.id,
                    "account_name": account_name,
                    "platform": social_account.platform,
                    "status": "failed",
                    "log_id": failed_log.id,
                    "error": str(error),
                }
            )

    # --------------------------------------------------
    # Update overall post status
    # --------------------------------------------------

    if successful_count > 0 and failed_count == 0:
        post.status = "published"

    elif successful_count > 0:
        post.status = "published"

    else:
        post.status = "failed"

    db.commit()
    db.refresh(post)

    # --------------------------------------------------
    # Final response
    # --------------------------------------------------

    if failed_count == 0:

        return {
            "success": True,
            "message": (
                f"Post published successfully to "
                f"{successful_count} selected "
                f"social account"
                f"{'s' if successful_count != 1 else ''}."
            ),
            "post_id": post.id,
            "successful_count": successful_count,
            "failed_count": failed_count,
            "results": results,
        }

    if successful_count > 0:

        return {
            "success": True,
            "message": (
                f"Post published to "
                f"{successful_count} account"
                f"{'s' if successful_count != 1 else ''}, "
                f"but "
                f"{failed_count} account"
                f"{'s' if failed_count != 1 else ''} "
                f"failed."
            ),
            "post_id": post.id,
            "successful_count": successful_count,
            "failed_count": failed_count,
            "results": results,
        }

    return {
        "success": False,
        "message": (
            "Publishing failed for all selected accounts."
        ),
        "post_id": post.id,
        "successful_count": 0,
        "failed_count": failed_count,
        "results": results,
    }
