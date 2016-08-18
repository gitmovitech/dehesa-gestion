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