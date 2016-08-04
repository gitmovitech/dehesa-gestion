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
var checkAndInsertAsociado = function (asociados, data, index, cb) {
    if (data[index]) {
        asociados.findOne({
            "run": data[index].run
        }, function (err, response) {
            if (!response) {
                if (data[index].run)
                    asociados.insert({
                        nombre: data[index].nombre,
                        apellidos: '',
                        email: '',
                        run: data[index].run,
                        celular: '',
                        telefono: '',
                        direccion: data[index].direccion
                    });
            }
            checkAndInsertAsociado(asociados, data, index + 1, cb);
        });
    } else {
        cb();
    }
}
exports.addMonthPayment = function (data, cb) {
    if (database) {
        checkAndInsertAsociado(database.collection('asociados'), data, 0, function () {
            database.collection('pagos').findOne({
                month: new Date().getMonth(),
                year: new Date().getFullYear()
            }, function (err, response) {
                if (response) {
                    cb(false, 'Los datos de este mes ya se encuentran cargados');
                } else {
                    dehesaPagos.procesar(database.collection('pagos'), data, 0, cb);
                }
            });
        });
    }
}