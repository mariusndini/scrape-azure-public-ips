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
    // If this ID(#) changes b/c azure updates their HTML this will invalidate the code
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













