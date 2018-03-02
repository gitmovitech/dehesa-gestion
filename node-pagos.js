var fs = require('fs');
var xlsx = require('node-xlsx');
var csvparse = require('csv-parse');
var db = require('./mongodb');
var import_pagos = require('./dehesa-import-pagos');

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




var ObtenerAsociado = function (req, res) {
    try {
        db.getAsociado({
            id: req.params.id,
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
exports.ObtenerAsociado = ObtenerAsociado;




var ImportarPacPat = function (req, res) {
    var error = '';
    var data = [];
    var file;
    if (!fs.existsSync(__dirname + '/uploads')) {
        fs.mkdirSync(__dirname + '/uploads', 0777);
    }
    if (!fs.existsSync(__dirname + '/uploads/pacpat')) {
        fs.mkdirSync(__dirname + '/uploads/pacpat', 0777);
    }
    if (req.body.pacpat == 'PAC') {
        file = __dirname + '/uploads/pacpat/' + req.body.year + '-' + req.body.month + '-' + req.body.pacpat + '.xls';
    }
    if (req.body.pacpat == 'PAT') {
        file = __dirname + '/uploads/pacpat/' + req.body.year + '-' + req.body.month + '-' + req.body.pacpat + '.csv';
    }

    if (fs.existsSync(file)) {
        fs.unlinkSync(file);
    }
    fs.renameSync(__dirname + '/' + req.file.path, file);

    if (req.body.pacpat == 'PAC') {
        try {
            data = xlsx.parse(fs.readFileSync(file));
        } catch (e) {
            error = 'El archivo excel subido no es válido. Suba el archivo en formato excel y con el formato adecuado.'
        }
        if (error != '') {
            res.send(error);
        } else {
            import_pagos.procesarPAC(data, req.body.month, req.body.year, function () {
                res.redirect('/templates/pagos.html?year=' + req.body.year + '&month=' + req.body.month + '&pacpat=' + req.body.pacpat + '&file=' + req.body.year + '-' + req.body.month + '-' + req.body.pacpat + '.xls');
            });
        }
    } else if (req.body.pacpat == 'PAT') {
        var parser = csvparse({ delimiter: ';' }, function (err, data) {
            if (!err) {
                import_pagos.procesarPAT(data, req.body.month, req.body.year, function () {
                    res.redirect('/templates/pagos.html?year=' + req.body.year + '&month=' + req.body.month + '&pacpat=' + req.body.pacpat + '&file=' + req.body.year + '-' + req.body.month + '-' + req.body.pacpat + '.xls');
                });
            } else {
                res.send(JSON.stringify(err))
            }
        });
        fs.createReadStream(file).pipe(parser);
    } else {
        res.send('Error, no PAT o PAC');
    }

}
exports.ImportarPacPat = ImportarPacPat;