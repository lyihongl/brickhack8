const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const {Server} = require("socket.io")


const server = http.createServer(app);
const io = new Server(server)

app.use(express.static(path.join(__dirname, '../dist')))

// const socket = io.of('/')

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.join("global")
  socket.to("global").emit("test")
  socket.on("iop", (args) => {
    console.log("iop", args)
    socket.to("global").emit("iop-req", args)
  });
  socket.on("iop-ack", (args)=>{
    console.log("iop-ack", args)
    socket.to("global").emit("iop-ack-kid", args)
  })
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});