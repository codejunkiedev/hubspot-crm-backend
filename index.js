const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express()
const apiPort = process.env.PORT || 8000
const hubspotRouter = require('./routes/hubspot')
const fs = require('fs');

app.use(cors())
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded())
app.use('/hubspot', hubspotRouter);
app.get('/', async(req, res) => {
    const accessToken = fs.readFile('token.txt','utf8', async function(err, data) {
        return data;
    });

    res.send(accessToken);
})

app.listen(apiPort, () => console.log(`Server running on port ${apiPort}`))