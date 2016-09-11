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
var Controller = require("./controller");


/**
 * On connect server runs main connect callbacks,
 * then server checks for room in message
 * if room joined, then server checks in the list of controllers for the matched room.
 * If the room matches a controller then -
 *      assign controller to room
 *      run join callbacks for the controller
 *      join the socket to room if all callbacks return truthy value
 *      attach other middlewares of controller to socket events
 * 
 * On Leave server runs main leave callback
 * server checks for rooms joined by socket and runs leave callback for controller of that room
 * socket is removed from room
 */

/**
 * Server usage : 
 * server.controller(room).join(flist).leave(flist).message(list).create(flist).list().update().delete();
 * 
 * 
 */

/**
 * 
 */
var server = null;
var jojo = function(httpServer){
    this.controllers = {};
    if(httpServer)
        server = sio(httpServer,{path : '/socket'});
    else
        server = sio(config.get("socket.port"));
    this.server = server;
    
    var handler = function(socket,event,message){
        console.log(socket.id,'sent',event,'with message',message);
        if(!message) message = {};
        if(!event) event = 'unknown';
        if(!message.room) message.room = "/";
        for(var i in this.controllers){
            if(this.controllers[i].match(message.room)){
                this.controllers[i].handle(message.room,socket,event,message);
            }
        } 
    };
    var onJoin = function(socket,message){
        handler.call(this,socket,'join',message);
    };
    var onLeave = function(socket,message){
        handler.call(this,socket,'leave',message);
    };
    server.on('connection',function(socket){
        if(!socket.request.headers.cookie){
            socket.emit({error : 'authentication error'});
        }else{
            socket.emit("connect",{ok : true});
            console.log("Connected client",socket.id,socket.request.headers.cookie);
            socket.on('join',function(message){
                onJoin.call(this,socket,message);
            });
            socket.on("leave",function(message){
                onLeave.call(this,socket,message);
            });
            socket.on('message',function(message){
                handler.call(this,socket,'message',message);
            });
        }
    });
};

jojo.prototype.controller = function(regex){
    if(!regex) regex = "/";
    if(!this.controllers.hasOwnProperty(regex)){
        this.controllers[regex] = new Controller(this,regex);
    }
    return this.controllers[regex];
};

jojo.prototype.auth = function(guard){
    server.use(function(socket,next){
        guard(socket.request,function(err,user){
            if(err) next(err);
            else if(!user) next(null,false);
            else {
                socket.user = user;
                next();
            }
        });
    });
    return this;
};

jojo.prototype.domain = function(domain){
    server.origins(domain);
    return this;
};

jojo.prototype.use = function(func){
    server.use(func);
    return this;
};

jojo.prototype.constructor = jojo;

module.exports = jojo;