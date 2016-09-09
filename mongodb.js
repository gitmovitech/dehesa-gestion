var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var md5 = require('md5');
var config = require('./config');
var url = 'mongodb://localhost:27017/' + config.mongo.name;
var database;
var sendmail = require('./sendmail');
var dehesaPagos = require('./dehesa-procesos-pagos');
MongoClient.connect(url, function (err, db) {
    if (!err) {
        console.log("Conectado a " + config.mongo.name + " DB");
        database = db;
        var users = db.collection('users');
        users.findOne({
            "email": config.admin.email,
            "password": md5(config.admin.password)
        }, function (err, response) {
            if (!err) {
                if (!response) {
                    users.insert({
                        "name": config.admin.name,
                        "email": config.admin.email,
                        "password": md5(config.admin.password),
                        "type": config.admin.type
                    });
                }
            }
        });
        for (x in config.pages) {
            if (config.pages[x].collection) {
                database.createCollection(config.pages[x].collection);
                console.log('Collection ' + config.pages[x].collection + ' creada.');
            }
        }
    } else {
        console.log(err);
    }
});
exports.signin = function (data, callback) {
    var users = database.collection('users');
    users.findOne({"email": data.email, "password": md5(data.password)}, function (err, response) {
        if (!err) {
            if (response) {
                callback(response);
            } else {
                callback(false, "Usuario o contraseña incorrecto");
            }
        } else {
            callback(false, err);
        }
    });
}
exports.getUserByEmail = function (email, callback) {
    var users = database.collection('users');
    users.findOne({"email": email}, function (err, response) {
        if (!err) {
            if (response) {
                callback(response);
            } else {
                callback(false, "Usuario no encontrado");
            }
        } else {
            callback(false, err);
        }
    });
}
exports.getCollection = function (collection, callback, data, join) {
    if (collection) {
        database.listCollections().toArray(function (err, collections) {
            var perm = false;
            for (x in collections) {
                if (collections[x].name == collection) {
                    perm = true;
                    break;
                }
            }
            if (perm) {
                var query = database.collection(collection);
                if (data) {
                    if (data.id) {
                        query.findOne({"_id": ObjectID(data.id)}, function (err, response) {
                            if (!err) {
                                callback(response);
                            } else {
                                console.log(err)
                                callback([]);
                            }
                        });
                    } else {
                        query.find(JSON.parse(data)).toArray(function (err, response) {
                            if (!err) {
                                for (var x in response) {
                                    for (var y in response[x]) {
                                        if (y == 'files')
                                            response[x][y] = response[x][y].split(',');
                                    }
                                }
                                if (join) {
                                    join = JSON.parse(join);
                                    var firstResponse = response;
                                    database.collection(join.name).find({}).toArray(function (err, secondResponse) {
                                        if (secondResponse) {
                                            for (var d in firstResponse) {
                                                for (var s in secondResponse) {
                                                    if (secondResponse[s].run == firstResponse[d].run) {
                                                        firstResponse[d].nombre = [secondResponse[s].nombre, secondResponse[s].apellidos].join(' ');
                                                        //{"_id":"57a123189a55c2116f977b45","run":"249483575","codigo":"1250 -A","tarifa":1.2,"type":"Pendiente","month":7,"year":2016}
                                                    }
                                                }
                                            }
                                        }
                                        if (collection == 'pagos') {
                                            dehesaPagos.obtenerCobrosIndividualesAsociados(database, firstResponse, 0, callback);
                                        } else
                                            callback(firstResponse);

                                    });
                                } else
                                    callback(response);
                            } else {
                                console.log(err)
                                callback([]);
                            }
                        });
                    }
                } else {
                    query.find({}).toArray(function (err, response) {
                        if (!err) {
                            for (var x in response) {
                                for (var y in response[x]) {
                                    if (y == 'files')
                                        response[x][y] = response[x][y].split(',');
                                }
                            }
                            callback(response);
                        } else {
                            console.log(err)
                            callback([]);
                        }
                    });
                }
            }
        });
    } else {
        callback([]);
    }
}
exports.deleteCollection = function (collection, data, callback) {
    if (collection) {
        database.listCollections().toArray(function (err, collections) {
            var perm = false;
            for (x in collections) {
                if (collections[x].name == collection) {
                    perm = true;
                    break;
                }
            }
            if (perm) {
                var query = database.collection(collection);
                if (data.key == '_id') {
                    var json = {"_id": ObjectID(data.value)}

                    query.remove(json);
                    callback();
                } else {
                    var json = JSON.parse('{"' + data.key + '":"' + data.value + '"}');
                    query.remove(json);
                    callback();
                }
            }
        });
    } else {
        callback([]);
    }
}
exports.editCollection = function (collection, data, callback) {
    if (collection) {
        database.listCollections().toArray(function (err, collections) {
            var perm = false;
            for (x in collections) {
                if (collections[x].name == collection) {
                    perm = true;
                    break;
                }
            }
            if (perm) {
                var query = database.collection(collection);
                if (collection == 'users') {
                    var insertdata = {
                        name: "",
                        email: "",
                        password: "",
                        type: ""
                    };
                    for (var x in data) {
                        switch (data[x].name) {
                            case 'name':
                                insertdata.name = data[x].value;
                                break;
                            case 'email':
                                insertdata.email = data[x].value;
                                break;
                            case 'password':
                                insertdata.password = data[x].value;
                                break;
                            case 'type':
                                insertdata.type = data[x].value;
                                break;
                        }
                    }
                    query.findOne({"email": insertdata.email}, function (err, response) {
                        if (!err) {
                            if (response) {
                                if (response.password != insertdata.password) {
                                    insertdata.password = md5(insertdata.password);
                                }
                                query.update({"email": insertdata.email}, insertdata);
                            } else {
                                var maildata = {
                                    toname: insertdata.name,
                                    to: insertdata.email,
                                    url: config.url,
                                    pass: insertdata.password
                                }
                                insertdata.password = md5(insertdata.password);
                                query.insert(insertdata);
                                sendmail.newUser(maildata);
                            }
                        }
                        callback(insertdata);
                    });
                } else {
                    var insertdata = [];
                    var update = false;
                    for (var z in data) {
                        if (data[z].name == '_id' && data[z].value != '') {
                            update = {
                                "_id": ObjectID(data[z].value)
                            }
                        } else {
                            if (data[z].value >= 0 && data[z].value != '') {
                                insertdata[z] = [JSON.stringify(data[z].name), JSON.stringify(data[z].value)].join(':');
                            } else {
                                if (data[z].name == 'files') {
                                    insertdata[z] = [JSON.stringify(data[z].name), JSON.stringify(data[z].value.join(','))].join(':');
                                } else if (data[z].value != '' && typeof data[z].value != 'undefined') {
                                    insertdata[z] = [JSON.stringify(data[z].name), JSON.stringify(data[z].value)].join(':');
                                } else {
                                    insertdata[z] = [JSON.stringify(data[z].name), '""'].join(':');
                                }
                            }
                        }
                    }
                    insertdata.splice(0, 1);
                    if (update) {
                        query.update(update, JSON.parse('{' + insertdata.join(',') + '}'));
                    } else {
                        query.insert(JSON.parse('{' + insertdata.join(',') + '}'));
                    }
                    callback(true);
                }
            }
        });
    } else {
        callback([]);
    }
}
exports.editCollectionById = function (collection, data, id, callback) {
    if (collection) {
        database.listCollections().toArray(function (err, collections) {
            var perm = false;
            for (x in collections) {
                if (collections[x].name == collection) {
                    perm = true;
                    break;
                }
            }
            if (perm) {
                var query = database.collection(collection);
                console.log(data);
                query.update({"_id": ObjectID(id)}, {$set: data});
                callback();
            }
        });
    }
}

