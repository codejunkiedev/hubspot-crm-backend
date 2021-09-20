const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express()
const apiPort = process.env.PORT || 8000
const hubspotRouter = require('./routes/hubspot')
const fs = require('fs');

// const hubspot = new Hubspot({ accessToken: 'COTKtv--LxIHAAEAQAAAARil1fAJINPCyQwo7doZMhRgpPrQhakzrAy05NnOcO9lULl57DowAAAAQQAAAAAAAAAAAAAAAACAAAAAAAAAAAAAIAAAAAAA4AEAAAAAAAAAAAAAABACQhRpQaIu1lVKrshbS6bsaxRfnA7B-EoDbmExUgBaAA' })

app.use(cors())
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded())
app.use('/hubspot', hubspotRouter);
app.get('/', async(req, res) => {
    // res.send('I am working');
    // fs.writeFile('token.txt', 'CIv__pu_LxIHAAEAQAAAARil1fAJINPCyQwo7doZMhRmkZfv0TJ9e79GQl_qnNac7ZTh0TowAAAAQQAAAAAAAAAAAAAAAACAAAAAAAAAAAAAIAAAAAAA4AEAAAAAAAAAAAAAABACQhQNFuB', function (err) {
    //     // if (err) throw err;
    //     if(err)
    //         res.send(err);
    // });

    fs.readFile('token.txt','utf8', function(err, data) {
        console.log('Data is ', data)
        if(err) return res.send(err);
        res.send(data);
    });
})

app.listen(apiPort, () => console.log(`Server running on port ${apiPort}`))