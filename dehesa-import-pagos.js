var RutJS = require('./RutJS');
var fs = require('fs');
var xlsx = require('node-xlsx');
var mongo = require('./mongodb');

var registros = [];
var month = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
exports.import = function (params, cb) {
  console.log(JSON.stringify(params));
  var file = __dirname + '/uploads/' + params.filename;
  if (fs.existsSync(file)) {
    var filename = file;
    filename = filename.split('/');
    filename = filename[filename.length - 1];
    var data = false;
    try {
      data = xlsx.parse(fs.readFileSync(file));
      var thismonth;
      for (var c in month) {
        if (month[c] == params.periodo.month) {
          thismonth = parseInt(c);
          break;
        }
      }
    } catch (e) {
      cb({
        success: false,
        message: 'El archivo excel subido no es válido. Suba el archivo en formato excel y con el formato adecuado.'
      });
    }

    if (data) {
      var run = '';
      filename = filename.toUpperCase();
      if (filename.match(/PAC/gi) && filename.match(/PAT/gi)) {
        var pac = false;
        var pat = false;
        for (var t in data) {
          if (data[t].name.match(/PAC/gi)) {
            procesarPAC(data[t].data, thismonth, params.periodo.year, function (data) {
              pac = true;
              if (pat) {
                cb({
                  success: true
                });
              }
            });
          }
          if (data[t].name.match(/PAT/gi)) {
            procesarPAT(data[t].data, thismonth, params.periodo.year, function (data) {
              pat = true;
              if (pac) {
                cb({
                  success: true
                });
              }
            });
          }
        }
      } else if (filename.match(/PAC/gi)) {
        data = data[0].data;
        procesarPAC(data, thismonth, params.periodo.year, function (data) {
          cb({
            success: true
          });
        });
      } else if (filename.match(/PAT/gi)) {
        data = data[0].data;
        procesarPAT(data, thismonth, params.periodo.year, function (data) {
          cb({
            success: true
          });
        });
      }
    }

  } else {
    cb({
      success: false,
      message: 'El archivo no fue encontrado en el servidor. Si el error persiste comuníquese con soporte'
    });
  }
}

var procesarPAT = function (data, month, year, cb) {
  registros = [];
  for (var i in data) {
    if(data[i][13] == 'APROBADA'){
      registros[registros.length] = {
        run: data[i][8],
        pago: data[i][1],
        tarifa: data[i][1],
        estado: data[i][13]
      }
    } else{
      registros[registros.length] = {
        run: data[i][8],
        pago: data[i][1],
        tarifa: data[i][1],
        estado: data[i][17]
      }
    }
  }
  guardarRegistros(registros, month, year, cb);
}
exports.procesarPAT = procesarPAT;

var procesarPACPAT = function (data, month, year, cb) {
  console.log('REGISTROS PAC y PAT: ' + data.length);
  console.log(data.length);
}

var procesarPAC = function (data, month, year, cb) {
  registros = [];
  try {
    data = data[0].data;
    for (var i in data) {
      if (i >= 11) {
        registros[registros.length] = {
          run: data[i][1],
          pago: data[i][4],
          tarifa: data[i][4],
          estado: data[i][6]
        }
      }
    }
    guardarRegistros(registros, month, year, cb);
  } catch (e) {

  }
}
exports.procesarPAC = procesarPAC;

var guardarRegistros = function (registros, month, year, cb) {
  registros.forEach(function (item, i) {
    mongo.getUserByRun(item.run, function (asociado) {
      if (asociado) {
        try {
          if (item.estado != 'Pagos Procesados' && item.estado != 'APROBADA') {
            item.estado = 'Pendiente';
            item.debe = parseInt(item.pago);
            item.pago = 0;
          } else {
            item.debe = 0
          }
          if (item.estado == 'APROBADA') {
            item.estado = 'Aprobada';
          }
          //if(asociado.id == 772)
          mongo.savePayment({
            id: asociado.id,
            nombre: [asociado.first_name, asociado.second_name, asociado.last_name, asociado.second_last_name].join(' '),
            tarifa: item.tarifa,
            type: item.estado,
            pagado: item.pago,
            debe: item.debe,
            month: month,
            year: year
          });
        } catch (e) {
          console.log(e);
        }
      }
    });
  });
  cb();
}
