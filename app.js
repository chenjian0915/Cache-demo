const http = require('http');
const url = require('url');
const fs = require('fs');
const PORT = 8000;
const path = require('path');
const mime = require('./mime').types;
const config = require('./config');

var server = http.createServer(function(request,response){
    var pathName = url.parse(request.url).pathname;
    var realPath = 'assets' +pathName;
    var ext = path.extname(realPath);
    ext = ext ? ext.slice(1) : 'unknown';
    var contentType = mime[ext] || 'text/plain';

    if(ext.match(config.Expires.fileMatch)){
        var expires = new Date();
        expires.setTime(expires.getTime() + config.Expires.maxAge * 1000);
        response.setHeader('Expires',expires.toUTCString());
        response.setHeader('Cache-Control','max-age=' + config.Expires);
    }
    fs.stat(realPath,function(err,stat){
        var lastModified = stat.mtime.toUTCString();
        response.setHeader('Last-Modified',lastModified);
        console.log(lastModified);
        console.log(request.headers['if-modified-since'])
        if(request.headers['if-modified-since']&&lastModified ==request.headers['if-modified-since']){
            response.writeHead(304,'Not Modified');
            response.end();
        }else{
            fs.exists(realPath,function(exists){
                if(!exists){
                    response.writeHead(404,{
                        'Content-Type' : 'text/plain'
                    })
                    response.write('This file' + realPath + 'can not found on this server')
                    response.end()
                }else{
                    fs.readFile(realPath,function(err,file){
                        if(err){
                            response.writeHead(500,{
                                'Content-Type' : 'text/plain'
                            })
                            response.end()
                        }else{
                            response.writeHead(200,{
                                'Content-Type' : contentType
                            });
                            response.write(file,'binary');
                            response.end();
                        }

                    })
                }
            })
        }

    })


});

server.listen(PORT);
console.log('Server runing at port : ' + PORT);
