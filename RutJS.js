var formatRut = function (_value) {
    _value = cleanRut(_value);

    if (!_value)
        return false;
    if (_value.length <= 1)
        return _value;

    var result = _value.slice(-4, -1) + '-' + _value.substr(_value.length - 1);
    for (var i = 4; i < _value.length; i += 3)
        result = _value.slice(-3 - i, -i) + '.' + result;
    return result;
}
var validateRut = function (_value) {
    if (typeof _value !== 'string')
        return false;
    var t = parseInt(_value.slice(0, -1), 10), m = 0, s = 1;
    while (t > 0) {
        s = (s + t % 10 * (9 - m++ % 6)) % 11;
        t = Math.floor(t / 10);
    }
    var v = (s > 0) ? (s - 1) + '' : 'K';
    return (v === _value.slice(-1));
}
var cleanRut = function (_value) {
    return _value.replace(/(\.|\-)/g, '');
}

exports.formatRut = formatRut;
exports.isValid = validateRut;
exports.cleanRut = cleanRut;