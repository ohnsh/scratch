To determine the type of an item (regular video, Short, or livestream recording) in the  API response, you need to make a follow-up request to the  API endpoint for each  using the  and  parts. [1, 2, 3]  
The  resource itself does not directly provide a field to distinguish between these types. [4, 5]  
Detecting a Livestream Recording 

1. Retrieve : From the  response, extract the  from the  object for each item. 
2. Query  endpoint: For each , make a request to the  list endpoint with . 
3. Check : 

	• If the video was a livestream, the API response for that video will include a  object with properties like  and . 
	• If the video was not a livestream, the  object will not be present in the response for that video. [1, 6, 7]  

Detecting a YouTube Short 
There is no official direct field in the API response to identify a Short. Unofficial workarounds exist but involve additional requests and potential limitations: 

• Check a dedicated Shorts playlist: A channel has a special "Shorts" playlist (the playlist ID typically starts with  instead of  for the general uploads playlist). A video ID that appears in that specific playlist can be confirmed as a Short. 
• External URL check (not recommended): An unofficial and rate-limited workaround involves checking the HTTP status code for a public URL like  (a 200 status indicates a Short, 303 indicates a regular video). This method is discouraged due to potential rate limits and being flagged as suspicious. [2, 4, 8, 9, 10]  

Detecting a Regular Video 
A video is considered a regular video if it is neither a livestream recording nor a Short. Once you have made the checks mentioned above, any video that doesn't meet the criteria for a Short or a livestream is a regular video. [11]  
In summary: you need to make additional API calls to the  endpoint for each item to get the necessary details, as the initial  response is insufficient on its own. [1]  

AI can make mistakes, so double-check responses

[1] https://www.joshvickerson.com/posts/excluding-livestreams-from-the-youtube-data-api-in-javascript/
[2] https://stackoverflow.com/questions/72050850/youtube-data-api-v3-to-check-whether-video-id-is-a-short
[3] https://www.videoask.com/help/video-audio/360044119891-what-s-the-difference-between-an-uploaded-recording-and-a-streamed-recording
[4] https://issuetracker.google.com/issues/232112727
[5] https://developers.google.com/youtube/v3/docs/playlistItems
[6] https://developers.google.com/youtube/v3/docs/playlistItems
[7] https://stackoverflow.com/questions/32407370/how-can-i-tell-a-livestream-from-a-video-in-youtube-uploads-playlist
[8] https://stackoverflow.com/questions/78597268/is-there-a-way-using-youtubes-v3-api-to-determine-if-a-video-by-id-is-a-shor
[9] https://stackoverflow.com/questions/78597268/is-there-a-way-using-youtubes-v3-api-to-determine-if-a-video-by-id-is-a-shor
[10] https://issuetracker.google.com/issues/232112727
[11] https://github.com/yt-dlp/yt-dlp/issues/7706
