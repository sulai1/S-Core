#!/usr/bin/env python3
"""
Worker bridge: receives a JSON job from stdin, executes it using YoutubeApi,
and emits a JSON result to stdout.

Environment variables:
  AUDIOGRABBER_YT_API_KEY       YouTube Data API v3 key (required for sync)
  AUDIOGRABBER_YT_URL           YouTube API base URL
                                (default: https://youtube.googleapis.com/youtube/v3/)
  AUDIOGRABBER_DOWNLOAD_FOLDER  Folder to save downloaded audio files
                                (default: ./download)

Dry-run mode (used by canary health check):
  Pass {"kind": "download"|"sync", "payload": {...}, "dry_run": true} to
  validate the bridge imports and env wiring without hitting YouTube or writing
  any files.  The response will contain {"dry_run": true} in the result.
"""
import json
import os
import sys
import uuid

# Add the parent directory to path so the youtube package is importable when
# this script is run from any working directory.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from youtube.yt_api import Item, Part, YoutubeApi  # noqa: E402


def emit(payload: dict) -> None:
    sys.stdout.write(json.dumps(payload))
    sys.stdout.flush()


def _api() -> YoutubeApi:
    api_key = os.environ.get("AUDIOGRABBER_YT_API_KEY", "")
    url = os.environ.get(
        "AUDIOGRABBER_YT_URL",
        "https://youtube.googleapis.com/youtube/v3/",
    )
    return YoutubeApi(api_key, url)


def _download_folder() -> str:
    return os.environ.get("AUDIOGRABBER_DOWNLOAD_FOLDER", "download")


def handle_download(payload: dict) -> dict:
    """Download a single video by videoId."""
    video_id = payload.get("videoId", "").strip()
    if not video_id:
        return {"accepted": False, "message": "missing-videoId"}

    output_format = payload.get("outputFormat", "mp3")
    if output_format not in ("mp3", "source"):
        return {"accepted": False, "message": f"invalid-outputFormat:{output_format}"}

    embed_metadata = payload.get("embedMetadata", True)
    embed_metadata = bool(embed_metadata)

    song_title = str(payload.get("songTitle", "")).strip()
    artist = str(payload.get("artist", "")).strip()
    album = str(payload.get("album", "")).strip()

    metadata = {}
    if song_title:
        metadata["title"] = song_title
        metadata["track"] = song_title
    if artist:
        metadata["artist"] = artist
    if album:
        metadata["album"] = album

    folder = _download_folder()
    os.makedirs(folder, exist_ok=True)

    api = _api()
    success = api.download(
        [video_id],
        folder,
        output_format=output_format,
        embed_metadata=embed_metadata,
        metadata_by_id={video_id: metadata} if metadata else None,
    )
    if not success:
        return {"accepted": False, "message": "download-failed"}

    return {
        "accepted": True,
        "externalJobId": str(uuid.uuid4()),
        "message": f"downloaded:{video_id}:format={output_format}:metadata={'on' if embed_metadata else 'off'}",
    }


def handle_sync(payload: dict) -> dict:
    """Sync new uploads from a YouTube channel."""
    channel_id = payload.get("channelId", "").strip()
    if not channel_id:
        return {"accepted": False, "message": "missing-channelId"}

    api = _api()
    if not api.api_key:
        return {"accepted": False, "message": "missing-api-key"}

    # 1. Resolve the uploads playlist for the channel.
    channels, _ = api.get(
        channel_id,
        Item.CHANNELS,
        parts=[Part.CONTENTDETAILS],
        maxResults=1,
    )
    if channels is None:
        return {"accepted": False, "message": "youtube-api-request-failed:channels"}
    if not channels:
        return {"accepted": False, "message": f"channel-not-found:{channel_id}"}

    uploads_playlist_id = (
        channels[0].get("contentDetails", {})
        .get("relatedPlaylists", {})
        .get("uploads")
    )
    if not uploads_playlist_id:
        return {"accepted": False, "message": "uploads-playlist-not-found"}

    # 2. Collect video IDs from the uploads playlist.
    folder = _download_folder()
    os.makedirs(folder, exist_ok=True)

    playlist_items, _ = api.get(
        uploads_playlist_id,
        Item.PLAYLIST_ITEMS,
        parts=[Part.SNIPPET],
        maxResults=50,
    )
    if playlist_items is None:
        return {"accepted": False, "message": "youtube-api-request-failed:playlistItems"}
    if not playlist_items:
        return {
            "accepted": True,
            "externalJobId": str(uuid.uuid4()),
            "message": "sync-complete:no-items",
        }

    video_ids = [
        item["snippet"]["resourceId"]["videoId"]
        for item in playlist_items
        if item.get("snippet", {}).get("resourceId", {}).get("videoId")
    ]

    # 3. Filter already-downloaded videos and download the rest.
    new_ids = YoutubeApi.remove_existing(video_ids, folder)
    if new_ids:
        api.download(new_ids, folder)

    return {
        "accepted": True,
        "externalJobId": str(uuid.uuid4()),
        "message": f"sync-complete:{len(new_ids)}-new",
    }


try:
    raw = sys.stdin.read()
    data = json.loads(raw) if raw else {}
    kind = data.get("kind")
    payload = data.get("payload", {})
    dry_run = bool(data.get("dry_run", False))

    if dry_run:
        # Validate that imports and env vars resolve without touching YouTube.
        api_key = os.environ.get("AUDIOGRABBER_YT_API_KEY", "")
        emit({
            "accepted": True,
            "dry_run": True,
            "message": f"dry-run:ok kind={kind} api_key={'set' if api_key else 'missing'}",
        })
    elif kind == "download":
        emit(handle_download(payload))
    elif kind == "sync":
        emit(handle_sync(payload))
    else:
        emit({"accepted": False, "message": "unsupported-kind"})
except Exception as exc:
    emit({"accepted": False, "message": f"worker-bridge-error:{exc}"})
