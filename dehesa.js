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
var atob = require('atob');
var meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
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

var validarEmail = function(email) {
    var expr = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    if (!expr.test(email))
      return false;
    else
      return true;
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

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
                    if (req.query.collection == 'pagos') {
                        res.send({
                            databack: req.query.databack,
                            success: true,
                            data: response
                        });
                    } else {
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
app.get('/descargas/:id/:year/:month/:file', function (req, res) {
  var file = __dirname + '/uploads/documents/'+req.params.id+'/'+req.params.year+'/'+req.params.month+'/'+atob(req.params.file);
    if (fs.existsSync(file)) {
        var mimetype = mime.lookup(file);
        var filename = atob(req.params.file);
        res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
        res.setHeader('Content-type', mimetype);
        var filestream = fs.createReadStream(file);
        filestream.pipe(res);
    } else {
        res.send('El archivo no fue encontrado en el servidor');
    }
});
app.get('/pagos/excel/:year/:month', function (req, res) {
  if(req.params.month && req.params.year){
    var mes = null;
    for (var x in meses) {
        if (meses[x] == req.params.month) {
            mes = x;
            break;
        }
    }
    var data = [[
      'ID',
      'RUT',
      'CODIGO',
      'TARIFA',
      'ESTADO',
      'PAGO',
      'DEUDA',
      'EXCEDENTES',
      'COMENTARIOS'
    ]];
    db.getPayments({
        month: mes,
        year: req.params.year
    }, function (response) {
        if (response) {
            for(var x in response){
              data[data.length] = [
                response[x].id,
                response[x].run,
                response[x].codigo,
                response[x].tarifa.total,
                response[x].type,
                response[x].pagado,
                response[x].debe,
                response[x].excedentes,
                response[x].comentarios
              ]
            }
            var buffer = xlsx.build([{name: req.params.month+" "+req.params.year, data: data}]);
            res.setHeader('Content-disposition', 'attachment; filename="' + req.params.month+" "+req.params.year + '.xlsx"');
            res.setHeader('Content-type', 'application/vnd.ms-excel');
            res.end(buffer);
        } else {
            res.send(false);
        }
    });
  }
});
app.post('/dropfile/:id/:year/:month/:file', function (req, res) {
  var file = __dirname + '/uploads/documents/'+req.params.id+'/'+req.params.year+'/'+req.params.month+'/'+decodeURI(atob(req.params.file));
    if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        var dir = fs.readdirSync(__dirname + '/uploads/documents/'+req.params.id+'/'+req.params.year+'/'+req.params.month);
        var archivosPorGuardar = [];
        for(var p in dir){
          if(dir[p] != '.DS_Store'){
            archivosPorGuardar[archivosPorGuardar.length] = dir[p];
          }
        }
        db.dropFile(req.params, archivosPorGuardar, function(){
          res.send('OK');
        });
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
              var registros_importados = [];
              var run = '';
                importPagos.import(req.body.params, function (importacion) {
                  if(importacion.success){
                    db.getModelos(function(modelos){
                      db.getServicios(function(servicios){

                        var valorservicios = '';
                        var sumaservicios = 0;
                        for(var x in servicios){
                          valorservicios = servicios[x].valor;
                          valorservicios = valorservicios.toString();
                          valorservicios = valorservicios.replace(/,/g,'.');
                          sumaservicios += parseFloat(valorservicios);
                        }

                        db.getAsociados(function(asociados){
                          var month = false;
                          for(var x in asociados){
                            run = asociados[x].run;
                            registros_importados[x] = {
                              _id: asociados[x]._id,
                              id: asociados[x].id,
                              nombre: asociados[x].usuario,
                              run: run,
                              codigo: '-',
                              tarifa:'-',
                              estado: 'No importado',
                              pagado:'-',
                              debe: '-',
                              excedentes: '-',
                              comentarios:'-',
                              archivos: '-',
                              year: req.body.params.periodo.year,
                              month: ''
                            }
                            for(var i in importacion.data){
                              if(importacion.data[i].run == run){
                                registros_importados[x].month = importacion.data[i].month
                                registros_importados[x].codigo = importacion.data[i].codigo;
                                registros_importados[x].estado = 'Pendiente';
                                registros_importados[x].pagado = 0;
                                if(!month){
                                  month = importacion.data[i].month;
                                }
                                for(var t in modelos){
                                  if(modelos[t]._id == asociados[x].tipo_casa){
                                    modelos[t].valor = modelos[t].valor.toString();
                                    modelos[t].valor = modelos[t].valor.replace(/,/,'.');
                                    registros_importados[x].tarifa = {
                                      servicios: sumaservicios,
                                      adt: importacion.data[i].tarifa,
                                      total: parseFloat(modelos[t].valor)
                                    }
                                    registros_importados[x].debe = parseFloat(modelos[t].valor);
                                    break;
                                  }
                                }
                                break;
                              }
                            }
                          }
                          db.obtenerExcedentes(registros_importados, 0, function(data){
                            db.guardarImportacionPagos({
                              data: data,
                              month: month,
                              year: req.body.params.periodo.year
                            }, function (response) {
                                res.send({success:true});
                            });
                          });
                        });
                      });
                    });
                  } else {
                    res.send(importacion);
                  }
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
 * NOTIFICAR DE COBRO AL ASOCIADO
 */
app.post('/api/notiticar-cobro-asociado', function (req, res) {
    if (req.body.params.token) {
        getSession(req.body.params.token, function (response, err) {
            if (response) {
              db.getCollection('asociados', function (response) {
                  var correo = false;
                  if(validarEmail(response.correo)){
                    correo = response.correo
                  } else if(validarEmail(response.correo_alternativo)){
                    correo = response.correo_alternativo
                  }
                  if(correo){
                    sendmail.notificarCobroAsociado({
                        toname: response.usuario,
                        to: 'vvargas@movitech.cl',//correo,
                        cobro: req.body.params.data.tarifa.totalpesos,
                        month: req.body.params.month,
                        year: req.body.params.year
                    });
                    res.send({
                        success: true
                    });
                  } else {
                    res.send({'success': false, 'message': 'Este asociado no tiene registrado correo electrónico'});
                  }
                }, {
                  uid: req.body.params.data.id
                });
            }
        });
    }
});

/**
 * PAGAR Y CAMBIO DE STATUS
 */
app.post('/api/pagar', function (req, res) {
    if (req.body.params.token) {
        getSession(req.body.params.token, function (response, err) {
            if (response) {
                var data = req.body.params.data;
                data.usuario = response;
                data.run = RutJS.cleanRut(data.run);
                db.pagar(data, function () {
                    res.send('OK');
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
                }, function () {
                    res.send([]);
                });
            }
        });
    }
});

/**
* REST DE ENCUESTAS
**/
app.get('/api/encuestas/:eid/:uid', function (req, res, next) {
    if(req.params.eid){
      db.getCollection('encuestas', function(encuesta){
        if(req.params.uid){
          db.getCollection('asociados', function(asociado){
            if(typeof asociado._id != 'undefined' || req.params.uid == 'a69c4a8625296f2b12a05cad4eb5aaea'){
              db.getCollection('encuestas_respuestas', function(respondida){
                if(respondida.length == 0 || req.params.uid == 'a69c4a8625296f2b12a05cad4eb5aaea'){
                  res.send(encuesta);
                } else {
                  res.send({"_id":0});
                }
              }, {
                id_encuesta: req.params.eid,
                id_asociado: req.params.uid
              });
            } else {
              res.send({"_id":0});
            }
          }, {
            id: req.params.uid
          });
        } else {
          res.send({"_id":0});
        }
      }, {
        id: req.params.eid
      });
    } else {
      res.send({"_id":0});
    }
});
app.post('/api/encuestas/:eid/:uid', function (req, res, next) {
    if(req.params.eid && req.params.uid){
      db.getCollection('encuestas_respuestas', function(respuestas){
        if(respuestas.length > 0){
          res.send({success:false});
        } else{
          db.editCollection('encuestas_respuestas',[
            {
              "name": "id_encuesta",
              "value": req.params.eid
            }, {
              "name": "id_asociado",
              "value": req.params.uid
            }, {
              "name": "data",
              "value": req.body
            }
          ], function(){
            res.send({success:true});
          });
        }
      }, {
        id_encuesta: req.params.eid,
        id_asociado: req.params.uid
      });
    }
});
app.post('/api/encuestas/enviar', function (req, res) {
  if (req.body.params.token && req.body.params.eid) {
    getSession(req.body.params.token, function (response, err) {
      if(response){
        db.getCollection('encuestas', function(encuesta){

          db.getCollection('asociados', function(respuestas){
            if(respuestas.length > 0){
              var contador_con_correo = 0;
              var contador_sin_correo = 0;
              var correo_segundos = 0;
              for(var x in respuestas){
                if(validarEmail(respuestas[x].correo) || validarEmail(respuestas[x].correo_alternativo)){
                  var correo;
                  if(validarEmail(respuestas[x].correo)){
                    correo = respuestas[x].correo;
                  } else {
                    correo = respuestas[x].correo_alternativo;
                  }
                  correo_segundos += 1000;
                  if(contador_con_correo == 0)
                  //setTimeout(function(){
                    sendmail.notificarEncuesta({
                      usuario: respuestas[x].usuario,
                      correo: 'vvargas@movitech.cl',//correo
                      titulo: encuesta.nombre,
                      url: 'http://www.jvdehesa.cl/encuestas?eid='+req.body.params.eid+'&uid='+respuestas[x]._id
                    });
                  //},correo_segundos);
                  if(contador_con_correo == 1)
                    sendmail.notificarEncuesta({
                      usuario: respuestas[x].usuario,
                      correo: 'mespinoz@gmail.com',
                      titulo: encuesta.nombre,
                      url: 'http://www.jvdehesa.cl/encuestas?eid='+req.body.params.eid+'&uid='+respuestas[x]._id
                    });
                    if(contador_con_correo == 2)
                      sendmail.notificarEncuesta({
                        usuario: respuestas[x].usuario,
                        correo: 'asalas@briocom.cl',
                        titulo: encuesta.nombre,
                        url: 'http://www.jvdehesa.cl/encuestas?eid='+req.body.params.eid+'&uid='+respuestas[x]._id
                      });
                      if(contador_con_correo == 3)
                        sendmail.notificarEncuesta({
                          usuario: respuestas[x].usuario,
                          correo: 'apinto@briocom.cl',
                          titulo: encuesta.nombre,
                          url: 'http://www.jvdehesa.cl/encuestas?eid='+req.body.params.eid+'&uid='+respuestas[x]._id
                        });
                        if(contador_con_correo == 4)
                          sendmail.notificarEncuesta({
                            usuario: respuestas[x].usuario,
                            correo: 'blizamaleon@gmail.com',
                            titulo: encuesta.nombre,
                            url: 'http://www.jvdehesa.cl/encuestas?eid='+req.body.params.eid+'&uid='+respuestas[x]._id
                          });


                  contador_con_correo++;
                } else {
                  contador_sin_correo++;
                }
              }

              if(contador_con_correo > 0 && contador_sin_correo > 0){
                res.send({mensaje:'Se envió la encuesta a '+contador_con_correo+ ' asociados, pero '+contador_sin_correo+' registros no poseen correo electrónico.'});
              } else if(contador_con_correo > 0){
                res.send({mensaje:'Se envió la encuesta a '+contador_con_correo+ ' asociados'});
              } else {
                res.send({mensaje:'No se pudo enviar la encuesta debido a que no se encontraron correos válidos de los asociados'});
              }

            } else{
              res.send({mensaje:'No hay asociados a quien enviar la encuesta'});
            }
          });

        }, {id: req.body.params.eid});
      }
    });
  }
});
app.get('/api/encuestas/exportar/:eid/:token', function (req, res, next) {
  if(req.params.eid && req.params.token){
    getSession(req.params.token, function (response, err) {
      if(response){
        db.getCollection('asociados', function(response){
          var asociados = [];
          for(var x in response){
            if(validarEmail(response[x].correo) || validarEmail(response[x].correo_alternativo)){
              asociados[asociados.length] = {
                _id: response[x]._id,
                id: response[x].id,
                usuario: response[x].usuario
              }
            }
          }
          db.getCollection('encuestas_respuestas', function(respuestas){
            var data = [[
              'ID',
              'Nombre del asociado'
            ]];
            var nombre_encuesta = 'Encuesta';
            for(var x in asociados){
              for(var i in respuestas){
                if(asociados[x]._id == respuestas[i].id_asociado){
                  if(data.length == 1){
                    nombre_encuesta = respuestas[i].data.nombre;
                    for(var t in respuestas[i].data.preguntas){
                      data[0][data[0].length] = respuestas[i].data.preguntas[t].nombre;
                    }
                  }
                  var add = true;
                  for(var j in data){
                    if(data[j][0] == asociados[x].id){
                      add = false;
                      break;
                    }
                  }
                  if(add){
                    data[data.length] = [asociados[x].id, asociados[x].usuario];
                  }
                  delete add;

                  for(var t in respuestas[i].data.preguntas){
                    //console.log(respuestas[i].data.preguntas[t]);
                    if(respuestas[i].data.preguntas[t].tipo == 'Selección simple'){
                      for(var g in respuestas[i].data.preguntas[t].respuestas){
                        if(respuestas[i].data.preguntas[t].respuestas[g].valor){
                          data[data.length-1].push(respuestas[i].data.preguntas[t].respuestas[g].nombre);
                          break;
                        }
                      }
                    }
                    if(respuestas[i].data.preguntas[t].tipo == 'Selección múltiple'){
                      var respuestas_multiples = [];
                      for(var g in respuestas[i].data.preguntas[t].respuestas){
                        if(respuestas[i].data.preguntas[t].respuestas[g].valor){
                          respuestas_multiples.push(respuestas[i].data.preguntas[t].respuestas[g].nombre);
                        }
                      }
                      data[data.length-1].push(respuestas_multiples.join(', '));
                      delete respuestas_multiples;
                    }
                    if(respuestas[i].data.preguntas[t].tipo == 'Calificación'){
                      var respuestas_calificacion = [];
                      for(var g in respuestas[i].data.preguntas[t].respuestas){
                        if(respuestas[i].data.preguntas[t].respuestas[g].valor){
                          respuestas_calificacion.push(respuestas[i].data.preguntas[t].respuestas[g].nombre +' = '+ respuestas[i].data.preguntas[t].respuestas[g].valor);
                        }
                      }
                      data[data.length-1].push(respuestas_calificacion.join(', '));
                      delete respuestas_calificacion;
                    }
                  }
                  break;
                }
              }
            }
            var buffer = xlsx.build([{name: nombre_encuesta, data: data}]);
            res.setHeader('Content-disposition', 'attachment; filename="encuesta.xlsx"');
            res.setHeader('Content-type', 'application/vnd.ms-excel');
            res.end(buffer);
          }, {
            id_encuesta: req.params.eid
          });
        });
      } else {
        var buffer = xlsx.build([{name: 'encuesta', data: [['Sin respuestas']]}]);
        res.setHeader('Content-disposition', 'attachment; filename="encuesta.xlsx"');
        res.setHeader('Content-type', 'application/vnd.ms-excel');
        res.end(buffer);
      }
    });
  } else {
    var buffer = xlsx.build([{name: 'encuesta', data: [['Sin respuestas']]}]);
    res.setHeader('Content-disposition', 'attachment; filename="encuesta.xlsx"');
    res.setHeader('Content-type', 'application/vnd.ms-excel');
    res.end(buffer);
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
