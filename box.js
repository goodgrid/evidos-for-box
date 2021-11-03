import axios from 'axios'
import FormData from 'form-data'
import { WebToken } from './jwt.js'
import { Config } from './config.js'

const webToken = new WebToken()

class BoxUserSession {
     constructor(clientId,clientSecret,authCode) {
         this.clientId = clientId
         this.clientSecret = clientSecret
         this.authCode = authCode
         this.accessToken = null
    }

    async init() {
        console.log(`Exchanging Box Auth code for token`)
        return axios.request({
            url: Config.boxAuthTokenHost, 
            method: "post",
            data: `grant_type=authorization_code&client_id=${this.clientId}&client_secret=${this.clientSecret}&code=${this.authCode}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json',
            }
        })
        .then(response => {
            this.accessToken =  response.data.access_token
            return
        })
        .catch(error => {
            //console.log(error.response.data)
            return Promise.reject(new Error("Error getting Box Auth token"))
        })
    }

    

    getUsers() {
        //retrieving Box user details as signing users
    }

    async getFile(fileId) {
        console.log("Reading file from Box", fileId)

        let headers = {
            Authorization: `Bearer ${this.accessToken}`
        }
        return axios({
            url: `${Config.boxApiBaseUrl}/files/${fileId}/content`,
            method: "get",
            headers: headers,
            responseType: 'arraybuffer'
        })
        .then(response => {
            return {
                fileId: fileId,
                content: response.data
            }
        })
        .catch(error => {
            console.log(error)
            return Promise.reject(new Error("Error getting Box file content"))
        })
    }


}

class BoxServiceSession {

    async saveSignedDocument(signedDocument) {
        console.log("Writing signed document as new version to Box document ", signedDocument.fileId)
        
        webToken.getToken()
        .then(token => {
            const formData = new FormData()
            formData.append("attributes", JSON.stringify( { description: "This version was signed via Evidos"} ))
            formData.append("file", signedDocument.content, { filename : 'document.pdf' });

            const headers = formData.getHeaders()
            headers["Authorization"] = `Bearer ${token}`

            return axios.post(`${Config.boxUploadApiBaseUrl}/files/${signedDocument.fileId}/content`, formData, { headers: headers })
        })
        .then(response => {
            return Promise.resolve(response.data)
        })
        .catch(error => {
            console.log(error)
            return Promise.reject( new Error("Error adding signed document to Box"))
        })
    }    
}

export { BoxUserSession, BoxServiceSession }