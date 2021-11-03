import crypto from 'crypto'

const Utils = {

    sha1(strToHash) {

        return crypto.createHash('sha1').update(strToHash).digest('hex');
    }

}

export { Utils }