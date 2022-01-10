const { default: axios } = require("axios");
const { URLSearchParams } = require('url');
const cheerio = require('cheerio');

/**
 * gets url from the first search result of the genius search api.
 * @param {Object} search
 * @returns the url of the first search result
 */
const getFirstResult = (search) => {
    let first = search.response.hits[0];
    if(first.type !== "song"){
        return null;
    }

    let songInfo = first.result;

    if(songInfo.lyrics_state !== "complete")
        return null;
    
    return songInfo.url;
    
}

/**
 * searches for a song on the genius api, given the song name.
 * @param {String} name 
 * @returns search results from genius api
 */
const getSearchResults = async (name) => {
        let queryParam = name.trim();
        let paramData = new URLSearchParams();
        paramData.append('q', queryParam);
        let searchResp = await axios.get("https://genius.com/api/search?"+paramData.toString());
        let searchResults = searchResp.data;
        return searchResults;
}

/**
 * requests lyrics page and scrapes the lyrics off it.
 * @param {String} url 
 * @returns object with a song's lyrics
 */
const scrapeLyrics = async (url) => {
    let lyricsRequest = await axios.get(url);
    let lyricsHTML = lyricsRequest.data;
    let $ = cheerio.load(lyricsHTML);
    let lyricContainers = $('div[data-lyrics-container="true"]');
    $('div[data-lyrics-container="true"]').find('br').replaceWith('\n')

    let finalLyrics = "";
    for (let i = 0; i < lyricContainers.length; i++) {
        const element = lyricContainers.get(i);
        finalLyrics += $(element).text() + "\n";
        if(finalLyrics.length > 6000){
            return {message: "Could not get lyrics", error: true}
        }
    }

    return {message: finalLyrics}
}

/**
 * first gets search results from the getSearchResults function.
 * then gets the url from the first result.
 * finally gets the lyrics from the scrapeLyrics function.
 * @param {String} song name
 * @returns Object with a message being the song lyrics or an error message.
 */
const getLyrics = async (song) => {
    try{
        let search = await getSearchResults(song);
        let found = getFirstResult(search);
    
        if(!found)
            return null;
    
        return await scrapeLyrics(found);
    }
    catch(error){
        return {message: "Could not get lyrics", error: true}
    }
}

module.exports={getLyrics}