var mail = require('./smtpmail');
var newUser = function (params, callback) {
    var html;
    html = '<p>Estimado(a) ' + params.toname + '.</p>';
    html += '<p>Se ha creado una cuenta para usted.</p>';
    html += '<p>URL de acceso: ' + params.url + '</p>'
    html += '<p>Datos de acceso son:</p>';
    html += '<p>Usuario: ' + params.to + '<br>';
    html += 'Contraseña: ' + params.pass + '</p>';
    html += '<br><br><p>Atte. Junta de Vecinos Jardín La Dehesa.</p>';
    mail.sendMail({
        fromname: 'Junta de Vecinos Jardín La Dehesa',
        from: 'no-reply@jvdehesa.cl',
        toname: params.toname,
        to: params.to,
        subject: 'Nueva cuenta de usuario',
        text: false,
        html: html
    }, function (response, err) {
        if (typeof callback == 'function')
            callback(response, err);
    });
}
exports.newUser = newUser;

var notificarContador = function (params, callback) {
    var html;
    html = '<p>Estimado(a) ' + params.toname + '.</p>';
    html += '<p>Le informamos que la carga de cobros del mes ' + params.month + ' se encuentra lista para su procesamiento.</p>';
    html += '<p>URL de acceso: ' + params.url + '</p>'
    html += '<br><br><p>Atte. Junta de Vecinos Jardín La Dehesa.</p>';
    mail.sendMail({
        fromname: 'Junta de Vecinos Jardín La Dehesa',
        from: 'no-reply@jvdehesa.cl',
        toname: params.toname,
        to: params.to,
        subject: 'Carga de cobros ' + params.month + ' de ' + params.year,
        text: false,
        html: html
    }, function (response, err) {
        if (typeof callback == 'function')
            callback(response, err);
    });
}
exports.notificarContador = notificarContador;