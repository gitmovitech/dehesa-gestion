var ObjectID = require('mongodb').ObjectID;
var RutJS = require('./RutJS');
var procesar = function (collection, data, index, cb) {
    if (typeof data[index] == 'object') {
        if (data[index].run) {
            collection.findOne({
                month: data[index].month,
                year: data[index].year,
                run: RutJS.cleanRut(data[index].run)
            }, function (err, response) {
                if (!response) {
                    var deudames = 0;
                    for (var x in data[index].tarifa) {
                        deudames += data[index].tarifa[x].valor
                    }
                    collection.insert({
                        run: RutJS.cleanRut(data[index].run),
                        codigo: data[index].codigo,
                        tarifa: data[index].tarifa,
                        pagado: 0,
                        debe: deudames,
                        excedente: 0,
                        type: data[index].status,
                        month: data[index].month,
                        year: data[index].year
                    });
                } else {
                    collection.update({
                        run: RutJS.cleanRut(data[index].run),
                        month: data[index].month,
                        year: data[index].year
                    }, {
                            $set: {
                                codigo: data[index].codigo,
                                tarifa: data[index].tarifa,
                                type: data[index].status
                            }
                        });
                }
                procesar(collection, data, index + 1, cb);
            });
        } else {
            procesar(collection, data, index + 1, cb);
        }
    } else {
        cb();
    }
}
exports.procesar = procesar;


var pagar = function () {

}
exports.pagar = pagar;

var serviciosAsociados = [];
var obtenerServicioAsociado = function (collection, data, index, cb) {
    if (data[index]) {
        collection.findOne({ _id: ObjectID(data[index]) }, function (err, servicios) {
            var add = true;
            for (var x in serviciosAsociados) {
                if (servicios._id == serviciosAsociados[x]._id) {
                    add = false;
                    break;
                }
            }
            if (add)
                serviciosAsociados[serviciosAsociados.length] = servicios;
            obtenerServicioAsociado(collection, data, index + 1, cb);
        });
    } else {
        cb(serviciosAsociados);
    }
}
var obtenerCobrosIndividualesAsociados = function (database, data, index, cb) {
    if (data[index]) {
        database.collection('asociados').findOne({ run: data[index].run }, function (err, asociados) {
            /*if (asociados.modelo) {
             database.collection('modelos').findOne({_id: ObjectID(asociados.modelo)}, function (err, modelo) {
             data[index].modelo = modelo;
             if (asociados.servicios) {
             obtenerServicioAsociado(database.collection('servicios'), asociados.servicios, 0, function (servicios) {
             data[index].servicios = servicios;
             obtenerCobrosIndividualesAsociados(database, data, index + 1, cb);
             });
             }
             });
             } else if (asociados.servicios) {
             obtenerServicioAsociado(database.collection('servicios'), asociados.servicios, 0, function (servicios) {
             data[index].servicios = servicios;
             obtenerCobrosIndividualesAsociados(database, data, index + 1, cb);
             });
             } else {*/
            obtenerCobrosIndividualesAsociados(database, data, index + 1, cb);
            //}
        });
    } else {
        serviciosAsociados = [];
        cb(data);
    }
}
exports.obtenerCobrosIndividualesAsociados = obtenerCobrosIndividualesAsociados;

/**
 * Sumar cargos anteriores
 */
var sumarDeudasAnteriores = function (pagos, data, index, cb) {
    if (data[index]) {
        pagos.find({ run: data[index].run }).toArray(function (err, response) {
            console.log(response);
            sumarDeudasAnteriores(pagos, data, index + 1, cb);
        });
    } else {
        cb(data);
    }
}


/**
NUEVO PROCEDIMIENTO DE AUTOCARGA MENSUAL
*/
function daysInMonth(humanMonth, year) {
    return new Date(year || new Date().getFullYear(), humanMonth + 1, 0).getDate();
}
var insertarPagodelMes = function (database, fecha, response, cb, debe_total, excedentes_total) {
    var tarifa = parseFloat(response.uf) * parseFloat(current_uf);
    var debe = tarifa;
    var excedentes = 0;
    if (typeof debe_total != 'undefined') {
        debe += debe_total;
    }
    if (debe == 0) {
        debe = tarifa;
    }
    if (typeof excedentes_total != 'undefined') {
        excedentes = excedentes_total;
    }
    database.collection('pagos').insert({
        id: response.id,
        nombre: [response.first_name, response.last_name].join(' '),
        dias: 30,//daysInMonth(fecha.month, fecha.year),
        tarifa: tarifa,
        type: 'Pendiente',
        pagado: 0,
        debe: tarifa,//debe,
        excedentes: excedentes,
        deuda: debe,
        ajuste_contable: 0,
        month: fecha.month,
        year: fecha.year,
        opened: true
    });
    cb();
}
var obtenerDeudasyPagosAnteriores = function (database, fecha, response, i, cb) {
    if (typeof response[i] != 'undefined') {
        database.collection('pagos').find({
            id: response[i].id
        }).sort({
            "_id": -1
        }).limit(1).toArray(function (err, data) {
            var debe_total = 0;
            var excedentes = 0;
            if (data.length > 0) {
                for (var x in data) {
                    debe_total = parseFloat(data[x].debe)
                    if (typeof data[x].excedentes == 'undefined') {
                        excedentes = 0
                    }
                    else {
                        excedentes = data[x].excedentes;
                    }
                }
                insertarPagodelMes(database, fecha, response[i], function () {
                    obtenerDeudasyPagosAnteriores(database, fecha, response, i + 1, cb);
                }, debe_total, excedentes);
            } else {
                insertarPagodelMes(database, fecha, response[i], function () {
                    obtenerDeudasyPagosAnteriores(database, fecha, response, i + 1, cb);
                });
            }
        });
    } else {
        cb();
    }
}

var current_uf;
var meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

var autocompletarPagosDelMes = function (database, fecha, cb) {
    var collection = database.collection('valoresuf');
    //BUSCAR UF DEL MES
    collection.findOne({
        year: fecha.year,
        mes: meses[fecha.month]
    }, function (err, valoresuf) {
        if (valoresuf) {

            current_uf = valoresuf.valor;
            collection = database.collection('asociados');
            //BUSCAR SOCIOS PARA COMPLETAR MES DE PAGO
            collection.find({ "activo": 1 }).toArray(function (err, response) {
                if (response.length > 0) {
                    obtenerDeudasyPagosAnteriores(database, fecha, response, 0, function () {
                        cb();
                    });
                } else {
                    cb([]);
                }
            });

        } else {
            cb([]);
        }
    });

}
exports.autocompletarPagosDelMes = autocompletarPagosDelMes;

