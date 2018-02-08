var fs = require('fs');
var xlsx = require('node-xlsx');
var db = require('./mongodb');

var ValidarPlanillaADT = function (req, res) {
    if (!fs.existsSync(__dirname + '/uploads')) {
        fs.mkdirSync(__dirname + '/uploads', 0777);
    }
    if (!fs.existsSync(__dirname + '/uploads/adt')) {
        fs.mkdirSync(__dirname + '/uploads/adt', 0777);
    }
    //var file = '/Users/victorvargas/Projects/dehesa-gestion/uploads/adt/adt.xlsx';
    var file = __dirname + '/uploads/adt/' + req.file.originalname;
    if (fs.existsSync(file)) {
        fs.unlinkSync(file);
    }
    fs.renameSync(__dirname + '/' + req.file.path, file);
    var data = [];
    var planilla = [];
    var year = 2018;
    var month = 1;
    if (fs.existsSync(file)) {
        data = xlsx.parse(fs.readFileSync(file));
        try {
            data = data[0].data;
            for (var i in data) {
                if (typeof data[i][0] == "number") {
                    planilla.push(data[i]);
                }
            }
        } catch (e) {

        }
        delete data;
        var add = true;
        var noexiste = [];

        if (planilla.length > 0) {
            db.getPayments({
                month: month,
                year: year
            }, function (pagos) {
                if (pagos) {
                    db.getAsociados(function (asociados) {
                        var asociado_id = 0;
                        var activo = 0;
                        // BUSCAR ASOCIADOS NO EXISTENTES
                        for (var a in asociados) {
                            asociado_id = asociados[a].id;
                            activo = asociados[a].activo;
                            add = true;
                            for (var p in planilla) {
                                if (activo == 0) {
                                    add = false;
                                    break;
                                } else {
                                    if (planilla[p][0] == asociado_id) {
                                        add = false;
                                        break;
                                    }
                                }
                            }
                            if (add) {
                                noexiste.push(asociado_id);
                            }
                        }

                        res.redirect('/templates/pagos.html?year=' + year + '&month=' + month + '&noexiste=' + noexiste.join('-'));

                    });
                }
            });
        }
    } else {
        res.send('No hay planilla');
    }
}
//ValidarPlanillaADT();
exports.ValidarPlanillaADT = ValidarPlanillaADT;




var CargarCobros = function (req, res) {
    try {
        db.getPayments({
            year: req.query.year,
            month: req.query.month
        }, function (response) {
            res.send({
                ok: 1,
                data: response
            })
        });
    }
    catch (e) {
        res.send({
            ok: 0
        });
    }
}
exports.CargarCobros = CargarCobros;