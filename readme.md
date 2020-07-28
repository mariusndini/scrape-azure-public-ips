## Azure Public IP Web Scrape for Allow - Listing
<p style='background-color:red'>PLEASE NOTE - THIS IS A UNSUPPORTED AND UNRELIABLE FOR LONG DURATIONS - USE AT YOUR OWN DISCRETION</p>


This document details allow-listing PowerBI cloud services IPs through Snowflake Network Policies in an automated fashion. Please note - this is a kludgy and hack way to accomplish this task. The only other option to date is to do this manually on a weekly basis when the IPs change. 


Snowflake network policies (https://docs.snowflake.com/en/user-guide/network-policies.html) policies provide options for managing network configurations to the Snowflake service. Currently, network policies allow restricting access to your account based on user IP address. Effectively, a network policy enables you to create an IP allow-list, as well as an IP block-list, if desired.


In order for Power BI to be given the access to read data within the Snowflake environment it is necessary to have the Power BI cloud service IP address allow-listed in the Snowflake environment. 


All Azure IP Addresses are updated on a weekly basis per MS Azure documentation below (therefore PowerBI service IPs are also updated weekly as well). The IPs are given a week lead time prior to being used. Within Snowflake these IPs will have to be allow-listed one week prior for the following weeks IP update.

## Who Does This Affect?
This affects anyone using <b>Snowflake Network Policies</b> in conjunction with any Azure service with dynamic and periodically changing IPs. At the time of this writing this is primarly aimed at PowerBI cloud services.


### Node.js Web Scrape Process
The code provided in the <b>index.js</b> file does the following as described below. I will be detailing all the possible places this code could break (it is alot). If there any changes to the MS Azure Website this process will break and will need to be updated.

1) Go to the MS Azure URL thru HTTP Get Request (https://www.microsoft.com/en-us/download/confirmation.aspx?id=56519)
2) Find object with ID for <b>#c50ef285-c6ea-c240-3cc4-6c9d27067d6c</b>, This is the <b>click here to download manually</b> button within the page.
3) Get the link to where this leads <b>[0].attribs.href</b>
4) Go to link in step:3 thru HTTP Get Request
5) This is the JSON object w/ all of the IPs in that file

```javascript
const rp = require('request-promise');
const url = 'https://www.microsoft.com/en-us/download/confirmation.aspx?id=56519';
const $ = require('cheerio');

return rp(url) // step 1
.then(function(html){
    var output = $('#c50ef285-c6ea-c240-3cc4-6c9d27067d6c', html)[0].attribs.href; // step 2 & 3
    return rp(output) //step 4
}).then((IP)=>{
    //print IPs
    console.log(IP); //step 5
})
.catch(function(err){
  console.log(err);
})
```

#### The Following Node libs are used
cheerio https://www.npmjs.com/package/cheerio

request (deprecated) https://www.npmjs.com/package/request

request-promise (deprecated) https://www.npmjs.com/package/request-promise

snowflake-sdk https://www.npmjs.com/package/snowflake-sdk


### This Logic/code is Error Prone
Step 1 assumes that the URL to the MS Azure envrionment will not change - with web pages this is never a guarentee.

Step 2 assumes that the ID object for the URL will be <b>#c50ef285-c6ea-c240-3cc4-6c9d27067d6c</b>, this is not guarenteed. In fact it is almost certain when MS updates the website this will have a new ID.

Step 3 is same as step 2

In short - <b>anytime</b> there is an update or a change to this website there is a near 100% chance that the above script will need be updated.

### Saving IPs to Snowflake
With the code above we can add Snowflake into the mix and by doing so we can save the JSON output into a Snowflake variant table to write a stored procedure to iterate thru the IPs and white list the ones we are interested in.

Following this process also offers the advantage that should the Javascript fail to retrieve the JSON IP values - they may be manually inserted into Snowflake and the process can continue.

