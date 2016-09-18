/* * ************************************************************ 
 * Date: 2 Sep, 2016
 * programmer: Shani Mahadeva <satyashani@gmail.com>
 * Javascript file server.js
 * *************************************************************** */

var io = require("socket.io");
var async = require("async");
var util = require("util");
var config = require("config");
var http = require('http');
var Controller = require("./controller");
var events = require('./events');


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
        server = io(httpServer,{path : '/socket'});
    else
        server = io(config.get("socket.port"));
    this.server = server;
    
    var handler = function(socket,event,message){
        if(!message) message = {};
        if(!event) event = 'unknown';
        if(!message.room) message.room = "/";
        for(var i in this.controllers){
            if(this.controllers[i].match(message.room)){
                this.controllers[i].handle(message.room,socket,event,message);
            }
        }
    };
    var register = function(event,socket){
        socket.on(event,function(message){
            handler.call(this,socket,event,message);
        }.bind(this));
    };
    server.on('connection',function(socket){
        socket.emit("connect",{ok : true});
        for(var k in events){
            register.call(this,events[k],socket);
        }
    }.bind(this));
};

jojo.prototype.controller = function(regex){
    if(!regex) regex = "/";
    if(!this.controllers.hasOwnProperty(regex)){
        this.controllers[regex] = new Controller(server,regex);
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

exports.create = function(server){
    return new jojo(server);
};
exports.Server = server;
exports.Events = events;