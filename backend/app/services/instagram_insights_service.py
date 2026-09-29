import requests

from app.models.publishing_log import PublishingLog
from app.models.social_account import SocialAccount


INSTAGRAM_GRAPH_URL = "https://graph.instagram.com/v24.0"


def fetch_instagram_insights(
    db,
    publishing_log: PublishingLog,
):
    """
    Fetch engagement insights for one published
    Instagram media item.
    """

    if publishing_log.platform != "instagram":
        raise ValueError(
            "Insights are currently supported only for Instagram."
        )

    if not publishing_log.platform_media_id:
        raise ValueError(
            "Instagram media ID is missing."
        )

    social_account = (
        db.query(SocialAccount)
        .filter(
            SocialAccount.id
            == publishing_log.social_account_id
        )
        .first()
    )

    if not social_account:
        raise ValueError(
            "Connected Instagram account not found."
        )

    if not social_account.access_token:
        raise ValueError(
            "Instagram access token is missing."
        )

    url = (
        f"{INSTAGRAM_GRAPH_URL}/"
        f"{publishing_log.platform_media_id}/insights"
    )

    params = {
        "metric": (
            "likes,"
            "comments,"
            "shares,"
            "reach,"
            "views"
        ),
        "access_token": social_account.access_token,
    }

    response = requests.get(
        url,
        params=params,
        timeout=30,
    )

    try:
        result = response.json()
    except ValueError:
        result = {}

    if response.status_code != 200:
        error_message = (
            result
            .get("error", {})
            .get("message")
            if isinstance(result.get("error"), dict)
            else None
        )

        raise ValueError(
            error_message
            or "Instagram insights could not be retrieved."
        )

    metrics = {}

    for item in result.get("data", []):
        name = item.get("name")
        value = item.get("values", [{}])[0].get(
            "value",
            0,
        )

        if name:
            metrics[name] = value

    publishing_log.likes = metrics.get("likes", 0)
    publishing_log.comments = metrics.get("comments", 0)
    publishing_log.shares = metrics.get("shares", 0)
    publishing_log.reach = metrics.get("reach", 0)
    publishing_log.views = metrics.get("views", 0)

    db.commit()
    db.refresh(publishing_log)

    return {
        "publishing_log_id": publishing_log.id,
        "platform": "instagram",
        "likes": publishing_log.likes,
        "comments": publishing_log.comments,
        "shares": publishing_log.shares,
        "reach": publishing_log.reach,
        "views": publishing_log.views,
    }