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

    if (fs.existsSync(filename)) {
        MongoClient.connect(url, function (err, db) {
            if (!err) {
                console.log("Conectado a " + config.mongo.name + " DB");
                var data = false;
                try {
                    data = xlsx.parse(fs.readFileSync(filename));
                } catch (e) {
                    console.log('El archivo excel subido no es válido. Suba el archivo en formato excel y con el formato adecuado.');
                    process.exit();
                }
                if(data){
                  var excel = data[0].data;
                  excel.forEach(function(item, i){
                    if(i > 1){
                      db.collection('asociados').findOne({
                          id: item[0]
                      }, function (err, response) {
                        if(!response){
                          var correos = item[10];
                          if(correos){
                            correos = correos.split(';');
                            if(!correos[0]){
                              correos[0] = '';
                            }
                            if(!correos[1]){
                              correos[1] = '';
                            }
                          } else{
                            correos = ['',''];
                          }

                          db.collection('asociados').insert({
                              id: item[0],
                              run: item[13],
                              persona: 'PERSONA NATURAL',
                              razon_social: '',
                              first_name: item[6],
                              second_name: item[7],
                              last_name: item[8],
                              second_last_name: item[9],
                              direccion: item[2],
                              numeracion: item[3],
                              depto_casa: item[4],
                              telefono1: '',
                              telefono2: '',
                              correo1: correos[0],
                              correo2: correos[1],
                              activo: 1
                          });
                        }
                      });
                    }
                  });
                }

            } else {
                console.log(err);
            }
            //process.exit();
        });
    }
}