```javascript
const rp = require('request-promise');
const url = 'https://www.microsoft.com/en-us/download/confirmation.aspx?id=56519';
const $ = require('cheerio');
var snowflake = require ('snowflake-sdk')

var connection = snowflake.createConnection( {
    account: 'demo106',
    username: '***', // USE PROPER SERVICE ACCOUNT
    password: '***', //CHANGE YOUR PW
    role: 'ACCOUNTADMIN', // CHANGE W/ PROPER ROLE
    database:'AZURE', //CHABNGE W/ PROPER DATABASE NAME
    schema: 'IP' //USE PROPER SCHEMA
});

return rp(url)
.then(function(html){
    var output = $('#c50ef285-c6ea-c240-3cc4-6c9d27067d6c', html)[0].attribs.href; 
    return rp(output)
}).then((IP)=>{
    //connect to Snowflake
    connection.connect( function(err, conn) {
        if (err) {
            console.error('Unable to connect: ' + err.message);
        } else {
            console.log('Successfully connected to Snowflake.');
            // INSERT IPS INTO SNOWFLAKE
            var statement = connection.execute({
                sqlText: 'INSERT INTO IP_TABLE (IP) SELECT PARSE_JSON(\''+IP+'\')', // CHANGE FOR PROPER TABLE NAME
                complete: function(err, stmt, rows) {
                    if (err) {
                        console.error('Failed to execute statement due to the following error: ' + err.message);
                    } else {
                        console.log('Successfully executed statement: ' + stmt.getSqlText());
                    }
                }
              });
            }
        }
    );

})
.catch(function(err){
  console.log(err);
})
```

### Snowflake Stored Procedure
Once the IPs are in Snowflake you are able to to access them thru SQL
```SQL
select VALUE::STRING
from AZURE.IP.IP_TABLE,
     lateral flatten( input => IP:values[3].properties.addressPrefixes);

Output Values:
1  13.72.105.31/32
2  13.72.105.76/32
3  13.93.176.195/32
4  13.93.176.215/32
..   ...
```

The following stored procedure can be used to get the SQL to create the network policy combined w/ the SQL above. At the time of this writing the Stored Procedure must have <b>EXECUTE AS CALLER</B> otherwise it will error out. The caller of the procedure therefore must have the rights and ability to create network policies on behalf of the account.


```SQL
CREATE or replace PROCEDURE AZURE.IP.ALLOW()
  RETURNS VARCHAR
  LANGUAGE javascript
  EXECUTE AS CALLER
  AS
$$
  var IP_TO_Allow = snowflake.execute( { sqlText: 
      ` select VALUE::STRING
        from AZURE.IP.IP_TABLE,
        lateral flatten( input => IP:values[3].properties.addressPrefixes) `} );
    
    var IP_CONCAT = '';
    while ( IP_TO_Allow.next()){
      var IP_CONCAT = IP_CONCAT + ` '${IP_TO_Allow.getColumnValue(1)}', `;
    }
    
    IP_CONCAT = IP_CONCAT.replace(/,\s*$/, ""); // remove trailing comma
    snowflake.execute( { sqlText: `create or replace network policy AZURE_POLICY allowed_ip_list=( ${IP_CONCAT})` } );

    return `create or replace network policy AZURE_POLICY allowed_ip_list=( ${IP_CONCAT})`;
$$;

call AZURE.IP.ALLOW();
```

#### This code and everything documented here is provided as-is and is not guarnteed to work long term (if at all). It is purely for documentation purposes.

## Other Resources/Blogs to Consider
Below are othe resources found in researching this topic that others have attempted to solve this problem

Securely using Power BI with Snowflake
https://www.linkedin.com/pulse/securely-using-power-bi-snowflake-bryan-meier/

MS Service Tag IPs 
https://www.microsoft.com/en-us/download/details.aspx?id=56519

Programmatically add Power BI Service IP addresses to whitelist? 
https://community.powerbi.com/t5/Service/Programmatically-add-Power-BI-Service-IP-addresses-to-whitelist/td-p/533000

Puplic IP of Power BI Service during Dataset Refersh using new Snowflake Connector 
https://community.powerbi.com/t5/Service/Puplic-IP-of-Power-BI-Service-during-Dataset-Refersh-using-new/td-p/991110

