var express = require('express');
var router = express.Router();
const Hubspot = require('hubspot');
const axios = require('axios');
const fs = require('fs');

var hubspot = new Hubspot({
    clientId: '6b7cd4dc-9a35-413f-9242-90ab7dd07ef7',
    clientSecret: 'c0b64240-a75b-4bd9-be4e-0110b2e9ad94',
    redirectUri: 'http://localhost:3000/callback'
});

router.post("/code", async (req, res) => {
    var code = req.body.code;
    if(code) {
        const accessToken = await exchangeTokenForCode(code);
        fs.writeFile('token.txt', accessToken['access_token'], function (err) {
            if (err) throw err;
        });
        var obj = {
            message: "Access token saved"
        }
        res.json(obj);
    }
})

router.get("/contacts", async (req, res) => {
    const accessToken = fs.readFile('token.txt','utf8', async function(err, data) {
        if(err) res.send(err);
        const contacts = await getContacts(data);
        var results = [];
        await Promise.all(contacts.map(async (item, index) => {
            var tempObj = {
                firstname: item.properties.firstname.value,
                lastname: item.properties.lastname.value,
                email: item.properties.email.value
            }
            if(item.properties.province) {
                tempObj.province = item.properties.province.value
            } else {
                tempObj.province = 'Not found'
            }
            if(tempObj.province === 'BC') {
                tempObj.region = 'Pacific'
            } else if(tempObj.province === 'AB' || tempObj.province === 'SK' || tempObj.province === 'MB') {
                tempObj.region = 'Prairie'
            } else if(tempObj.province === 'ON' || tempObj.province === 'QC') {
                tempObj.region = 'Eastern'
            } else if(tempObj.province === 'NB' || tempObj.province === 'NS' || tempObj.province === 'NF' || tempObj.province === 'PE') {
                tempObj.region = 'Atlantic'
            } else {
                tempObj.region = 'Other'
            }
            results.push(tempObj);
        }));
        results.sort((a, b) => a.region.localeCompare(b.region))
        var obj = {
            results: results
        }
        res.json(obj);
    });
 
});


const exchangeTokenForCode = async (code) => {
    const accessToken = hubspot.oauth.getAccessToken({
        code: code // the code you received from the oauth flow
    }).then((data) => {
        console.log('Data is ', data);
        return data;
        // res.json(data.access_token);
    }).catch((err) => {
        return err;
    });
    return accessToken;
}

const getContacts = async(accessToken) => {
    var allContacts = [];
    var contacts = await getContactsAPI(accessToken, hasMore, 'offset');
    allContacts = contacts.contacts;
    var hasMore = contacts["has-more"];
    while(hasMore) {
        contacts = await getContactsAPI(accessToken, hasMore, contacts["vid-offset"]);
        [allContacts, ...contacts.contacts];
        hasMore = contacts["has-more"];
    }
    return allContacts;
    
}

const getContactsAPI = async(accessToken, hasMore, offset) => {
    var url = 'https://api.hubapi.com/contacts/v1/lists/all/contacts/all?property=province&property=firstname&property=lastname&property=email&count=100';
    if(hasMore) {
        url = `https://api.hubapi.com/contacts/v1/lists/all/contacts/all?property=province&property=firstname&property=lastname&property=email&vidOffset=${offset}&count=100`;
    }
    var config = {
        method: 'GET',
        url: url,
        headers: { 
          'Authorization': `Bearer ${accessToken}`
        }
    };
      
    var contacts = axios(config)
      .then(async function (response) {
        return response.data;
      })
      .catch(function (error) {
        return error
    });
    return contacts;
}

module.exports = router;