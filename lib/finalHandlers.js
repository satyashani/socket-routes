/* * ************************************************************ 
 * Date: 6 Sep, 2016
 * programmer: Shani Mahadeva <satyashani@gmail.com>
 * Javascript file finalHandlers.js
 * *************************************************************** */

module.exports = {
    join : function(io,room,socket){
        socket.join(io,room);
        io.of(room).emit('joined',{id : socket.id});
    },
    leave : function(io,room,socket){
        socket.leave(room);
        io.of(room).emit('leave',{id : socket.id});
    },
    message : function(io,room,socket,message){
        io.of(room).emit('message', {message : message});
    },
    any : function(io,room, socket,event , message){
        io.of(room).emit(event,{message : message});
    }
};