## Azure Public IP Web Scrape for Allow - Listing
<p style='color:red'>PLEASE NOTE - THIS IS A UNSUPPORTED AND UNRELIABLE FOR LONG DURATIONS - USE AT YOUR OWN DISCRETION</p>


This document details allow-listing PowerBI cloud services IPs through Snowflake Network Policies in an automated fashion. Please note - this is a kludgy and hack way to accomplish this task. The only other option to date is to do this manually on a weekly basis when the IPs change. 


Snowflake network policies (https://docs.snowflake.com/en/user-guide/network-policies.html) policies provide options for managing network configurations to the Snowflake service. Currently, network policies allow restricting access to your account based on user IP address. Effectively, a network policy enables you to create an IP allow-list, as well as an IP block-list, if desired.


In order for Power BI to be given the access to read data within the Snowflake environment it is necessary to have the Power BI cloud service IP address allow-listed in the Snowflake environment. 


All Azure IP Addresses are updated on a weekly basis per MS Azure documentation below (therefore PowerBI service IPs are also updated weekly as well). The IPs are given a week lead time prior to being used. Within Snowflake these IPs will have to be allow-listed one week prior for the following weeks IP update.

### Node.js Web Scrape Process
The code provided in the <b>index.js</b> file does the following
