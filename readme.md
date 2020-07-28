## Azure Public IP Web Scrape for Allow - Listing
<p style='color:red'>PLEASE NOTE - THIS IS A UNSUPPORTED AND UNRELIABLE FOR LONG DURATIONS - USE AT YOUR OWN DISCRETION</p>


This document details allow-listing PowerBI cloud services IPs through Snowflake Network Policies in an automated fashion. Please note - this is a kludgy and hack way to accomplish this task. The only other option to date is to do this manually on a weekly basis when the IPs change. 


Snowflake network policies (https://docs.snowflake.com/en/user-guide/network-policies.html) policies provide options for managing network configurations to the Snowflake service. Currently, network policies allow restricting access to your account based on user IP address. Effectively, a network policy enables you to create an IP allow-list, as well as an IP block-list, if desired.


In order for Power BI to be given the access to read data within the Snowflake environment it is necessary to have the Power BI cloud service IP address allow-listed in the Snowflake environment. 


All Azure IP Addresses are updated on a weekly basis per MS Azure documentation below (therefore PowerBI service IPs are also updated weekly as well). The IPs are given a week lead time prior to being used. Within Snowflake these IPs will have to be allow-listed one week prior for the following weeks IP update.

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

return rp(url)
.then(function(html){
    // If this ID(#) changes b/c azure updates their HTML this will invalidate the code
    var output = $('#c50ef285-c6ea-c240-3cc4-6c9d27067d6c', html)[0].attribs.href; 
    return rp(output)
}).then((IP)=>{
    //print IPs
    console.log(IP);
})
.catch(function(err){
  console.log(err);
})
```