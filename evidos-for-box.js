import express from 'express';
import { SignTransaction } from './evidos.js'
import { BoxUserSession, BoxServiceSession } from './box.js'
import { Utils } from './utils.js'
import { Config } from './config.js'

const app = express();

app.use(express.static('./public'))
app.use(express.urlencoded({extended: true}));
app.use(express.json()) 
app.set('view engine', 'pug')
app.set('views', `./views`);

var server = app.listen(3000, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Evidos for Box started and listening at http://%s:%s.", host, port)
})

app.get('/', async (req, res) => {
    res.render('start-signing',{fileId: req.query.fileId, authCode: req.query.authCode})
})

app.post("/instantiate", async (req,res) => {
  
    const boxUserSession = new BoxUserSession(
        Config.boxClientId,
        Config.boxClientSecret,
        req.body.authCode
    )
    
    const evidos = new SignTransaction({
        appKey: Config.evidosAppKey,
        userToken:  Config.evidosUserToken
    })

    evidos.init(req.body.Signers)
    .then(response => {
        return boxUserSession.init()
    })
    .then(response => {
        return boxUserSession.getFile(req.body.fileId);
    })
    .then(boxDocument => {
        return evidos.addDocument(boxDocument)
    })
    .then(() => {
        return evidos.start();
    })
    .then(() => {
        res.status(200).send("")
    })
    .catch(error => {
        console.log("Finishing chain with error", error)
        res.status(500).send({error:error})
    })


})


app.post("/callback", async (req,res) => {
    // TODO: Implement checksum validation
    // TODO: Implement handling multiple files in a transaction

    console.log("Received transaction status for Evidos transaction", req.body.Id)
    if (req.body.Status == 30) {
        if (Utils.sha1(`${req.body.Id}||${req.body.Status}|${Config.evidosSharedSecret}`) == req.body.Checksum) {

            const boxServiceSession = new BoxServiceSession()

            const evidos = new SignTransaction({
                appKey: Config.evidosAppKey,
                userToken: Config.evidosUserToken
            })

            let signedDocuments = req.body.Files
            Object.keys(signedDocuments).forEach(signedDocument => {
                signedDocuments[signedDocument].Links.forEach(async link =>  {
                    console.log("Transfering signed document from ", link.Link)

                    evidos.readSignedDocument(link.Link)
                    .then(boxServiceSession.saveSignedDocument)
                    .catch(error => {
                        console.log("ERROR while transferring the signed document", error)
                        res.status(500).send()
                    })
                })
            })
            res.status(200).send()
        } else {
            console.log(`Callback for transaction ${req.body.Id} was ignored because checksum did not match`)
            res.status(200).send()
        }
    } else {
        console.log(`Callback for transaction ${req.body.Id} was ignored because of status ${req.body.Status} is not equal to status 30 (Signed)`)
        res.status(200).send()
    }
    
})



