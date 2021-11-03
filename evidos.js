import axios from 'axios'
import FormData from 'form-data'
import { Config } from './config.js'


class SignTransaction {
    constructor(credentials) {
        this.appKey = credentials.appKey
        this.userToken = credentials.userToken
        this.transactionId = null
    }

    async init(Signers) {
        return axios({
            url: `${Config.evidosApiBaseUrl}/transaction/`,
            method: "post",
            headers: {
                "Application": `APPKey ${this.appKey}`,      
                "Authorization": `APIKey ${this.userToken}`, 
            },
            data: {
                seal: true,
                SendEmailNotifications: true,
                Signers: Signers,
                PostbackUrl: `${Config.appBaseUrl}/callback`
            }
        })
        .then(response => {
            this.transactionId = response.data.Id
            return
        })
        .catch(error => {
            console.log(error.response.data.Message)
            return Promise.reject(new Error("Error instantiating signing transaction"))
        })
    }

    async addDocument(myFileObject) {
        console.log("Adding document to signing request ", this.transactionId, myFileObject.fileId)

        const formData = new FormData()
        formData.append("file",myFileObject.content);

        return axios({
            url: `${Config.evidosApiBaseUrl}/transaction/${this.transactionId}/file/${myFileObject.fileId}`,
            method: "PUT",
            data: formData,
            headers: {
                "Application": `APPKey ${this.appKey}`,      
                "Authorization": `APIKey ${this.userToken}`, 
                "Content-Type": "application/pdf"
            }
        })
        .then(response => {
            return
        })
        .catch(error => {
            Promise.reject(new Error("Error adding document to signing transaction"))

        })


    }

    async start() {
        console.log("Starting signing request ", this.transactionId)

        return axios({
            url: `${Config.evidosApiBaseUrl}/transaction/${this.transactionId}/start`,
            method: "PUT",
            headers: {
                "Application": `APPKey ${this.appKey}`,       
                "Authorization": `APIKey ${this.userToken}`, 
            }
        })
        .then(response => {
            return response.data
        })
        .catch(error => {
            console.log(error.response.data)
            Promise.reject(new Error("Error starting signing transaction"))

        })


    }

    async readSignedDocument(url) {
        console.log("Reading signed document from Evidos")

        return axios({
            url: url,
            method: "GET",
            headers: {
                "Application": `APPKey ${this.appKey}`,       
                "Authorization": `APIKey ${this.userToken}`, 
            },
            responseType: 'arraybuffer'
        })
        .then(response => {
            return {
                fileId: url.split("/").pop(),
                content: response.data
            }
        })
        .catch(error => {
            console.log(error.response.data)
            return new Error("Error reading signed document from Evidos")

        })



    }
}

export { SignTransaction }