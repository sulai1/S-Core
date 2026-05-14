# AudioGrabber

A self-hosted media manager that downloads audio/video from YouTube via yt-dlp, embeds metadata and cover art, and provides a searchable library with tag-based filtering.

---

## Environment Variables

### Server

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3800` | HTTP port the server listens on |
| `NODE_ENV` | `development` | Set to `production` to enable JWT authentication |

### Database (PostgreSQL)

| Variable | Default | Description |
|---|---|---|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USER` | `postgres` | PostgreSQL user |
| `DB_PASSWORD` | `postgres` | PostgreSQL password |
| `DB_NAME` | `audiograbber` | PostgreSQL database name |

### Storage

| Variable | Default | Description |
|---|---|---|
| `AUDIOGRABBER_DOWNLOAD_FOLDER` | `.data/audiograbber/download` | Destination folder for completed downloads |
| `AUDIOGRABBER_DOWNLOAD_TMP_FOLDER` | `.data/audiograbber/tmp` | Working directory for in-progress downloads |
| `AUDIOGRABBER_DOWNLOAD_FAILED_FOLDER` | `.data/audiograbber/failed` | Folder where failed download artifacts are moved |
| `AUDIOGRABBER_WORKER_FAILURE_LOG` | _(none)_ | Path to JSONL file for failure logs. If unset, logs are written alongside failed files |

### Worker

| Variable | Default | Description |
|---|---|---|
| `AUDIOGRABBER_WORKER_MODE` | `stub` | Worker implementation: `stub` (no-op), `ytdlp` (yt-dlp subprocess), `python` (legacy) |
| `AUDIOGRABBER_WORKER_TIMEOUT_MS` | `300000` | Inactivity timeout in milliseconds; job is killed if no output is received for this duration |

### yt-dlp

| Variable | Default | Description |
|---|---|---|
| `AUDIOGRABBER_YT_DLP_BIN` | `yt-dlp` (from PATH or `VIRTUAL_ENV`) | Absolute path to the yt-dlp binary |
| `AUDIOGRABBER_YT_DLP_COOKIES_FILE` | _(none)_ | Path to a Netscape-format `cookies.txt` file passed to yt-dlp via `--cookies` |
| `AUDIOGRABBER_YT_DLP_COOKIES_FROM_BROWSER` | _(none)_ | Browser name to extract cookies from (e.g. `firefox`, `chrome`), passed via `--cookies-from-browser` |
| `AUDIOGRABBER_YT_DLP_RETRIES` | `8` | Number of download retries (`--retries`) |
| `AUDIOGRABBER_YT_DLP_FRAGMENT_RETRIES` | `8` | Number of fragment retries (`--fragment-retries`) |
| `AUDIOGRABBER_YT_DLP_RETRY_SLEEP` | `exp=1:20` | Retry sleep expression passed to `--retry-sleep` |
| `AUDIOGRABBER_YT_DLP_SLEEP_INTERVAL` | _(none)_ | Minimum sleep between downloads (`--sleep-interval`). Leave unset to disable |
| `AUDIOGRABBER_YT_DLP_MAX_SLEEP_INTERVAL` | _(none)_ | Maximum sleep between downloads (`--max-sleep-interval`). Leave unset to disable |
| `AUDIOGRABBER_YT_DLP_SOCKET_TIMEOUT` | `30` | Socket timeout in seconds (`--socket-timeout`) to abort stalled connections |

### YouTube Data API

| Variable | Default | Description |
|---|---|---|
| `AUDIOGRABBER_YT_API_KEY` | _(required)_ | YouTube Data API v3 key, used for channel/playlist metadata |
| `AUDIOGRABBER_YT_URL` | `https://youtube.googleapis.com/youtube/v3/` | Base URL for YouTube API requests |
| `AUDIOGRABBER_YT_TIMEOUT_MS` | `15000` | Request timeout for YouTube API calls in milliseconds |
| `AUDIOGRABBER_YT_RETRIES` | `1` | Number of retries for YouTube API requests |

### External Binaries

| Variable | Default | Description |
|---|---|---|
| `AUDIOGRABBER_FPCALC_BIN` | `fpcalc` (from PATH) | Path to the `fpcalc` binary (Chromaprint) used for audio fingerprinting |
| `AUDIOGRABBER_FFMPEG_BIN` | `ffmpeg` (from PATH) | Path to the `ffmpeg` binary used for audio processing and metadata embedding |

### Authentication (Keycloak / JWT)

Authentication is only enforced when `NODE_ENV=production`. In development mode, all requests are treated as a single bypass user.

| Variable | Default | Description |
|---|---|---|
| `KEYCLOAK_JWKS_URI` | _(none)_ | URL to the Keycloak JWKS endpoint (e.g. `https://auth.example.com/realms/myrealm/protocol/openid-connect/certs`) |
| `KEYCLOAK_ISSUER` | _(none)_ | Expected JWT issuer, must match the `iss` claim |
| `KEYCLOAK_AUDIENCE` | _(none)_ | Expected JWT audience. If empty, audience check is skipped |
| `AUDIOGRABBER_DEV_USER_SUB` | `dev-user` | Keycloak subject used for the auto-created dev bypass user (development only) |
