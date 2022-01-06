require('dotenv').config();
const { URLSearchParams } = require('url');
const axios = require('axios').default;

class SpotifyManager{

    spotify_token;

    async getToken(){
        let spotifyParams = process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_SECRET;
    
        let buff = Buffer.from(spotifyParams, "utf-8");
        let authHeader = "Basic " + buff.toString("base64");
        
        const paramData = new URLSearchParams();
        paramData.append('grant_type', 'client_credentials');
        const resp = await axios.post('https://accounts.spotify.com/api/token', paramData, { headers: { "Authorization": authHeader, "Content-Type": "application/x-www-form-urlencoded" } });
        this.spotify_token = resp.data.access_token;
        console.log("token has been obtained");
    }

    makeRequest(url){
            return axios.get(url, { headers: { "Authorization": `Bearer ${this.spotify_token}` } });
    }

    handleRequest(url){
        return new Promise((resolve, reject) => {
            this.makeRequest(url).then((resp)=>{
                resolve(resp);
            }).catch((error)=>{
                if(error.response.status == 401){
                    this.getToken().then(()=>{
                        this.makeRequest(url).then((resp)=>{
                            resolve(resp);
                        }).catch((error)=>{
                            resolve({error: "Could not use Spotify's API"});
                            console.log(error);
                        })
                    })
                }
                else{
                    resolve({error: "An unexpected error has ocurred trying to read spotify's info."})
                    console.log(error);
                }
            })
        })
    }
}

module.exports={SpotifyManager}