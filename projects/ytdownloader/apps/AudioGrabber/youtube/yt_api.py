from enum import Enum
import yt_dlp
import os
import glob
import requests
import isodate
import sys
from mutagen.easyid3 import EasyID3
from mutagen.id3 import ID3, ID3NoHeaderError
from mutagen.mp4 import MP4

try:
    from imageio_ffmpeg import get_ffmpeg_exe
except Exception:
    get_ffmpeg_exe = None


class Item(Enum):
    CHANNELS = ('channels', 'id')
    PLAYLIST = ('playlists', 'id')
    PLAYLIST_ITEMS = ('playlistItems', 'playlistId')
    VIDEOS = ('videos', 'id')
    SEARCH = ('search', 'q')
    SEARCH_VIDEO = ('search', 'videoId')
    SUBSCRIPTIONS = ('subscriptions', 'channelId')


class Part(Enum):
    ID = 'id'
    SNIPPET = 'snippet'
    CONTENTDETAILS = 'contentDetails'
    STATUS = 'status'
    STATISTICS = 'statistics'
    FILEDETAILS = 'fileDetails'
    # lemnoslife additional parts : https://yt.lemnoslife.com
    MUSIC = 'music'
    MUSICS = 'musics'
    QUALITIES = 'qualities'


class YoutubeApi():
    def __init__(self, api_key, url):
        self.api_key = api_key
        self.url = url

    def get(self, id: str, request_item: Item, parts=[Part.ID], params={}, maxResults=10, nextPageToken=None):
        request = f'{self.url}{request_item.value[0]}?'

        # add parts
        request += 'part='
        for part in parts[:-1]:
            request += f'{part.value},'
        request += f'{parts[-1].value}&'

        # put id
        request += f'{request_item.value[1]}={id}'

        # additional params
        for k in params.keys():
            request += f"&{k}={params[k]}"

        if nextPageToken is not None:
            request += f"&pageToken={nextPageToken}"
        request += f'&maxResults={maxResults}&key={self.api_key}'

        print(request, file=sys.stderr)
        response = requests.get(request)

        if not response.ok:
            print(
                f'error receiving status code "{response.status_code}":"{response.content}"',
                f'for request: {request}',
                file=sys.stderr,
            )
            return None, None

        data = response.json()
        if not isinstance(data, dict):
            print(f'unexpected response format for request: {request}', file=sys.stderr)
            return None, None

        if 'items' not in data:
            api_error = data.get('error', {}) if isinstance(data.get('error', {}), dict) else {}
            api_message = api_error.get('message') or 'unknown-api-error'
            print(f'no "items" in API response for request: {request} message: {api_message}', file=sys.stderr)
            return None, None

        if 'nextPageToken' in data.keys():
            nextPageToken = data['nextPageToken']
        items = data['items']
        return items, nextPageToken

    def getAll(self, id: str, request_item: Item, parts=[Part.ID], params={}, maxResults=500):
        nextPageToken = '-'
        items = []
        while nextPageToken is not None and len(items) < maxResults:
            i, nextPageToken = self.get(id, request_item, parts, params, maxResults)
            if i is None:
                break
            items += i
        return items

    def playlist(self, playlist, maxResults=50):
        playlist, _ = self.get(id=playlist, request_item=Item.PLAYLIST, parts=[Part.SNIPPET], maxResults=50)
        title = playlist[0]['snippet']['title']
        playlistItems, _ = api.get(id=playlist, request_item=Item.PLAYLIST_ITEMS, parts=[Part.SNIPPET], maxResults=50)
        videoIds = []
        for item in playlistItems:
            videoId = item['snippet']['resourceId']['videoId']
            data = self.getVideoData(videoId)
            if not len(data) > 0:
                continue
            res = data[0]
            duration = res['duration'].total_seconds()
            if duration > 180 and duration < 660:
                videoIds.append(videoId)
        return title, videoIds

    def getVideoData(self, videoId):
        items = self.get(videoId, request_item=Item.VIDEOS, parts=[Part.ID, Part.SNIPPET, Part.CONTENTDETAILS, Part.STATISTICS])
        if not items or items[0] is None:
            return []
        res = []
        for item in items[0]:
            data = {}
            data['id'] = item['id']
            data['etag'] = item['etag']

            snippet = item['snippet']
            data['title'] = snippet['title']
            data['channelId'] = snippet['channelId']
            data['channelTitle'] = snippet['channelTitle']
            data['publishedAt'] = snippet['publishedAt']
            data['description'] = snippet['description']
            data['categoryId'] = snippet['categoryId']
            if 'tags' in snippet.keys():
                data['tags'] = snippet['tags']
            else:
                data['tags'] = []

            contentDetails = item['contentDetails']
            dur = isodate.parse_duration(contentDetails['duration'])

            data['duration'] = dur
            data['dimension'] = contentDetails['dimension']
            data['definition'] = contentDetails['definition']

            statistics = item['statistics']
            data['viewCount'] = statistics['viewCount']
            data['likeCount'] = statistics['likeCount']
            if 'dislikeCount' in snippet.keys():
                data['dislikeCount'] = statistics['dislikeCount']
            else:
                data['dislikeCount'] = []
            data['favoriteCount'] = statistics['favoriteCount']
            res.append(data)
        return res

    @staticmethod
    def remove_existing(videoIds, downloadFolder):
        ids = []
        for id in videoIds:
            existing = [
                p for p in glob.glob(os.path.join(downloadFolder, f'*{id}.*'))
                if not p.endswith('.part') and not p.endswith('.ytdl')
            ]
            if len(existing) <= 0:
                ids.append(id)
        return ids

    @staticmethod
    def has_output_for_id(video_id, downloadFolder, extensions):
        for ext in extensions:
            if len(glob.glob(os.path.join(downloadFolder, f'*{video_id}.{ext}'))) > 0:
                return True
        return False

    @staticmethod
    def _find_output_paths(video_id, downloadFolder):
        paths = [
            p for p in glob.glob(os.path.join(downloadFolder, f'*{video_id}.*'))
            if not p.endswith('.part') and not p.endswith('.ytdl')
        ]
        return paths

    @staticmethod
    def _resolve_ffmpeg_location():
        ffmpeg_path = None
        ffprobe_path = None

        if get_ffmpeg_exe is not None:
            try:
                ffmpeg_path = get_ffmpeg_exe()
            except Exception:
                ffmpeg_path = None

        if ffmpeg_path:
            ffprobe_candidate = os.path.join(os.path.dirname(ffmpeg_path), 'ffprobe')
            if os.path.exists(ffprobe_candidate):
                ffprobe_path = ffprobe_candidate

            if ffprobe_path:
                return os.path.dirname(ffmpeg_path)
            return ffmpeg_path

        return None

    @staticmethod
    def _apply_metadata_to_file(file_path, metadata):
        title = (metadata.get('title') or metadata.get('track') or '').strip()
        artist = (metadata.get('artist') or '').strip()
        album = (metadata.get('album') or '').strip()

        if not title and not artist and not album:
            return

        ext = os.path.splitext(file_path)[1].lower()
        if ext == '.mp3':
            try:
                tags = EasyID3(file_path)
            except ID3NoHeaderError:
                ID3().save(file_path)
                tags = EasyID3(file_path)

            if title:
                tags['title'] = [title]
            if artist:
                tags['artist'] = [artist]
            if album:
                tags['album'] = [album]
            tags.save(file_path)
            return

        if ext in ('.m4a', '.mp4'):
            tags = MP4(file_path)
            if title:
                tags['\xa9nam'] = [title]
            if artist:
                tags['\xa9ART'] = [artist]
            if album:
                tags['\xa9alb'] = [album]
            tags.save()

    @staticmethod
    def _apply_metadata_for_id(video_id, downloadFolder, metadata):
        paths = YoutubeApi._find_output_paths(video_id, downloadFolder)
        for path in paths:
            try:
                YoutubeApi._apply_metadata_to_file(path, metadata)
            except Exception as exc:
                print(f'failed to apply metadata on {path}: {exc}', file=sys.stderr)

    def download(self, videoIds, downloadFolder, output_format='mp3', embed_metadata=True, metadata_by_id=None):
        postprocessors = []
        if output_format == 'mp3':
            postprocessors.append({
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            })
        if embed_metadata:
            postprocessors.append({'key': 'FFmpegMetadata'})

        ffmpeg_location = YoutubeApi._resolve_ffmpeg_location()
        if output_format == 'mp3' and not ffmpeg_location:
            print(
                'MP3 conversion requested but ffmpeg is not available. '
                'Install ffmpeg or include imageio-ffmpeg in the environment.',
                file=sys.stderr,
            )
            return False

        ydl_opts = {
            'outtmpl': os.path.join(downloadFolder, '%(title)s %(id)s.%(ext)s'),
            'format': 'bestaudio/best',
            'postprocessors': postprocessors,
            'addmetadata': bool(embed_metadata),
            'cachedir': False,
            'quiet': True,
            'no_warnings': True,
            'noprogress': True,
        }
        if ffmpeg_location:
            ydl_opts['ffmpeg_location'] = ffmpeg_location

        ydl = yt_dlp.YoutubeDL(ydl_opts)
        watch_url = 'http://www.youtube.com/watch?v='
        metadata_by_id = metadata_by_id or {}
        with ydl:
            videoIds = YoutubeApi.remove_existing(videoIds, downloadFolder)

            for id in videoIds:
                try:
                    extra_info = metadata_by_id.get(id, {}) or {}
                    ydl.extract_info(watch_url + id, download=True, extra_info=extra_info)

                    if extra_info:
                        YoutubeApi._apply_metadata_for_id(id, downloadFolder, extra_info)

                    if output_format == 'mp3' and not YoutubeApi.has_output_for_id(id, downloadFolder, ['mp3']):
                        print(
                            f"Expected mp3 output for video {id}, but no .mp3 file was produced. "
                            "Ensure ffmpeg is installed and available on PATH.",
                            file=sys.stderr,
                        )
                        return False
                except yt_dlp.DownloadError:
                    pass
                except Exception as e:
                    print("Error while downloading! Try updating yt_dlp : 'pip install -U yt_dlp'", e, file=sys.stderr)
                    return False
        return True


if __name__ == '__main__':
    print('test')

    API_KEY = 'AIzaSyDm9NUppwHLXdZ6uWmdd4Swzg0kyI78TAI'
    YT_URL = 'https://youtube.googleapis.com/youtube/v3/'
    api = YoutubeApi(API_KEY, YT_URL)

    videoId = 'XFkzRNyygfk'
    api.download([videoId], 'download')