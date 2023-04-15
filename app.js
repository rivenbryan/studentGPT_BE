const express = require('express');
const app = express()
const bodyParser = require('body-parser');
const chatGPT_router = require("./routes/chatGPT_route")
require('dotenv').config({ path: '.env' });
var cors = require('cors')


/*
* Middleware called ody-parser -> responsible for parsing the request body
* so that we can print values onto node.js console.log
* Middleware called CORs-> responsible for parsing the request FE to BE
*/

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(cors())

app.use((req, res, next)=> {
  console.log(req.path, req.method)
  next()
})

/*
* Routes for API
*/
app.use('/api', chatGPT_router)

// Other routes and middlewares
app.get('/', (req, res) => {
  res.send('Hello World!');
});

/*
* Listening to port
*/

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port`);
});