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

var notificarEncuesta = function (params, callback) {
    var html;
    html = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html> <head> <!-- If you delete this meta tag, the ground will open and swallow you. --> <meta name="viewport" content="width=device-width" /> <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /> <title>Jvdehesa - Encuesta</title> <link rel="stylesheet" type="text/css" href="http://www.jvdehesa.cl/encuestas/email.css" > </head> <body bgcolor="#FFFFFF" topmargin="0" leftmargin="0" marginheight="0" marginwidth="0"> <!-- HEADER --> <table class="head-wrap" bgcolor="#4c6712"> <tr> <td></td> <td class="header container" align=""> <!-- /content --> <div class="content"> <table bgcolor="#4c6712" > <tr> <td><img src="http://www.jvdehesa.cl/encuestas/logo.png" width="50" /></td> <td align="right"><h6 class="collapse"></h6></td> </tr> </table> </div><!-- /content --> </td> <td></td> </tr> </table><!-- /HEADER --> <!-- BODY --> <table class="body-wrap" bgcolor=""> <tr> <td></td> <td class="container" align="" bgcolor="#FFFFFF"> <!-- content --> <div class="content"> <table> <tr> <td> ';
    html += ' <h1>Estimado(a) ' + params.usuario + '.</h1> <p class="lead"> La Junta de Vecinos Jardín La Dehesa necesita tú  opinion. <br>Te pedimos responder esta breve encuesta en el siguiente <a href="' + params.url + '">link</a>. </p> </td> </tr> </table> </div> </td> <td></td> </tr> </table> </body></html>';

    /*html = '<p>Estimado(a) ' + params.usuario + '.</p>';
    html += '<p>Por parte de la Junta de Vecinos Jardín La Dehesa le hacemos llegar una encuesta que espero nos pueda responder pronto.</p>';
    html += '<p>Para poder acceder a la encuesta por favor dirigase a este link: ' + params.url + '</p>'
    html += '<br><br><p>Atte. Junta de Vecinos Jardín La Dehesa.</p>';*/
    mail.sendMail({
        fromname: 'Junta de Vecinos Jardín La Dehesa',
        from: 'encuestas@jvdehesa.cl',
        toname: params.usuario,
        to: params.correo,
        subject: 'Necesitamos tu opinión/ junta de vecinos jardín la dehesa',
        text: false,
        html: html
    }, function (response, err) {
        if (typeof callback == 'function')
            callback(response, err);
    });
}
exports.notificarEncuesta = notificarEncuesta;

var notificarCobroAsociado = function (params, callback) {
    var html;
    html = '<p>Estimado(a) ' + params.toname + '.</p>';
    html += '<p>Le informamos que registramos una deuda pendiente de $'+ params.cobro +' correspondiente al pago de la cuota de la Junta de Vecinos del mes de '+ params.month +'.</p>';
    html += '<br><br><p>Atte. Junta de Vecinos Jardín La Dehesa.</p>';
    mail.sendMail({
        fromname: 'Junta de Vecinos Jardín La Dehesa',
        from: 'no-reply@jvdehesa.cl',
        toname: params.toname,
        to: params.to,
        subject: 'Pago pendiente ' + params.month + ' ' + params.year,
        text: false,
        html: html
    }, function (response, err) {
        if (typeof callback == 'function')
            callback(response, err);
    });
}
exports.notificarCobroAsociado = notificarCobroAsociado;
