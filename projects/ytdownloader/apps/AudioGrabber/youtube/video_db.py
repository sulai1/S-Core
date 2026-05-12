from .yt_api import Item,Part,YoutubeApi

import pandas as pd
class VideoData():
    def __init__(self,api) -> None:
        self.api = api
        columns = ['id','etag','title','channelId','channelTitle','publishedAt','description','categoryId','tags'
                ,'duration','dimension','definition','viewCount','likeCount','dislikeCount','favoriteCount','commentCount']
        self.df = pd.DataFrame(columns=columns)


    def insertJsonData(self,item):
        
        data = []
        data.append(item['id'])
        data.append(item['etag'])

        snippet = item['snippet']
        data.append(snippet['title'])
        data.append(snippet['channelId'])
        data.append(snippet['channelTitle'])
        data.append(snippet['publishedAt'])
        data.append(snippet['description'])
        data.append(snippet['categoryId'])
        if 'tags' in snippet.keys():
            data.append(snippet['tags'])
        else:
            data.append([])

        contentDetails = item['contentDetails']
        data.append(contentDetails['duration'])
        data.append(contentDetails['dimension'])
        data.append(contentDetails['definition'])
        statistics = item['statistics']
        data.append(statistics['viewCount'])
        data.append(statistics['likeCount'])
        if 'dislikeCount' in snippet.keys():
            data.append(statistics['dislikeCount'])
        else:
            data.append([])
        data.append(statistics['favoriteCount'])
        data.append(statistics['commentCount'])
        self.df.append(data)