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
        try {
            await Promise.all(contacts.map(async (item, index) => {
                var tempObj = {
                    objectId: item.vid
                }
                tempObj.properties = {
                    label: "firstname",
                    dataType: "STRING",
                    value : item.properties.firstname.value
                }

                var properties= [];
                var firstNameObj = {
                    label: "firstname",
                    dataType: "STRING",
                    value : item.properties.firstname.value
                }
                var lastNameObj = {
                    label: "lastname",
                    dataType: "STRING",
                    value : item.properties.lastname.value
                }
                var emailObj = {
                    label: "email",
                    dataType: "STRING",
                    value : item.properties.email.value
                }
    
                var regionObj = {
                    label: "region",
                    dataType: "STRING"
                }

                // if(item.properties.province) {
                //     tempObj.province = item.properties.province.value
                // } else {
                //     tempObj.province = 'Not found'
                // }
                if(item.properties.province === 'BC') {
                    regionObj.value = 'Pacific';
                    // properties.region = regionObj
                    // tempObj.properties = properties;

                } else if(item.properties.province === 'AB' || item.properties.province === 'SK' || item.properties.province === 'MB') {
                    regionObj.value = 'Prairie';
                    // properties.value = 'Prairie';
                    // tempObj.properties = properties;
                } else if(item.properties.province === 'ON' || item.properties.province === 'QC') {
                    regionObj.value = 'Eastern';
                    // properties.value = 'Eastern';
                    // tempObj.properties = properties;
                } else if(item.properties.province === 'NB' || item.properties.province === 'NS' || item.properties.province === 'NF' || item.properties.province === 'PE') {
                    regionObj.value = 'Atlantic';
                    // properties.value = 'Atlantic';
                    // tempObj.properties = properties;
                } else {
                    regionObj.value = 'Other';
                    // properties.value = 'Other';
                    // tempObj.properties = properties;
                }
                // properties.push(firstNameObj)
                // properties.push(lastNameObj)
                // // properties.push(emailObj);
                // // properties.push(regionObj);
                // tempObj.properties = properties;
                console.log('Properies are ', properties)
                results.push(tempObj);
            }));
            // results.sort((a, b) => a.region.localeCompare(b.region))
            var obj = {
                results: results
            }
            res.json(obj);
        } catch(err) {
            res.send(err);
        }
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