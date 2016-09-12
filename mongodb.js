var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var md5 = require('md5');
var config = require('./config');
var url = 'mongodb://localhost:27017/' + config.mongo.name;
var database;
var sendmail = require('./sendmail');
var dehesaPagos = require('./dehesa-procesos-pagos');
var RutJS = require('./RutJS');
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
                                insertdata[insertdata.length] = [JSON.stringify(data[z].name), JSON.stringify(data[z].value)].join(':');
                            } else {
                                if (data[z].name == 'files') {
                                    try {
                                        insertdata[insertdata.length] = [JSON.stringify(data[z].name), JSON.stringify(data[z].value.join(','))].join(':');
                                    } catch (e) {

                                    }
                                } else if (data[z].value != '' && typeof data[z].value != 'undefined') {
                                    insertdata[insertdata.length] = [JSON.stringify(data[z].name), JSON.stringify(data[z].value)].join(':');
                                } else {
                                    insertdata[insertdata.length] = [JSON.stringify(data[z].name), '""'].join(':');
                                }
                            }
                        }
                    }
                    console.log(JSON.parse('{' + insertdata.join(',') + '}'))
                    /*insertdata.splice(0, 1);*/
                    if (update) {
                        try {
                            query.update(update, {$set: JSON.parse('{' + insertdata.join(',') + '}')});
                        } catch (e) {

                        }
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
        database.collection('modelos').find({}).toArray(function (err, modelos) {
            database.collection('servicios').find({}).toArray(function (err, servicios) {
                database.collection('asociados').find({}).toArray(function (err, asociados) {
                    var pagos_importados = [];
                    var run_asociado, run_pago;
                    var importar_pago = true;
                    var servicios_agregados;
                    for (var x in asociados) {
                        run_asociado = asociados[x].run;
                        if (!RutJS.isValid(run_asociado)) {
                            importar_pago = false;
                            var out = '';
                            for (var t in asociados[x]) {
                                out += t.toUpperCase() + ': ' + asociados[x][t] + '\n';
                            }
                            cb({
                                success: false,
                                message: 'Se ha encontrado un registro de asociado sin RUT.\n Se ha interrumpido la importación de pagos favor corrija el registro en la sección de Asociados:\nRespuesta del servidor:\n\n' + out
                            });
                        }
                        var out = '';
                        for (var y in pagos) {
                            run_pago = pagos[y].run;
                            if (!RutJS.isValid(run_pago)) {
                                importar_pago = false;
                                out += '\n';
                                for (var t in pagos[y]) {
                                    out += t.toUpperCase() + ': ' + pagos[y][t] + '\n';
                                }
                                out += 'Linea ' + ((y - 0) + (2 - 0)) + '\n';
                            } else {
                                servicios_agregados = [{
                                        nombre: 'ADT',
                                        valor: pagos[y].tarifa,
                                        adm: false
                                    }
                                ];
                                if (typeof servicios == 'object') {
                                    for (var z in servicios) {
                                        if (typeof servicios[z].valor == 'string') {
                                            servicios[z].valor = parseFloat(servicios[z].valor.replace(/,/g, '.'));
                                        }
                                        servicios_agregados[servicios_agregados.length] = {
                                            nombre: servicios[z].nombre,
                                            valor: servicios[z].valor,
                                            adm: false
                                        }
                                    }
                                }
                                if (asociados[x].tipo_casa) {
                                    for (var z in modelos) {
                                        if (modelos[z]._id == asociados[x].tipo_casa) {
                                            if (typeof modelos[z].valor == 'string') {
                                                modelos[z].valor = parseFloat(modelos[z].valor.replace(/,/g, '.'));
                                            }
                                            var admin = 0;
                                            for (var h in servicios_agregados) {
                                                if (!servicios_agregados[h].adm) {
                                                    admin += servicios_agregados[h].valor;
                                                }
                                            }
                                            servicios_agregados[servicios_agregados.length] = {
                                                nombre: 'Administración',
                                                valor: modelos[z].valor - admin,
                                                adm: true
                                            }
                                            break;
                                        }
                                    }
                                    pagos_importados[pagos_importados.length] = {
                                        nombre: asociados[x].nombre,
                                        run: RutJS.cleanRut(asociados[x].run),
                                        codigo: pagos[y].codigo,
                                        tarifa: servicios_agregados,
                                        status: 'Pendiente',
                                        month: pagos[y].month,
                                        year: pagos[y].year
                                    }
                                }
                                break;
                            }
                        }
                    }
                    if (importar_pago) {
                        dehesaPagos.procesar(database.collection('pagos'), pagos_importados, 0, function () {
                            //cb({success: true});
                        });
                    } else {
                        cb({
                            success: false,
                            message: 'Se han encontrado registros de asociados con RUT inválidos.\n Se ha interrumpido la importación de pagos favor corrija el registro en el archivo de carga de pagos:\n\n' + out
                        });
                    }
                });
            });
        });
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