/**
 * PAGOS
 */

exports.addMonthPayment = function (pagos, cb) {
    if (database) {
        database.collection('asociados').find({}).toArray(function (err, asociados) {
            var pagos_importados = [];
            var asociados_no_existentes = [];
            var run_asociado, run_pago;
            for (var x in asociados) {
                run_asociado = asociados[x].run;
                if (typeof run_asociado == 'string') {
                    run_asociado = run_asociado.replace(/./g, '');
                    run_asociado = run_asociado.replace(/-/g, '');
                } else {
                    var out = '';
                    for(var t in asociados[x]){
                        out += t.toUpperCase()+': '+asociados[x][t]+'\n';
                    }
                    cb({
                        success:false,
                        message: 'Se ha encontrado un registro de asociado sin RUT.\n Se ha interrumpido la importación de pagos favor corrija el registro en la sección de Asociados:\nRespuesta del servidor:\n\n'+out
                    });
                }
                for (var y in pagos) {
                    run_pago = pagos[y].run;
                    if (typeof run_pago == 'string') {
                        run_pago = run_pago.replace(/./g, '');
                        run_pago = run_pago.replace(/-/g, '');
                    } else {
                        console.log(run_pago);
                    }
                    if (run_asociado == run_pago) {
                        pagos_importados[pagos_importados.length] = {
                            nombre: asociados[x].nombre,
                            run: asociados[x].run,
                            codigo: pagos[y].codigo,
                            tarifa: pagos[y].tarifa,
                            status: 'Pendiente',
                            month: pagos[y].month,
                            year: pagos[y].year
                        }
                        break;
                    }
                }
            }
            console.log(pagos_importados.length);
            //cb(response);
        });
        /*getAsociados(database.collection('asociados'), function () {
         database.collection('pagos').findOne({
         month: data.month,
         year: data.year
         }, function (err, response) {
         if (response) {
         cb(false, 'Los datos de este mes ya se encuentran cargados');
         } else {
         dehesaPagos.procesar(database.collection('pagos'), data, 0, cb);
         }
         });
         });*/
    }
}

exports.getPayments = function (params, cb) {
    if (database) {
        database.collection('pagos').find({
            month: parseInt(params.month),
            year: parseInt(params.year)
        }).toArray(function (err, response) {
            if (response) {
                cb(response);
            } else {
                cb(false)
            }
        });
    }
}
