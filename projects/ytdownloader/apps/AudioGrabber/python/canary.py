#!/usr/bin/env python3
"""
Canary health check for the AudioGrabber Python worker.

Checks:
  1. All required Python packages are importable and at the expected versions.
  2. worker_bridge.py handles a dry-run round-trip without errors.
  3. (Optional, live) Fetch metadata for a known stable YouTube video.

Usage:
  # Dry-run only (no network, safe for CI):
  python3 python/canary.py

  # Include live metadata fetch (requires AUDIOGRABBER_YT_API_KEY):
  python3 python/canary.py --live

Exit codes:
  0  All checks passed.
  1  One or more checks failed (details printed to stderr).
"""
import argparse
import importlib.metadata
import json
import os
import subprocess
import sys

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# The video used for the live metadata probe — a stable, long-lived video.
CANARY_VIDEO_ID = "jNQXAC9IVRw"  # "Me at the zoo" — the first YouTube video

# Expected minimum versions (fail if installed version is older).
MIN_VERSIONS: dict[str, tuple[int, ...]] = {
    "yt-dlp": (2025, 1, 1),
    "requests": (2, 32, 0),
    "isodate": (0, 7, 0),
    "pandas": (2, 2, 0),
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

PASS = "\033[32mPASS\033[0m"
FAIL = "\033[31mFAIL\033[0m"
failures: list[str] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    tag = PASS if ok else FAIL
    msg = f"[{tag}] {name}"
    if detail:
        msg += f" — {detail}"
    print(msg)
    if not ok:
        failures.append(name)


def parse_version(v: str) -> tuple[int, ...]:
    """Parse a version string like '2025.4.30' or '2.32.3' into a tuple."""
    try:
        return tuple(int(x) for x in v.split(".")[:3])
    except ValueError:
        return (0,)


# ---------------------------------------------------------------------------
# Check 1: package versions
# ---------------------------------------------------------------------------

def check_packages() -> None:
    print("\n--- Package versions ---")
    for pkg, min_ver in MIN_VERSIONS.items():
        try:
            installed = importlib.metadata.version(pkg)
            parsed = parse_version(installed)
            ok = parsed >= min_ver
            check(
                f"{pkg} >= {'.'.join(str(x) for x in min_ver)}",
                ok,
                f"installed={installed}",
            )
        except importlib.metadata.PackageNotFoundError:
            check(f"{pkg} installed", False, "not found")


# ---------------------------------------------------------------------------
# Check 2: worker_bridge dry-run
# ---------------------------------------------------------------------------

def check_bridge_dry_run() -> None:
    print("\n--- worker_bridge dry-run ---")
    script = os.path.join(os.path.dirname(__file__), "worker_bridge.py")
    payload = json.dumps({"kind": "download", "payload": {"videoId": "test"}, "dry_run": True})

    try:
        result = subprocess.run(
            [sys.executable, script],
            input=payload,
            capture_output=True,
            text=True,
            timeout=10,
            env={**os.environ},
        )
        if result.returncode != 0:
            check("bridge dry-run exit code", False, f"stderr: {result.stderr.strip()}")
            return

        data = json.loads(result.stdout)
        check("bridge dry-run accepted", data.get("accepted") is True, str(data))
        check("bridge dry-run flag", data.get("dry_run") is True, str(data))
    except subprocess.TimeoutExpired:
        check("bridge dry-run timeout", False, "timed out after 10s")
    except Exception as exc:
        check("bridge dry-run", False, str(exc))


# ---------------------------------------------------------------------------
# Check 3: live metadata fetch
# ---------------------------------------------------------------------------

def check_live_metadata() -> None:
    print("\n--- Live metadata fetch ---")
    api_key = os.environ.get("AUDIOGRABBER_YT_API_KEY", "")
    if not api_key:
        print("  SKIP — AUDIOGRABBER_YT_API_KEY not set")
        return

    try:
        # Add parent dir so the youtube package is importable.
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
        from youtube.yt_api import Item, Part, YoutubeApi  # noqa: PLC0415

        url = os.environ.get(
            "AUDIOGRABBER_YT_URL",
            "https://youtube.googleapis.com/youtube/v3/",
        )
        api = YoutubeApi(api_key, url)
        items, _ = api.get(CANARY_VIDEO_ID, Item.VIDEOS, parts=[Part.SNIPPET], maxResults=1)
        ok = bool(items and len(items) > 0)
        title = items[0].get("snippet", {}).get("title", "?") if ok else ""
        check("live metadata fetch", ok, f'title="{title}"')
    except Exception as exc:
        check("live metadata fetch", False, str(exc))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="AudioGrabber canary health check")
    parser.add_argument("--live", action="store_true", help="Run live metadata fetch (requires API key)")
    args = parser.parse_args()

    print("AudioGrabber canary health check")
    print("=" * 40)

    check_packages()
    check_bridge_dry_run()
    if args.live:
        check_live_metadata()

    print("\n" + "=" * 40)
    if failures:
        print(f"FAILED: {len(failures)} check(s) failed: {', '.join(failures)}", file=sys.stderr)
        sys.exit(1)
    else:
        print("All checks passed.")


if __name__ == "__main__":
    main()
