/* * ************************************************************ 
 * Date: 5 Sep, 2016
 * programmer: Shani Mahadeva <satyashani@gmail.com>
 * Javascript file Controller.js
 * *************************************************************** */


var path2Reg = require("path-to-regexp");
var events = require("./events");

var Controller = function(server,regex){
    this.server = server;
    this.rooms = [];
    this.params = {};
    this.r = path2Reg(regex || '',this.params);
    this.callbacks = {
        'join' : [],
        'leave' : [],
        'message' : []
    };
};

Controller.prototype.constructor = Controller;

Controller.prototype.finalHandler = function(room,socket,event,message){
    this.server.of(room).emit(event,{message : message,source : socket.id});
};

Controller.prototype.finalMessage = function(room,socket, message){
    this.server.of(room).emit(events.message,{message : message, sourse : socket.id});
};

Controller.prototype.finalJoin = function(room,socket){
    this.server.of(room).emit(events.join,{socket : socket.id});
};

Controller.prototype.finalLeave = function(room,socket){
    this.server.of(room).emit(events.leave,{socket : socket.id});
};
/**
 * 
 * @param {string} room
 * @returns {bool} truthy / falsy value
 */
Controller.prototype.match = function(room){
    return this.r.exec(room);
};

/**
 * 
 * @param {string} room | optional
 * @param {object} message | optional
 * @param {function} next | optional
 * @returns {object} params
 */
Controller.prototype.getParams = function(room,message,next){
    var m = this.r.exec(room), p = {};
    if(m){
        for(var k=0;k<this.params.length;k++)
            p[this.params.name] = m[k+1];
    }
    if('object' === typeof message) message.params = p;
    if('function' === typeof next) next(null,message);
    return p;
};

Controller.prototype.handle = function(room,socket,event,message){
    if(!event || !this.callbacks.hasOwnProperty(event))
        return this;
    
    var i = 0;
    var func = function(err){
        if(err)
            return socket.emit(events.message, {error : err.message});
        if(i >= this.callbacks[event].length){
            if(events.join === event)
                this.finalJoin(room,socket);
            else if(events.leave === event)
                this.finalLeave(room,socket);
            else if(events.message === event)
                this.finalMessage(room,socket,message);
            else
                this.finalHandler(room,socket,event,message);
        }
        else{
            if(events.join === event || events.leave === event)
                this.callbacks[event][i](room, socket, func);
            else
                this.callbacks[event][i](room, socket, message, func);
        }
        i++;
    };
    
    func.call(this);
    return this;
};

Controller.prototype.use = function(event){
    var e = typeof event === 'string' && event ? event : events.join;
    var flist = Array.prototype.slice.call(arguments,'function' === typeof event ? 0 : 1);
    if(!this.callbacks.hasOwnProperty(e))
        this.callbacks[e] = [];
    for(var i = 0; i < flist.length; i++){
        if('function' === typeof flist[i])
            this.callbacks[e].push(flist[i]);
        else
            throw new Error("A function is expected as handler");
    }
    return this;
};

Controller.prototype.join = function(){
    var a = Array.prototype.slice.call(arguments);
    a.unshift(events.join);
    this.use.apply(this,a);
    return this;
};

Controller.prototype.leave = function(){
    var a = Array.prototype.slice.call(arguments);
    a.unshift(events.leave);
    this.use.apply(this,a);
    return this;
};

Controller.prototype.message = function(){
    var a = Array.prototype.slice.call(arguments);
    a.unshift(events.message);
    this.use.apply(this,a);
    return this;
};

Controller.prototype.create = function(){
    var a = Array.prototype.slice.call(arguments);
    a.unshift(events.create);
    this.use.apply(this,a);
    return this;
};

Controller.prototype.list = function(){
    var a = Array.prototype.slice.call(arguments);
    a.unshift(events.list);
    this.use.apply(this,a);
    return this;
};

Controller.prototype.update = function(){
    var a = Array.prototype.slice.call(arguments);
    a.unshift(events.update);
    this.use.apply(this,a);
    return this;
};

Controller.prototype.remove = function(){
    var a = Array.prototype.slice.call(arguments);
    a.unshift(events.remove);
    this.use.apply(this,a);
    return this;
};

module.exports = Controller;