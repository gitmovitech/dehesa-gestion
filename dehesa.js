var charset = require('charset');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var db = require('./mongodb');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var fs = require('fs');
var multer = require('multer');
var upload = multer({dest: 'uploads/'});
var path = require('path');
var mime = require('mime');
var sendmail = require('./sendmail');
var config = require('./config');
var getSession = function (token, callback) {
    var session = jwt.decode(token);
    if (session) {
        db.getUserByEmail(session.email, function (response, err) {
            if (response) {
                jwt.verify(token, response.password, function (err, response) {
                    if (err) {
                        callback(false, err);
                    } else {
                        callback(response);
                    }
                });
            } else {
                callback(false, err);
            }
        });
    } else {
        callback(false, "Sessión inválida o expirada");
    }
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
/**
 * Obtiene collections
 */
app.get('/api/data', function (req, res) {
    if (req.query.token) {
        getSession(req.query.token, function (userdata, err) {
            if (userdata) {

                db.getCollection(req.query.collection, function (response) {
                    if (response) {
                        if (req.query.databack) {
                            res.send({
                                databack: req.query.databack,
                                success: true,
                                data: response
                            });
                        } else {
                            res.send({
                                success: true,
                                data: response
                            });
                        }
                    } else {
                        if (req.query.databack) {
                            res.send({
                                databack: req.query.databack,
                                success: false,
                                message: err
                            });
                        } else {
                            res.send({
                                success: false,
                                message: err
                            });
                        }
                    }
                });

            } else {
                res.send(err);
            }
        });
    } else {
        res.send([]);
    }
});
/**
 * Guarda collections
 */
app.post('/api/data', function (req, res) {
    console.log(req.body);
    if (req.body.params.token) {
        getSession(req.body.params.token, function (userdata, err) {
            if (userdata) {
                db.editCollection(req.body.params.collection, req.body.params.fields, function (response) {
                    if (response) {
                        res.send({
                            success: true,
                            data: response
                        });
                    } else {
                        res.send({
                            success: false,
                            message: err
                        });
                    }
                });
            } else {
                res.send(err);
            }
        });
    } else {
        res.send([]);
    }
});
/**
 * Borra un dato de la coleccion
 */
app.post('/api/data/delete', function (req, res) {
    if (req.body.params.token) {
        getSession(req.body.params.token, function (response, err) {
            if (response) {
                db.deleteCollection(req.body.params.collection, req.body.params.data, function () {
                    res.send(true);
                });
            } else {
                res.send(false, err);
            }
        });
    } else {
        res.send(false);
    }
});
/**
 * Borrar archivo de la coleccion y el disco
 */
app.post('/api/file/delete', function (req, res) {
    if (req.body.params.token) {
        getSession(req.body.params.token, function (response, err) {
            if (response) {
                db.getCollection(req.body.params.collection, function (response) {
                    if (response) {
                        var files = response.files;
                        files = files.split(',');
                        if (files) {
                            for (var x in files) {
                                if (files[x] == req.body.params.data.file) {
                                    files.splice(x, 1);
                                }
                            }
                            db.editCollectionById(req.body.params.collection, {
                                files: files.join(',')
                            }, req.body.params.data.id, function () {
                                var filename = __dirname + '/causas/' + req.body.params.data.file;
                                if (fs.existsSync(filename)) {
                                    fs.unlinkSync(filename);
                                }
                                res.send(true);
                            });
                        }
                    } else {
                        res.send(false, 'Archivo no encontrado');
                    }
                }, req.body.params.data);
            } else {
                res.send(false, err);
            }
        });
    } else {
        res.send(false);
    }
});
/**
 * Obtiene los datos de la sesion del usuario
 */
app.get('/api/session', function (req, res) {
    if (req.query.token) {
        getSession(req.query.token, function (response, err) {
            if (response) {
                res.send(response);
            } else {
                res.send(err);
            }
        });
    } else {
        res.send([]);
    }
});
/**
 * Obtiene la configuración del sitio y contructor de las páginas
 */
app.get('/api/config', function (req, res) {
    if (req.query.token) {
        getSession(req.query.token, function (response, err) {
            if (response) {
                res.send({
                    pages: config.pages
                });
            } else {
                res.send(err);
            }
        });
    } else {
        res.send([]);
    }
});
/**
 * Inicio de sesión con generación de token
 */
app.post('/api/signin', function (req, res) {
    if (req.body.email && req.body.password) {
        db.signin(req.body, function (response, err) {
            if (response) {
                res.send({
                    success: true,
                    data: {
                        token: jwt.sign({
                            email: response.email,
                            first_name: response.first_name,
                            last_name: response.last_name,
                            type: response.type
                        }, response.password)
                    }
                });
            } else {
                res.send({
                    success: false,
                    message: err
                });
            }
        });
    } else {
        res.send([]);
    }
});
app.post('/api/upload', upload.single('file'), function (req, res, next) {
    if (!fs.existsSync(__dirname + '/uploads')) {
        fs.mkdirSync(__dirname + '/uploads', 0777);
    }
    fs.rename(__dirname + '/' + req.file.path, __dirname + '/uploads/' + req.file.originalname);
    res.send({answer: 'Archivo cargado correctamente', filename: req.file.originalname});
});
app.get('/descargas/:file', function (req, res) {
    var file = __dirname + '/causas/' + req.params.file
    if (fs.existsSync(file)) {
        var mimetype = mime.lookup(file);
        var filename = req.params.file;
        filename = filename.split('-');
        filename = filename.splice(1);
        filename = filename.join('-');
        res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
        res.setHeader('Content-type', mimetype);
        var filestream = fs.createReadStream(file);
        filestream.pipe(res);
    } else {
        res.send('El archivo no fue encontrado en el servidor');
    }
});
app.post('/api/message', function (req, res) {
    if (req.body.params.token) {
        getSession(req.body.params.token, function (userdata, err) {
            if (userdata) {
                var message = {
                    from: [userdata.first_name, userdata.last_name].join(' '),
                    date: new Date().getTime(),
                    message: req.body.params.data.message
                }
                db.getCollection(req.body.params.collection, function (causes) {
                    if (causes) {
                        //console.log(causes);
                        var data;
                        if (causes.messages) {
                            var arr = causes.messages;
                            arr[arr.length] = message;
                            data = {
                                messages: arr
                            }
                        } else {
                            data = {
                                messages: [message]
                            };
                        }

                        db.editCollectionById(req.body.params.collection, data, req.body.params.data.id, function () {
                            var to;
                            var toname;
                            if (causes.lawyer_assigned == userdata.email) {
                                to = causes.client_assigned;
                            }
                            if (causes.client_assigned == userdata.email) {
                                to = causes.lawyer_assigned
                            }
                            db.getCollection('users', function (response) {
                                for (var x in response) {
                                    if (response[x].email == to) {
                                        toname = [response[x].first_name, response[x].last_name].join(' ');
                                        break;
                                    }
                                }
                                var maildata = {
                                    fromname: message.from,
                                    toname: toname,
                                    to: to,
                                    number: causes.number,
                                    url: config.url
                                }
                                sendmail.send(maildata);
                                res.send(true);
                            });
                        });
                    }
                }, {
                    id: req.body.params.data.id
                });
            } else {
                res.send(err);
            }
        });
    } else {
        res.send([]);
    }
});
app.post('/api/data/import/csv', function (req, res) {
    if (req.body.params.token) {
        getSession(req.body.params.token, function (userdata, err) {
            if (userdata) {
                var file = __dirname + '/uploads/' + req.body.params.filename;
                if (fs.existsSync(file)) {
                    var xlsx = require('node-xlsx');
                    var data = xlsx.parse(fs.readFileSync(file));
                    res.send(data[0].data);
                }
            }
        });
    }
});
app.use(express.static(__dirname + '/www'));
app.get('/*', function (req, res) {
    var serverpath = __dirname;
    serverpath = serverpath.replace('/server', '/')
    res.sendFile(serverpath + '/www/index.html');
});
server.listen(3389, function () {
    console.log('Running port 3389');
});
io.on('connection', function (socket) {
    console.log('Usuario conectado al socket');

    socket.on('disconnect', function () {
        console.log('Usuario desconectado del socket');
        intervalAvserie = false;
        interval = false;
    });
});