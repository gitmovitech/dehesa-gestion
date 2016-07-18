var config = require('./config');
var sendgrid = require('sendgrid').SendGrid(config.sendmail.sendgrid.key);

var sendMail = function (params) {
    var helper = require('sendgrid').mail;
    from_email = new helper.Email(params.from);
    to_email = new helper.Email(params.to);
    if (params.html)
        content = new helper.Content("text/html", params.html);
    else if (params.text)
        content = new helper.Content("text/text", params.text);
    var mail = new helper.Mail(from_email, params.subject, to_email, content);

    var request = sendgrid.emptyRequest();
    request.method = 'POST';
    request.path = '/v3/mail/send';
    request.body = mail.toJSON();
    sendgrid.API(request, function (response) {
        console.log(response.statusCode);
        console.log(response.body);
        console.log(response.headers);
    });
}
exports.sendMail = sendMail;