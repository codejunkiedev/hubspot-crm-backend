var express = require('express');
var router = express.Router();
const Hubspot = require('hubspot');
const axios = require('axios');
const fs = require('fs');

var hubspot = new Hubspot({
    clientId: '6b7cd4dc-9a35-413f-9242-90ab7dd07ef7',
    clientSecret: 'c0b64240-a75b-4bd9-be4e-0110b2e9ad94',
    redirectUri: 'https://hubspotcrm-653b7.web.app/callback'
});

router.post("/code", async (req, res) => {
    var code = req.body.code;
    if(code) {
        try {
            const accessToken = await exchangeTokenForCode(code);
            fs.writeFile('token.txt', accessToken['access_token'], function (err) {
                if (err) throw err;
            });
            var obj = {
                message: "Access token saved"
            }
            return res.json(obj);
        } catch(err) {
            return res.send(err);
        }
    }
})

router.get("/contacts", async (req, res) => {
    const accessToken = fs.readFile('token.txt','utf8', async function(err, data) {
        const queryId = req.query.hs_object_id;
        if(err) res.send(err);
        const contacts = await getContacts(data);
        var results = [];
        const found = contacts.find(element => element.vid == queryId);

        var allResults = [];
        var tempObj = {
            objectId: found.vid,
            firstname: found.properties.firstname.value,
            lastname: found.properties.lastname.value,
        }

        // if(typeof(found.properties.province) != undefined || (found.properties.province) != 'undefined') {
        if(found.properties.hasOwnProperty('province')) {
            if(found.properties.province.value == 'BC') {
                tempObj.title = 'Pacific';
            } else if(found.properties.province.value == 'AB' || found.properties.province.value == 'SK' || found.properties.province.value == 'MB') {
                tempObj.title = 'Prairie';
            } else if(found.properties.province.value == 'ON' || found.properties.province.value ==='QC') {
                tempObj.title = 'Eastern';
            } else if(found.properties.province.value == 'NB' || found.properties.province.value == 'NS' || found.properties.province.value == 'NF' || found.properties.province.value == 'PE') {
                tempObj.title = 'Atlantic';
            } else {
                tempObj.title = 'Other';
            }
        } else {
            tempObj.title = 'Other';
        }

        allResults.push(tempObj);
        var toSend = {
            "results": allResults
        }
        return res.json(toSend);
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
    var hasMore = false;
    var contacts = await getContactsAPI(accessToken, hasMore, 'offset');
    allContacts = contacts.contacts;
    hasMore = contacts["has-more"];
    while(hasMore) {
        contacts = await getContactsAPI(accessToken, hasMore, contacts["vid-offset"]);
        allContacts.push(...contacts.contacts)
        // [allContacts, ...contacts.contacts];
        // await allContacts.concat(contacts['contacts']);
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