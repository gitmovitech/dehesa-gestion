if (process.argv[2]) {
    var MongoClient = require('mongodb').MongoClient;
    var config = require('./config');
    var url = 'mongodb://localhost:27017/' + config.mongo.name;
    var filename = process.argv[2];
    var xlsx = require('node-xlsx');
    var fs = require('fs');
    var RutJS = require('./RutJS');
    var dateFormat = function (number) {
        var fecha = new Date(1900, 0, number - 1);
        fecha
    }
    var findiInsertRut = function (db, data, x) {
      var rut = data[x][6];
      rut = rut.toString();
        db.collection('asociados').findOne({
            run: RutJS.cleanRut(rut)
        }, function (err, response) {
            if (!response) {
                var json = {
                    id: data[x][0],
                    /*monitoreo: data[x][1],
                    numero_cliente: data[x][2],
                    tipo_conexion: data[x][3],*/
                    fecha_ingreso: new Date(1900, 0, data[x][4] - 1).getTime(),
                    usuario: data[x][5],
                    run: RutJS.cleanRut(rut),
                    nombre: data[x][7],
                    direccion: data[x][8],
                    numeracion: data[x][9],
                    telefono: data[x][10],
                    correo: data[x][11],
                    correo_alternativo: data[x][12],
                    formas_pago: data[x][13],
                    activo: true
                }
                db.collection('asociados').insert(json);
            }
        });
    }
    if (fs.existsSync(filename)) {
        MongoClient.connect(url, function (err, db) {
            if (!err) {
                console.log("Conectado a " + config.mongo.name + " DB");
                var data;
                try {
                    data = xlsx.parse(fs.readFileSync(filename));
                } catch (e) {
                    console.log('El archivo excel subido no es válido. Suba el archivo en formato excel y con el formato adecuado.');
                    process.exit();
                }
                data = data[0].data;
                for (var x in data) {
                    if (x > 0) {
                        if (data[x][0]) {
                          console.log('Procesando '+data[x][0]);
                            /*if (!RutJS.isValid(data[x][6])) {
                                console.log('EL RUT:' + data[x][6] + ' es inválido');
                            } else {*/
                                for (var i in data[x]) {
                                    if (!data[x][i]) {
                                        data[x][i] = '';
                                    } else if (i == 1 || i == 2 || i == 3 || i == 13) {
                                        if (typeof data[x][i].toUpperCase == 'function')
                                            data[x][i] = data[x][i].toUpperCase();
                                    } else if (i == 11 || i == 12) {
                                        if (typeof data[x][i].toLowerCase == 'function')
                                            data[x][i] = data[x][i].toLowerCase();
                                    }
                                }
                                findiInsertRut(db, data, x);
                            //}
                        }
                    }
                }
            } else {
                console.log(err);
            }
            //process.exit();
        });
    }
}
