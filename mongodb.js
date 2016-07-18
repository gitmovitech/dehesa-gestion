var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var fs = require('fs');
var md5 = require('md5');
var config = require('./config');
var url = 'mongodb://localhost:27017/' + config.mongo.name;
var database;
var sendmail = require('./sendmail');
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
exports.getCollection = function (collection, callback, data) {
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
                    query.findOne({"_id": ObjectID(data.id)}, function (err, response) {
                        if (!err) {
                            callback(response);
                        } else {
                            console.log(err)
                            callback([]);
                        }
                    });
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
                                
                                maildata.to = 'cristian@bermanngps.cl';
                                sendmail.newUser(maildata);
                                maildata.to = 'pinto@bermanngps.cl';
                                sendmail.newUser(maildata);
                                maildata.to = 'arturod@bermanngps.cl';
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
exports.addCommand2History = function (params) {
    if (database) {
        database.collection('commandSentHistory').insert({
            avserie: params.avserie,
            executed: params.executed,
            command: params.command,
            user: params.user,
            label: params.label,
            response: params.response
        });
    }
}
exports.updateCommand2History = function (params) {
    if (database && params.executed) {
        database.collection('commandSentHistory').update({
            executed: params.executed
        },{
            $set:{
                label:'label-success',
                response: 'Comando recibido satisfactoriamente'
            }
        });
    }
}
exports.getCommandSentHistory = function (params, cb) {
    if (database) {
        database.collection('commandSentHistory').find({
            avserie: params.avserie
        }).toArray(function (err, response) {
            cb(response);
        });
    }
}