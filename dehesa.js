var xlsx = require('node-xlsx');
var RutJS = require('./RutJS');
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

                var where = null;
                if (req.query.where) {
                    where = req.query.where;
                }
                var joined = null;
                if (req.query.joined) {
                    joined = req.query.joined;
                }

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
                }, where, joined);

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
            var pages = [];
            for (var x in config.pages) {
                for (var y in config.pages[x].scope) {
                    if (response.type == config.pages[x].scope[y]) {
                        pages[pages.length] = config.pages[x];
                        break;
                    }
                }
            }
            if (response) {
                res.send({
                    pages: pages
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

/**
 * IMPORTAR EXCEL
 */
var importPagos = require('./dehesa-import-pagos');
app.post('/api/data/import/excel', function (req, res) {
    if (req.body.params.token) {
        getSession(req.body.params.token, function (userdata, err) {
            if (userdata) {
                importPagos.import(req.body.params, function (response) {
                    db.addMonthPayment(response.data, function (response) {
                        res.send(response);
                    });
                });
            } else {
                res.send({
                    success: false,
                    message: 'Su sesión ya no es válida. Por favor inicie sesión nuevamente',
                    logout: true
                });
            }
        });
    } else {
        res.send({
            success: false,
            message: 'Token de sesión no encontrado. Por favor inicie sesión nuevamente',
            logout: true
        });
    }
});

/**
 * OBTENER REGISTROS DE PAGOS CARGADOS DEL MES
 */
app.get('/api/pagos', function (req, res) {
    if (req.query.token) {
        getSession(req.query.token, function (response, err) {
            if (response) {
                if (req.query.month && req.query.year) {
                    var meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                    var mes = null;
                    for (var x in meses) {
                        if (meses[x] == req.query.month) {
                            mes = x;
                            break;
                        }
                    }
                    if (mes && req.query.year.length == 4) {
                        db.getPayments({
                            month: mes,
                            year: req.query.year
                        }, function (response) {
                            if (response) {
                                res.send(response);
                            } else {
                                res.send(false);
                            }
                        });
                    }
                }
            }
        });
    }
});

/**
 * NOTIFICAR AL CONTADOR
 */
app.post('/api/notiticar-contador', function (req, res) {
    if (req.body.params.token) {
        getSession(req.body.params.token, function (response, err) {
            if (response) {
                var contador = false
                db.getCollection('users', function (response) {
                    for (var x in response) {
                        if (response[x].type == 'Contable') {
                            contador = response[x];
                            break;
                        }
                    }
                    if (typeof contador == 'object') {
                        sendmail.notificarContador({
                            toname: contador.name,
                            month: req.body.params.month,
                            url: config.url,
                            to: contador.email,
                            year: req.body.params.year
                        });
                        res.send({
                            success: true
                        });
                    } else {
                        res.send({
                            success: false,
                            message: 'No existe un contador ingresado en el sistema en la seccion Usuarios'
                        });
                    }
                });
            }
        });
    }
});

/**
 * REGISTRO DE LOG DE CAMBIO DE STATUS
 */
app.post('/api/pagos/log', function (req, res) {
    if (req.body.params.token) {
        getSession(req.body.params.token, function (response, err) {
            if (response) {
                var contador = false
                db.editCollection('pagos', {
                    _id: req.body.params._id,
                    log: req.body.params.log
                }, function(){
                    res.send([]);
                });
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
