var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var md5 = require('md5');
var config = require('./config');
var url = 'mongodb://localhost:27017/' + config.mongo.name;
var database;
var sendmail = require('./sendmail');
var dehesaPagos = require('./dehesa-procesos-pagos');
var RutJS = require('./RutJS');
var fs = require('fs');
var periodos_months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
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
        database.createCollection('encuestas_respuestas');
    } else {
        console.log(err);
    }
});
exports.signin = function (data, callback) {
    var users = database.collection('users');
    users.findOne({ "email": data.email, "password": md5(data.password) }, function (err, response) {
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
    users.findOne({ "email": email }, function (err, response) {
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
var valoresUFHistorialPagos = function (months, response, x, cb, deudapesos) {
    if (response[x]) {
        var deuda = 0;
        var sumauf = 0;
        switch (response[x].type) {
            case 'Pendiente':
            case 'PAC PAT rechazado':
            case 'Cheque recibido':
                for (var t in response[x].tarifa) {
                    sumauf += response[x].tarifa[t].valor;
                }
                deuda += sumauf;
                break;
        }
        if (deuda == 0) {
            valoresUFHistorialPagos(months, response, x + 1, cb, deudapesos);
        } else {
            database.collection('valoresuf').findOne({
                mes: months[response[x].month],
                year: response[x].year
            }, function (err, answer) {
                if (answer) {
                    if (answer.valor.indexOf(',') >= 0) {
                        answer.valor = answer.valor.replace(/,/g, '.');
                    }
                    deudapesos += deuda * answer.valor;
                }
                valoresUFHistorialPagos(months, response, x + 1, cb, deudapesos);
            });
        }
    } else {
        cb(deudapesos);
    }
}
var getResumenHistorialPagos = function (data, index, cb, months) {
    if (data[index]) {
        if (typeof data[index].run != 'undefined') {
            database.collection('pagos_historial').find({
                run: data[index].run
            }).toArray(function (err, response) {
                if (response.length > 0) {
                    var debe = 0;
                    var haber = 0;
                    for (var x in response) {
                        debe += response[x].debe;
                        haber += response[x].haber;
                    }
                    if (debe == haber) {
                        data[index].debe = 0;
                        data[index].haber = 0;
                    } else if (debe > haber) {
                        data[index].debe = debe - haber;
                        data[index].haber = 0;
                    } else if (debe < haber) {
                        data[index].haber = haber - debe;
                        data[index].debe = 0;
                    }
                    database.collection('pagos').find({
                        run: data[index].run
                    }).toArray(function (err, response) {

                        valoresUFHistorialPagos(months, response, 0, function (deuda) {
                            data[index].debe += deuda - data[index].haber;
                            data[index].haber -= deuda;
                            if (data[index].debe < 0) {
                                data[index].debe = 0;
                            }
                            if (data[index].haber < 0) {
                                data[index].haber = 0;
                            }
                            getResumenHistorialPagos(data, index + 1, cb, months);
                        }, 0);
                    });

                } else {
                    getResumenHistorialPagos(data, index + 1, cb, months);
                }
            });
        } else {
            getResumenHistorialPagos(data, index + 1, cb, months);
        }
    } else {
        cb(data);
    }
}
exports.getResumenHistorialPagos = getResumenHistorialPagos;
var getCollection = function (collection, callback, data, join) {
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
                    if (data.uid && collection == 'asociados') {
                        try {
                            query.findOne({ "id": data.uid }, function (err, response) {
                                if (!err) {
                                    callback(response);
                                } else {
                                    console.log(err)
                                    callback([]);
                                }
                            });
                        } catch (e) {
                            callback([]);
                        }
                    } else if (data.id) {
                        try {
                            query.findOne({ "_id": ObjectID(data.id) }, function (err, response) {
                                if (!err) {
                                    callback(response);
                                } else {
                                    console.log(err)
                                    callback([]);
                                }
                            });
                        } catch (e) {
                            callback([]);
                        }
                    } else {
                        if (typeof data == 'string') {
                            data = JSON.parse(data);
                        }

                        query.find(data).sort({ id: 1 }).toArray(function (err, response) {
                            if (!err) {

                                if (collection == 'pagos' && response.length == 0) {
                                    //AUTOCOMPLETAR PAGOS DEL MES SI NO EXISTEN PARA PODER EXPORTARLOS
                                    dehesaPagos.autocompletarPagosDelMes(database, data, function () {
                                        query.find(data).sort({ id: 1 }).toArray(function (err, response) {
                                            callback(response);
                                        });
                                    });
                                } else {
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
                                }

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
            } else {
                callback([]);
            }
        });
    } else {
        callback([]);
    }
}
exports.getCollection = getCollection;
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
                    var json = { "_id": ObjectID(data.value) }

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
                    query.findOne({ "email": insertdata.email }, function (err, response) {
                        if (!err) {
                            if (response) {
                                if (response.password != insertdata.password) {
                                    insertdata.password = md5(insertdata.password);
                                }
                                query.update({ "email": insertdata.email }, insertdata);
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
                    var id, year, month;
                    var archivosPorGuardar = [];
                    /**
                    BUSCAR ID, YEAR Y MES
                    **/
                    for (var z in data) {
                        if (data[z].name == 'id')
                            id = data[z].value;
                        if (data[z].name == 'year')
                            year = data[z].value;
                        if (data[z].name == 'month')
                            month = data[z].value;
                        if (data[z].type == "number") {
                            data[z].value = data[z].value - 0;
                        }
                    }
                    for (var z in data) {
                        if (data[z].name == '_id' && data[z].value != '') {
                            update = {
                                "_id": ObjectID(data[z].value)
                            }
                        } else {
                            if (data[z].name == '_id' && data[z].value == '') {
                                data.splice(z, 1);
                            }
                            if (data[z].value >= 0 && data[z].value != '') {
                                insertdata[insertdata.length] = [JSON.stringify(data[z].name), JSON.stringify(data[z].value)].join(':');
                            } else {
                                if (data[z].name == 'archivos') {
                                    try {
                                        /**
                                        ARCHIVOS
                                        **/
                                        if (!fs.existsSync(__dirname + '/uploads/documents')) {
                                            fs.mkdirSync(__dirname + '/uploads/documents', 0777);
                                        }
                                        if (!fs.existsSync(__dirname + '/uploads/documents/' + id)) {
                                            fs.mkdirSync(__dirname + '/uploads/documents/' + id, 0777);
                                        }
                                        if (!fs.existsSync(__dirname + '/uploads/documents/' + id + '/' + year)) {
                                            fs.mkdirSync(__dirname + '/uploads/documents/' + id + '/' + year, 0777);
                                        }
                                        if (!fs.existsSync(__dirname + '/uploads/documents/' + id + '/' + year + '/' + month)) {
                                            fs.mkdirSync(__dirname + '/uploads/documents/' + id + '/' + year + '/' + month, 0777);
                                        }
                                        for (var k in data[z].value) {
                                            fs.renameSync(__dirname + '/uploads/' + data[z].value[k], __dirname + '/uploads/documents/' + id + '/' + year + '/' + month + '/' + data[z].value[k]);
                                        }
                                        dir = fs.readdirSync(__dirname + '/uploads/documents/' + id + '/' + year + '/' + month);
                                        console.log('archivos', dir)
                                        if (dir.length == 0) {
                                            dir = '-';
                                        }
                                        insertdata[insertdata.length] = [JSON.stringify(data[z].name), JSON.stringify(dir)].join(':');
                                    } catch (e) {

                                    }
                                } else if (data[z].value != '' && typeof data[z].value != 'undefined') {
                                    insertdata[insertdata.length] = [JSON.stringify(data[z].name), JSON.stringify(data[z].value)].join(':');
                                } else if (data[z].name == 'activo') {
                                    insertdata[insertdata.length] = [JSON.stringify(data[z].name), data[z].value].join(':');
                                } else {
                                    insertdata[insertdata.length] = [JSON.stringify(data[z].name), '""'].join(':');
                                }
                            }
                        }
                    }
                    console.log('UPDATE ASOCIADOS')
                    for (var x in insertdata) {
                        if (insertdata[x].charAt(0) == ':') {
                            insertdata.splice(x, 1);
                        }
                        if (insertdata[x].charAt(insertdata[x].length - 1) == ':') {
                            insertdata.splice(x, 1);
                        }
                    }
                    //console.log(insertdata);
                    console.log(JSON.parse('{' + insertdata.join(',') + '}'));
                    /*insertdata.splice(0, 1);*/
                    if (update) {
                        console.log("ACTUALIZANDO")
                        console.log(update);
                        try {
                            query.update(update, { $set: JSON.parse('{' + insertdata.join(',') + '}') });
                        } catch (e) {
                            console.log(e);
                        }
                    } else {
                        console.log("INSERTANDO")
                        insertdata.push('"activo":1');
                        //console.log(insertdata);
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
exports.dropFile = function (data, files, cb) {
    if (files.length == 0) {
        files = '-';
    }
    database.collection('pagos').update({
        id: parseInt(data.id),
        year: parseInt(data.year),
        month: parseInt(data.month)
    }, {
            $set: {
                archivos: files
            }
        });
    cb();
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
                query.update({ "_id": ObjectID(id) }, { $set: data });
                callback();
            }
        });
    }
}

/**
 * PAGOS
 */
exports.getModelos = function (cb) {
    database.collection('modelos').find({}).toArray(function (err, modelos) {
        cb(modelos);
    });
}
exports.getServicios = function (cb) {
    database.collection('servicios').find({}).toArray(function (err, servicios) {
        cb(servicios);
    });
}
exports.getAsociados = function (cb) {
    database.collection('asociados').find({
        $query: {},
        $orderby: { id: 1 }
    }).toArray(function (err, asociados) {
        cb(asociados);
    });
}

exports.getAsociadosActivos = function (cb) {
    database.collection('asociados').find({
        $query: { activo: 1 },
        $orderby: { id: 1 }
    }).toArray(function (err, asociados) {
        cb(asociados);
    });
}


var obtenerDeudasAnteriores = function (registros_importados, x, cb) {
    if (registros_importados[x]) {
        var mes = registros_importados[x].month - 1;
        var year = registros_importados[x].year;
        if (mes < 0) {
            mes = 11;
            year = year - 1;
        }
        database.collection('pagos').findOne({
            $query: {
                id: registros_importados[x].id,
                year: year,
                month: mes
            },
            $orderby: { $natural: -1 }
        }, function (err, response) {
            if (response) {
                registros_importados[x].debe += response.debe;
            }
            obtenerDeudasAnteriores(registros_importados, x + 1, cb);
        })
    } else {
        cb(registros_importados);
    }
}
exports.obtenerDeudasAnteriores = obtenerDeudasAnteriores;


var obtenerExcedentes = function (registros_importados, x, cb) {
    if (registros_importados[x]) {
        if (registros_importados[x].estado == 'Pendiente') {
            var mes = registros_importados[x].month - 1;
            var year = registros_importados[x].year;
            if (mes < 0) {
                mes = 11;
                year = year - 1;
            }
            database.collection('pagos').findOne({
                $query: {
                    id: registros_importados[x].id,
                    year: year,
                    month: mes
                },
                $orderby: { $natural: -1 }
            }, function (err, response) {
                if (response) {
                    registros_importados[x].excedentes = response.excedentes;
                    if (registros_importados[x].excedentes < 0) {
                        registros_importados[x].excedentes = 0;
                    }
                } else {
                    registros_importados[x].excedentes = 0;
                }
                obtenerExcedentes(registros_importados, x + 1, cb);
            })
        } else {
            obtenerExcedentes(registros_importados, x + 1, cb);
        }
    } else {
        cb(registros_importados);
    }
}
exports.obtenerExcedentes = obtenerExcedentes;
exports.guardarImportacionPagos = function (pagos, cb) {
    database.collection('asociados').find({
        'activo': true
    }).toArray(function (err, asociados) {
        database.collection('pagos').find({
            year: pagos.year,
            month: pagos.month
        }).toArray(function (err, response) {
            num = 0;
            if (response.length > 0) {
                for (var t in asociados) {
                    for (var x in pagos.data) {
                        if (asociados[t].id == pagos.data[x].id) {
                            for (var z in response) {
                                if (response[z].id == pagos.data[x].id) {
                                    if (response[z].type != 'No importado') {

                                        if (response[z].pagado == 0) {
                                            database.collection('pagos').update({
                                                id: pagos.data[x].id
                                            }, {
                                                    $set: {
                                                        id: pagos.data[x].id,
                                                        nombre: pagos.data[x].nombre,
                                                        tarifa: pagos.data[x].tarifa,
                                                        type: pagos.data[x].estado,
                                                        pagado: pagos.data[x].pagado,
                                                        debe: pagos.data[x].debe,
                                                        excedentes: pagos.data[x].excedentes,
                                                        ajuste_contable: pagos.data[x].ajuste_contable,
                                                        comentarios: pagos.data[x].comentarios,
                                                        archivos: pagos.data[x].archivos
                                                    }
                                                });
                                            break;
                                        }
                                    }
                                }
                            }
                            break;
                        }
                    }
                }
            } else {
                for (var t in asociados) {
                    for (var x in pagos.data) {
                        if (asociados[t].id == pagos.data[x].id) {
                            database.collection('pagos').insert({
                                id: pagos.data[x].id,
                                nombre: pagos.data[x].nombre,
                                tarifa: pagos.data[x].tarifa,
                                type: pagos.data[x].estado,
                                pagado: pagos.data[x].pagado,
                                debe: pagos.data[x].debe,
                                excedentes: pagos.data[x].excedentes,
                                comentarios: pagos.data[x].comentarios,
                                archivos: pagos.data[x].archivos,
                                month: pagos.month,
                                year: pagos.year
                            });
                            break;
                        }
                    }
                }
            }
            cb();
        });
    });
}




exports.getPayments = function (params, cb) {
    console.log(params);
    if (database) {
        database.collection('pagos').find({
            month: parseInt(params.month),
            year: parseInt(params.year)
        }).sort({ id: 1 }).toArray(function (err, response) {
            if (response) {
                cb(response);
            } else {
                cb(false);
            }
        });
    }
}



exports.getAsociado = function (params, cb) {
    if (database) {
        database.collection('asociados').findOne({
            id: parseInt(params.id)
        }, function (err, response) {
            if (response) {
                cb(response);
            } else {
                cb(false);
            }
        });
    }
}



exports.getPaymentsForBank = function (params, cb) {
    if (database) {
        database.collection('pagos')
            .aggregate([
                { $match: { "year": parseInt(params.year), "month": parseInt(params.month), "pagado": 0, "activo": 1 } },
                { $lookup: { "localField": "id", "from": "asociados", "foreignField": "id", "as": "socio" } },
                { $unwind: "$socio" }
            ])
            .sort({ id: 1 })
            .toArray(function (err, response) {
                console.log(err);
                console.log(response);
                if (response) {
                    cb(response);
                } else {
                    cb(false);
                }
            });
    }
}

exports.pagar = function (data, collection, cb) {
    if (database) {
        switch (data.status) {
            case 'PAC Cargado':
            case 'PAT Cargado':
            case 'Mandato Anulado en Banco':
            case 'Falta de Fondos':
            case 'Monto a Pagar Excede el Máximo Permitido':
            case 'Cuenta con Orden de Cierre':
            case 'Rechazo por Tarjeta Bloqueada':
            case 'Rechazo Tarjeta no Existe':
            case 'Rechazo Tarjeta Perdida o Robada':
            case 'Rechazo Tarjeta con Problemas':
            case 'Rechazo Tarjeta Vencida':
            case 'Cheque recibido':
                database.collection(collection).update({
                    id: parseInt(data.id),
                    month: parseInt(data.month),
                    year: parseInt(data.year)
                }, {
                        $set: {
                            estado: data.status
                        }
                    });
                cb();
                break;
            case 'Pagado con excedentes':
            case 'Pagado fuera de plazo (+ 20%)':
            case 'Pagado con transferencia':
            case 'Pagado en efectivo':
            case 'Pagado con cheque':
            case "Pagos Procesados":
            case "Aprobada":

                var debe = data.tarifa - parseInt(data.pago);
                var excedentes = 0;
                var ajuste_contable = 0;

                if (debe <= 4000 && debe > 0) { // DIFERENCIA SE VA A AJUSTE CONTABLE
                    ajuste_contable = debe;
                    debe = 0;
                } else if (debe < 0) { // DIFERENCIA SE VA EXCEDENTES
                    excedentes = debe * -1;
                    debe = 0;
                }

                database.collection(collection).update({
                    id: parseInt(data.id),
                    month: parseInt(data.month),
                    year: parseInt(data.year)
                }, {
                        $set: {
                            estado: data.status,
                            excedentes: excedentes,
                            debe: debe,
                            ajuste_contable: ajuste_contable,
                            pagado: parseInt(data.pago)
                        }
                    }, function (err, response) {
                        cb();
                    });

                //OBTENER VALORES UF
                /*database.collection('valoresuf').findOne({
                    mes: periodos_months[data.month]
                }, function (err, ufs) {
                    ufs.valor = ufs.valor.toString();
                    ufs.valor = ufs.valor.replace(',', '.');
                    ufs.valor = parseFloat(ufs.valor);

                    //OBTENER DATOS MES ANTERIOR
                    var month = data.month - 1;
                    var year = data.year;
                    if (month < 0) {
                        month == 11;
                        year--;
                    }
                    database.collection('pagos').findOne({
                        id: data.id,
                        month: month,
                        year: year
                    }, function (err, pago) {
                        data.debe = 0;
                        data.excedentes = 0;

                        console.log("PAGO");
                        console.log(data);
                        console.log("PAGO");

                        if (pago) {
                            if (pago.debe > 0) {
                                data.debe = pago.debe * ufs.valor;
                            }
                            data.excedentes = pago.excedentes;
                        }
                        data.debe += data.cobrodelmes;

                        if (data.debe == data.pago) {
                            if (data.status == 'Pagado con excedentes') {
                                data.excedentes = data.excedentes - data.pago;
                            }
                            data.debe = 0;
                        } else if (data.debe > data.pago) {
                            data.debe = (data.debe - data.pago) / ufs.valor;
                        } else if (data.debe < data.pago) {
                            data.excedentes = data.pago - data.debe;
                            data.debe = 0;
                        }
                        console.log(data);

                        //ACTUALIZAR PAGOS
                        database.collection('pagos').update({
                            id: data.id,
                            month: data.month,
                            year: data.year
                        }, {
                                $set: {
                                    type: data.status,
                                    excedentes: data.excedentes,
                                    debe: data.debe,
                                    pagado: data.pago
                                }
                            }, function (err, response) {
                                cb();
                            });

                    });

                });*/
                break;
        }
    }
}

exports.pagarCuentasCobrar = function (data, cb) {
    database.collection('cuentas_por_cobrar').update({
        id: data.id,
        month: data.month,
        year: data.year
    }, {
            $set: {
                type: 'Pagado',
                deuda: 0,
                pagado: data.pago
            }
        }, function (err, response) {
            cb();
        });
}

exports.getUserByRun = function (run, cb) {
    database.collection('asociados').findOne({
        run: run
    }, function (er, response) {
        cb(response);
    });
}

exports.savePayment = function (data) {
    data.month = parseInt(data.month);
    data.year = parseInt(data.year);
    database.collection('pagos').findOne({
        id: data.id,
        month: data.month,
        year: data.year
    }, function (err, response) {
        if (!response) {
            database.collection('pagos').insert(data);
        } else {
            database.collection('pagos').update({
                id: data.id,
                month: parseInt(data.month),
                year: parseInt(data.year)
            }, {
                    $set: {
                        pagado: parseInt(data.pagado),
                        debe: parseInt(data.debe),
                        estado: data.estado,
                        comentarios: data.comentarios
                    }
                });
        }
    });
}

exports.modificarDias = function (data, cb) {
    var query = {
        _id: ObjectID(data._id)
    }
    var values = {
        $set: {
            dias: data.dias
        }
    }
    console.log(query);
    console.log(values);
    database.collection('pagos').update(query, values);
    cb();
}






exports.cerrarMes = function (data, cb) {
    var query = {
        month: parseInt(data.month),
        year: parseInt(data.year)
    }
    var values = {
        $set: {
            opened: false
        }
    }
    var asociados = [];
    var pagos = [];
    var email_to = [];
    database.collection('pagos').find(query).toArray(function (err, response) {
        var pagos = response;
        database.collection('asociados').find({ activo: 1 }).toArray(function (err, response) {
            var asociados = response;
            for (var p in pagos) {
                email_to = [];
                for (var a in asociados) {
                    if (asociados[a].id == pagos[p].id) {
                        if (asociados[a].correo11 != '') {
                            email_to.push(asociados[a].correo11);
                        }
                        if (asociados[a].correo12 != '') {
                            email_to.push(asociados[a].correo12);
                        }
                        if (asociados[a].correo21 != '') {
                            email_to.push(asociados[a].correo21);
                        }
                        if (asociados[a].correo22 != '') {
                            email_to.push(asociados[a].correo22);
                        }
                        if (email_to.length > 0) {
                            database.collection('notify').insert({
                                nombre: [asociados[a].first_name2, asociados[a].last_name2].join(' '),
                                correos: email_to.join(','),
                                estado: pagos[p].estado,
                                month: parseInt(data.month),
                                year: parseInt(data.year)
                            });
                        }
                        break;
                    }
                }
            }
        });
    });
    //database.collection('pagos').update(query, values, { multi: true });
    cb(query);
}





exports.getUF = function (data, cb) {
    database.collection('valoresuf').findOne({
        mes: periodos_months[data.month],
        year: parseInt(data.year)
    }, function (er, response) {
        cb(response);
    });
}






exports.pasarCuentasPorCobrar = function (query, cb) {
    query.type = "Pendiente";
    var values = {
        $set: {
            opened: false
        }
    }
    database.collection('pagos').find(query).toArray(function (err, data) {
        if (data.length > 0) {
            data.forEach(function (item, i) {
                delete item["_id"];
                if (typeof item.comentarios == 'undefined') {
                    item.comentarios = '';
                }
                if (typeof item.archivos == 'undefined') {
                    item.archivos = '';
                }
                database.collection('cuentas_por_cobrar').insert(item);
            });
            cb();
        } else {
            cb();
        }
    });

}



exports.getHistorialPagos = function (query, cb) {
    database.collection('pagos').find({
        id: query.id
    }).sort({ $natural: -1 }).toArray(function (er, response) {
        cb(response);
    });
}