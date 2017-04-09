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

                          var correos1 = item[18];
                          if(correos1){
                            correos1 = correos1.split(';');
                            if(!correos1[0]){
                              correos1[0] = '';
                            }
                            if(!correos1[1]){
                              correos1[1] = '';
                            }
                          } else{
                            correos1 = ['',''];
                          }

                          var correos2 = item[10];
                          if(correos2){
                            correos2 = correos2.split(';');
                            if(!correos2[0]){
                              correos2[0] = '';
                            }
                            if(!correos2[1]){
                              correos2[1] = '';
                            }
                          } else{
                            correos2 = ['',''];
                          }

                          db.collection('asociados').insert({
                              id: item[0],
                              fecha_ingreso: "",
                              run: item[13],
                              persona: 'PERSONA NATURAL',
                              razon_social: '',
                              first_name: item[14],
                              second_name: item[15],
                              last_name: item[16],
                              second_last_name: item[17],
                              correo11: correos1[0],
                              correo12: correos1[1],
                              telefono11: '',
                              telefono12: '',
                              first_name2: item[6],
                              second_name2: item[7],
                              last_name2: item[8],
                              second_last_name2: item[9],
                              correo21: correos2[0],
                              correo22: correos2[1],
                              telefono21: '',
                              telefono22: '',
                              direccion: item[2],
                              numeracion: item[3],
                              depto_casa: item[4],
                              forma_de_pago: item[21],
                              uf: item[22],
                              activo: 1,

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
