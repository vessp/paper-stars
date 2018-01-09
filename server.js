const express = require('express')
const path = require('path')

const PORT = process.env.PORT || 3000
const INDEX = path.join(__dirname, 'index.html')

const app = express()

app.use('/bin', express.static(path.join(__dirname, 'node_modules')))
app.use('/js', express.static(path.join(__dirname, 'js')))

app.route('/')
  .get((req, res) => {
    res.sendFile(INDEX)
  })

//this should be at the end to send wayward traffic to the website router
// app.get('*', (req,res) => res.sendFile(INDEX)) 

const server = app.listen(PORT, () => {
  console.log(`Listening on ${ PORT }`)
})