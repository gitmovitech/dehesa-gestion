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
                    collection.insert({
                        run: RutJS.cleanRut(data[index].run),
                        codigo: data[index].codigo,
                        tarifa: data[index].tarifa,
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


var pagar = function(){
    
}
exports.pagar = pagar;

var serviciosAsociados = [];
var obtenerServicioAsociado = function (collection, data, index, cb) {
    if (data[index]) {
        collection.findOne({_id: ObjectID(data[index])}, function (err, servicios) {
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
        database.collection('asociados').findOne({run: data[index].run}, function (err, asociados) {
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
        pagos.find({run: data[index].run}).toArray(function (err, response) {
            console.log(response);
            sumarDeudasAnteriores(pagos, data, index + 1, cb);
        });
    } else {
        cb(data);
    }
}
/**
 * Restar saldo a favor
 */
