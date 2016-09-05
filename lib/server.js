/* * ************************************************************ 
 * Date: 2 Sep, 2016
 * programmer: Shani Mahadeva <satyashani@gmail.com>
 * Javascript file server.js
 * *************************************************************** */

var sio = require("socket.io");
var async = require("async");
var util = require("util");
var config = require("config");
var http = require('http');

var server = null;
var jojo = function(httpServer){
    if(httpServer)
        server = sio(httpServer,{path : '/socket'});
    else
        server = sio(config.get("socket.port"));
    server.on('connection',function(socket){
        if(!socket.request.headers.cookie){
            socket.emit({error : 'authentication error'});
        }else{
            socket.emit("connect",{ok : true});
            console.log("Connected client",socket.id,socket.request.headers.cookie);
            socket.on('join',function(message){
                if(message.room === 'allowedRoom'){
                    socket.join("allowedRoom");
                    socket.emit({joined : message.room});
                }else{
                    socket.emit({error: 'could not join room ' + message.room});
                }
            });
            socket.on("leave",function(message){
               socket.leave(message.room);
            });
        }
    });
};

jojo.prototype.auth = function(guard){
    
};

jojo.prototype.message = function(room,event,message){
    server.of(room).emit(event,message);
};

jojo.prototype.onJoin = function(room,callback){
    server.of(room).use(callback);
};

jojo.prototype.constructor = jojo;

module.exports = jojo;