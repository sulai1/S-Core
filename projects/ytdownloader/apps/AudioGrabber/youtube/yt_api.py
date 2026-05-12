from enum import Enum
import yt_dlp
import os
import glob
import requests
import isodate

class Item(Enum):
    CHANNELS=('channels','id')
    PLAYLIST=('playlists','id')
    PLAYLIST_ITEMS=('playlistItems','playlistId')
    VIDEOS=('videos','id')
    SEARCH=('search','q')
    SEARCH_VIDEO=('search','videoId')
    SUBSCRIPTIONS=('subscriptions','channelId')

class Part(Enum):
    ID='id'
    SNIPPET='snippet'
    CONTENTDETAILS='contentDetails'
    STATUS='status'
    STATISTICS='statistics'
    FILEDETAILS='fileDetails'
    # lemnoslife additional parts : https://yt.lemnoslife.com
    MUSIC='music'
    MUSICS='musics'
    QUALITIES='qualities'

class YoutubeApi():
    def __init__(self,api_key,url):
        self.api_key = api_key
        self.url = url

    def get(self,id:str,request_item:Item,parts=[Part.ID],params={}, maxResults=10, nextPageToken=None):
        request = f'{self.url}{request_item.value[0]}?'

        # add parts
        request += 'part='
        for part in  parts[:-1]:
            request += f'{part.value},'
        request += f'{parts[-1].value}&'

        # put  id
        request += f'{request_item.value[1]}={id}'

        # additional params
        for k in params.keys():
            request += f"&{k}={params[k]}"

        if nextPageToken is not None:
            request += f"&pageToken={nextPageToken}"
        request += f'&maxResults={maxResults}&key={self.api_key}'

        # execute the request
        print(request)
        response = requests.get(request)
        
        # check response
        if not response.ok:
            print(f'error receiving status code "{response.status_code}":"{response.content}"',f'for request: {request}')
            return None, None
        
        # read out parts
        data = response.json()
        # get the next pageToken 
        if 'nextPageToken' in data.keys():
            nextPageToken = data['nextPageToken']
        # print(f'{data}')
        items = data['items']
        return items, nextPageToken

    def getAll(self,id:str,request_item:Item,parts=[Part.ID],params={}, maxResults=500):
        nextPageToken = '-'
        items = []
        while nextPageToken != None and len(items) < maxResults:
            i,nextPageToken = self.get(id,request_item,parts,params,maxResults)
            items+=i
        return items
    

    def playlist(self,playlist,maxResults=50):
        playlist,_ = self.get(id=playlist,request_item=Item.PLAYLIST,parts=[Part.SNIPPET],maxResults=50)
        title = playlist[0]['snippet']['title']
        playlistItems,_ = api.get(id=playlist,request_item=Item.PLAYLIST_ITEMS,parts=[Part.SNIPPET],maxResults=50)
        videoIds = []
        for item in playlistItems:
            videoId = item['snippet']['resourceId']['videoId']
            data = self.getVideoData(videoId)
            if not len(data)>0:
                continue
            res = data[0]
            duration = res['duration'].total_seconds()
            if duration > 180 and duration < 660:
                videoIds.append(videoId)
        len(videoIds)
        return title, videoIds

    def getVideoData(self,videoId):
        items = self.get(videoId,request_item=Item.VIDEOS,parts=[Part.ID,Part.SNIPPET,Part.CONTENTDETAILS,Part.STATISTICS])
        res = []
        for  item in items[0]:
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
            # data['commentCount'] = statistics['commentCount']
            res.append(data)
        return res
    
    
    @staticmethod
    def remove_existing(videoIds,downloadFolder):
        ids = []
        for id in videoIds:
            if len(glob.glob(os.path.join(downloadFolder,f'*{id}.mp3'))) <= 0:
                ids.append(id)
        return ids
                

    def download(self,videoIds,downloadFolder):
        ydl_opts = {
            'outtmpl': os.path.join(downloadFolder,'%(title)s %(artist)s  %(id)s.%(ext)s'), 
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'cachedir': False,
        }
        ydl = yt_dlp.YoutubeDL(ydl_opts)
        watch_url = 'http://www.youtube.com/watch?v='
        ydl.cache.remove()
        with ydl:
            videoIds = YoutubeApi.remove_existing(videoIds,downloadFolder)
            
            for  id in videoIds:
                try:
                        result = ydl.download(watch_url+id)
                except yt_dlp.DownloadError:
                    pass
                except Exception as e:
                    print("Error while downloading! Try updating yt_dlp : 'pip install -U yt_dlp'",e)
                    return False
        return True
    
    
if __name__ == '__main__':
    print('test')

    API_KEY='AIzaSyDm9NUppwHLXdZ6uWmdd4Swzg0kyI78TAI'
    YT_URL = 'https://yt.lemnoslife.com/'
    YT_URL='https://youtube.googleapis.com/youtube/v3/'
    api = YoutubeApi(API_KEY,YT_URL)
    
    videoId = 'XFkzRNyygfk'
    api.download([videoId],'download')