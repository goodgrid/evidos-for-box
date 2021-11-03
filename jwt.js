import crypto from "crypto";
import jwt from 'jsonwebtoken';
import axios from 'axios'
import { Config } from './jwtConfig.js';


class WebToken {
    
    
    constructor(jwtConfig) {
        this.tokenCache = {
            "token": "initialdummy",
            "timestamp": new Date(2021,6,1,19,54,0)
        }
        
    }

    async getToken() {

        const key = {
            key: Config.jwt.boxAppSettings.appAuth.privateKey,
            passphrase: Config.jwt.boxAppSettings.appAuth.passphrase
        };
        
        const claims = {
            iss: Config.jwt.boxAppSettings.clientID,
            sub: Config.jwt.enterpriseID,
            box_sub_type: "enterprise",
            aud: Config.boxTokenUrl,
            jti: crypto.randomBytes(64).toString("hex"),
            exp: Math.floor(Date.now() / 1000) + 60
        };
        
        const keyId = Config.jwt.boxAppSettings.appAuth.publicKeyID
        
        const headers = {
            'algorithm': 'RS512',
            'keyid': keyId,
        }
        const assertion = jwt.sign(claims, key, headers)
    
        //let tokenAge = Math.round(((new Date() - this.tokenCache.timestamp)/1000)/60)
        //console.log(`Token is now ${tokenAge} minutes of age`)
        //if (tokenAge > 55) {
            console.log("Getting an app token")
            return await axios({
                url: Config.boxTokenUrl,
                method: "post",
                data: {
                    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    assertion: assertion,
                    client_id: Config.jwt.boxAppSettings.clientID,
                    client_secret: Config.jwt.boxAppSettings.clientSecret
                }
            })
            .then(response => {
                return response.data.access_token
            })
            .catch(error => {
                console.log(error.message)
                return Promise.reject(new Error("Getting app token failed"))
            })
        //}else{
        //    return this.tokenCache.token;
        //}
    }
}

export { WebToken }