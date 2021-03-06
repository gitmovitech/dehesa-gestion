var years = [];
var data;
var listfrom = 0;
var noactive = [];
var current_page = 1;
var noexiste = "";
var pacpat;
var file_pacpat;
var year = false;
var month = false;
var meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];


var GetUrlParams = function () {
    var url = location.href;
    url = url.split('?');
    try {
        url = url[1];
        return url.split('&');
    } catch (e) {
        return false;
    }
}

var GetParam = function (id) {
    var params = GetUrlParams();
    if (params) {
        var keyval;
        for (var n in params) {
            keyval = params[n].split('=');
            if (keyval[0] == id) {
                return keyval[1];
            }
        }
        return "";
    } else {
        return "";
    }
}


var global;
var modal_contacto = function (item) {
    $('.contacto-dates span').html('');
    for (var n in data) {
        if (data[n].id == item) {
            $('#contacto_nombre').html(data[n].nombre);
            $.getJSON('/api/asociados/' + item, function (response) {
                global = response;
                $('#tel1').html(response.data.telefono11);
                $('#tel2').html(response.data.telefono12);
                $('#tel3').html(response.data.telefono21);
                $('#tel4').html(response.data.telefono22);
                $('#email1').html(response.data.correo11);
                $('#email2').html(response.data.correo12);
                $('#email3').html(response.data.correo21);
                $('#email4').html(response.data.correo22);
            });
            setTimeout(function () {
                $('#modalcontacto').modal(true);
            }, 100);
            break;
        }
    }
}

var modal_historial = function (item) {
    for (var n in data) {
        if (data[n].id == item) {
            $('#modalhistorial h5').html(data[n].nombre);
            $.getJSON('/api/cargar/historial', {
                id: item
            }, function (response) {
                $('#modalhistorial .table-historial').html('');
                for (var i in response) {
                    inner = '<tr><td>' + response[i].year + '</td><td>' + meses[response[i].month] + '</td><td>$' + $.number(response[i].pagado) + '</td><td>$' + $.number(response[i].debe) + '</td><td>' + response[i].estado + '</td></tr>';
                    $('#modalhistorial .table-historial').append(inner);
                }
                $('#modalhistorial').modal(true);
            });
            break;
        }
    }
}

var modal_archivos = function (item) {
    jQuery('.input_year').val(jQuery('#filtro_ano').val());
    jQuery('.input_month').val(jQuery('#filtro_mes').val());
    $('#archivo_id').val(item);
    $('#modalarchivos').modal(true);
    $('#listado_archivos').html('');
    $.getJSON('/api/carga/archivo/pago/' + item, function (response) {
        for (var n in response) {
            $('#listado_archivos').append('<li><a href="/descargar/' + item + '/' + response[n] + '">' + response[n] + '</a></li>');
        }
    });
}

var setPage = function (page) {
    current_page = page;
    listar();
}


var modificardias = function (elem) {
    $.getJSON('/api/modificar-dias', {
        token: localStorage.intranetSession,
        _id: $(elem).data('id'),
        dias: $(elem).val()
    }, function () {
        $('#filtrarButton').click();
    });
}


var exportarPAT = function () {
    location.href = '/pagos/banco/pat/' + $('#filtro_ano').val() + '/' + $('#filtro_mes').val() + '?no=' + $('#noexiste').html();
}

var exportarPAC = function () {
    location.href = '/pagos/banco/pac/' + $('#filtro_ano').val() + '/' + $('#filtro_mes').val() + '?no=' + $('#noexiste').html();
}

var importarPATPAC = function () {
    jQuery('.input_year').val(jQuery('#filtro_ano').val());
    jQuery('.input_month').val(jQuery('#filtro_mes').val());
    $('#modal_importar_patpac').modal(true);
}

var construirPaginador = function () {
    var paginas = Math.ceil(data.length / $('#limitPerPage').val());
    $('.paginador-foot').hide().html('');
    for (var n = 1; n <= paginas - 1; n++) {
        if (current_page == n) {
            $('.paginador-foot').append('<a class="btn btn-xs btn-success active" href="javascript:setPage(' + n + ')">' + n + '</a> ');
        } else {
            $('.paginador-foot').append('<a class="btn btn-xs btn-success" href="javascript:setPage(' + n + ')">' + n + '</a> ');
        }
    }
}

var abrirComentarios = function (elem) {
    var id = jQuery(elem).data('id');
    var response = JSON.parse(sessionStorage.payments);
    for (var i in response.data) {
        if (response.data[i].id == id) {
            jQuery('#comentario').html(response.data[i].comentarios);
            break;
        }
    }
}

var pago_manual = function (elem) {
    if (confirm('¿Desea realizar este pago manual y cambiar el estado a ' + jQuery(elem).val() + '?')) {
        var id = jQuery(elem).data('id');
        var pagar;
        var response = JSON.parse(sessionStorage.payments);
        for (var i in response.data) {
            if (response.data[i].id == id) {
                pagar = Math.round(response.data[i].tarifa);
                break;
            }
        }
        pagar = prompt('Valor a pagar', pagar);
        if (pagar) {
            jQuery.post('/api/pagar', {
                params: {
                    token: localStorage.intranetSession,
                    collection: 'pagos',
                    data: {
                        status: jQuery(elem).val(),
                        id: id,
                        month: $('#filtro_mes').val(),
                        year: $('#filtro_ano').val(),
                        pago: pagar,
                        tarifa: Math.round(response.data[i].tarifa)
                    }
                }
            }, function (response) {
                $('#filtrarButton').click();
            });
        } else {
            jQuery(elem).val(jQuery(elem).data('estado'));
        }
    } else {
        jQuery(elem).val(jQuery(elem).data('estado'));
    }
}

var opened = true;
var listar = function () {
    opened = true;
    $.getJSON('/api/carga/cobros', {
        year: $('#filtro_ano').val(),
        month: $('#filtro_mes').val()
    }, function (response) {
        $('#cobro_tbody, #costos_tbody').html('');
        if (response.ok == 1) {
            sessionStorage.payments = JSON.stringify(response);
            data = response.data;

            $('#cantidad_registros').html(data.length);
            $('#cantidad_registros_rechazados, #cantidad_registros_pendientes, #cantidad_registros_pac, #cantidad_registros_pat').html(0);
            var cant_pendientes = 0;
            var cant_rechazados = 0;
            var cant_manuales = 0;
            var cant_pat = 0;
            var cant_pac = 0;
            var total_mensual = 0;
            var total_pac = 0;
            var total_pat = 0;
            for (var i in data) {
                if (data[i].estado == 'Pendiente') {
                    cant_pendientes++;
                } else if (data[i].estado == 'Rechazado') {
                    cant_rechazados++;
                } else if (data[i].estado == 'Pagos Procesados') {
                    cant_pac++;
                    total_pac += data[i].pagado;
                } else if (data[i].estado == 'Aprobada') {
                    cant_pat++;
                    total_pat += data[i].pagado;
                } else {
                    cant_manuales += data[i].pagado;
                }
                total_mensual += data[i].pagado;
            }
            //total_mensual = $.number(total_mensual);
            $('#cartola_detalle_total_mensual').html('$' + money_format(total_mensual));
            $('#cartola_detalle_asociados').html(data.length);
            $('#cantidad_registros_rechazados').html(cant_rechazados);
            $('#cantidad_registros_pendientes').html(cant_pendientes);
            $('#cartola_total_manual').html('$' + money_format(cant_manuales));
            $('#cartola_total_pac').html('$' + money_format(total_pac));
            $('#cantidad_registros_pac').html(cant_pac);
            $('#cartola_total_pat').html('$' + money_format(total_pat));
            $('#cantidad_registros_pat').html(cant_pat);

            construirPaginador();

            var cobrosdata = "";
            var costosdata = "";
            var contador = 0;

            for (var i in response.data) {
                opened = response.data[i].opened;
                if (response.data[i].estado != 'Pendiente' && data[i].estado != 'Rechazado') {
                    contador++;
                    $('#cobro_template .btn-comentarios').attr('data-id', response.data[i].id);
                    $('#cobro_template .dias').attr('data-id', response.data[i]._id);
                    $('#cobro_template .contador-tabla').html(contador);
                    $('#cobro_template .activo-checkbox').attr('id', 'active_' + response.data[i].id);
                    $('#cobro_template .activo-checkbox').attr('checked', 'checked');

                    if (response.data[i].activo == 1) {
                        $('#cobro_template .activo-checkbox').attr('checked', 'checked');
                    } else {
                        $('#cobro_template .activo-checkbox').removeAttr('checked');
                    }

                    $('#cobro_template .estado-pago').html(response.data[i].estado).show();
                    $('#cobro_template .estado-select').hide();
                    $('#cobro_template .days-input').attr('value', response.data[i].dias).attr('readonly', 'readonly');
                    $('#cobro_template .activo-checkbox').val(response.data[i].id)
                    $('#cobro_template .asociado-id').html(response.data[i].id);
                    if (30 != response.data[i].dias) {
                        tarifa = response.data[i].tarifa;
                        response.data[i].tarifa = (response.data[i].tarifa * response.data[i].dias) / 30;
                        response.data[i].debe -= response.data[i].debe -= tarifa - response.data[i].tarifa
                    }
                    $('#cobro_template .tarifa').html('$' + money_format(response.data[i].tarifa));
                    $('#cobro_template .excedentes').html('$' + money_format(response.data[i].excedentes));
                    $('#cobro_template .ajuste').html('$' + money_format(response.data[i].ajuste_contable));
                    try {
                        $('#cobro_template .deuda').html('$' + money_format(response.data[i].debe));
                    } catch (e) {
                        $('#cobro_template .deuda').html('');
                    }
                    $('#cobro_template .btn-modal-archivos').attr('onclick', 'javascript:modal_archivos(\'' + response.data[i]._id + '\')');
                    $('#cobro_template .btn-modal-contact').attr('onclick', 'javascript:modal_contacto(' + response.data[i].id + ')');
                    $('#cobro_template .btn-modal-historial').attr('onclick', 'javascript:modal_historial(' + response.data[i].id + ')');
                    costosdata += '<tr class="asociado-list template-clean ' + response.data[i].estado + '-estado" id="row_' + response.data[i].id + '">' + $('#cobro_template').html() + '</tr>';
                }

            }

            contador = 0;

            for (var i in response.data) {
                $('#cobro_template .estado-select option').each(function () {
                    $(this).removeAttr('selected');
                });
                if (current_page == 1) {
                    listfrom = 0;
                } else {
                    listfrom = ($('#limitPerPage').val() * current_page) + 1;
                }
                //if (i >= listfrom && contador <= $('#limitPerPage').val() && (response.data[i].estado == 'Pendiente' || data[i].estado == 'Rechazado')) {
                if (response.data[i].estado == 'Pendiente' || data[i].estado == 'Rechazado') {
                    contador++;
                    $('#cobro_template .btn-comentarios').attr('data-id', response.data[i].id);
                    $('#cobro_template .dias').attr('data-id', response.data[i]._id);
                    $('#cobro_template .contador-tabla').html(contador);
                    $('#cobro_template .activo-checkbox').attr('id', 'active_' + response.data[i].id);

                    if (response.data[i].activo == 1) {
                        $('#cobro_template .activo-checkbox').attr('checked', 'checked');
                    } else {
                        $('#cobro_template .activo-checkbox').removeAttr('checked');
                    }

                    if (opened) {
                        $('#cobro_template .estado-select').attr('data-id', response.data[i].id);
                        $('#cobro_template .estado-select').attr('data-estado', response.data[i].estado);
                        $('#cobro_template .estado-pago').html(response.data[i].estado).hide();
                        $('#cobro_template .estado-select').show();
                        $('#cobro_template .estado-select option[value=' + data[i].estado + ']').attr('selected', 'selected');
                        $('#cobro_template .days-input').removeAttr('readonly');
                    } else {
                        $('#cobro_template .estado-pago').html(response.data[i].estado).show();
                        $('#cobro_template .estado-select').hide();
                        $('#cobro_template .days-input').attr('readonly', 'readonly');
                    }

                    $('#cobro_template .activo-checkbox').val(response.data[i].id);
                    $('#cobro_template .days-input').attr('value', response.data[i].dias);
                    $('#cobro_template .asociado-id').html(response.data[i].id);
                    if (30 != response.data[i].dias) {
                        tarifa = response.data[i].tarifa;
                        response.data[i].tarifa = (response.data[i].tarifa * response.data[i].dias) / 30;
                        response.data[i].debe -= tarifa - response.data[i].tarifa
                    }
                    $('#cobro_template .tarifa').html('$' + money_format(response.data[i].tarifa));
                    $('#cobro_template .excedentes').html('$' + money_format(response.data[i].excedentes));
                    $('#cobro_template .ajuste').html('$' + money_format(response.data[i].ajuste_contable));
                    try {
                        $('#cobro_template .deuda').html('$' + money_format(response.data[i].debe));
                    } catch (e) {
                        $('#cobro_template .deuda').html('');
                    }
                    $('#cobro_template .btn-modal-archivos').attr('onclick', 'javascript:modal_archivos(\'' + response.data[i]._id + '\')');
                    $('#cobro_template .btn-modal-contact').attr('onclick', 'javascript:modal_contacto(' + response.data[i].id + ')');
                    $('#cobro_template .btn-modal-historial').attr('onclick', 'javascript:modal_historial(' + response.data[i].id + ')');
                    cobrosdata += '<tr class="asociado-list template-clean ' + response.data[i].estado + '-estado" id="row_' + response.data[i].id + '">' + $('#cobro_template').html() + '</tr>';
                }
            }
            $('#cobro_tbody').append(cobrosdata);
            $('#costos_tbody').append(costosdata);
            if (data.length == 0) {
                $('#btn_cargar_mes').show();
                $('#btn_cerrar_mes,.mes-cargado').hide();
            } else {
                if (opened) {
                    $('#btn_cargar_mes').hide();
                    $('#btn_cerrar_mes,.mes-cargado').show();
                } else {
                    $('#btn_cargar_mes,#btn_cerrar_mes,.mes-cargado').hide();
                }
            }
        }
        if (noactive.length > 0) {
            noactive.forEach(function (item) {
                $('#active_' + item).attr('checked', false);
                $('#row_' + item).css('background-color', 'rgba(255,0,0,0.1)');
            });
        }
    });
}



var money_format = function(money){
    try{
        money = money.toFixed(2);
    } catch(e){}
    
    money = money.split('.');
    if(typeof money[0] != 'undefined') {
        money[0] = money[0]+'';
        money[0] = money[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    return money.join(',');
}



var cerrarMes = function () {
    year = $('#filtro_ano').val();
    month = $('#filtro_mes').val();
    if (confirm('Está seguro que desea cerrar el mes?')) {
        $.getJSON('/api/cerrar/mes', {
            year: $('#filtro_ano').val(),
            month: $('#filtro_mes').val()
        }, function (response) {
            alert('El mes ha sido cerrado');
            $('#filtrarButton').click();
        });
    }
}




var cargarMes = function () {
    year = $('#filtro_ano').val();
    month = $('#filtro_mes').val();
    if (confirm('Está seguro que desea cargar el mes?')) {
        $.getJSON('/api/cargar/mes', {
            year: $('#filtro_ano').val(),
            month: $('#filtro_mes').val()
        }, function (response) {
            if (response.ok == 0) {
                alert(response.message)
            } else {
                $('#filtrarButton').click()
            }
        });
    }
}




jQuery(function ($) {

    year = GetParam('year');
    month = GetParam('month');
    noexiste = GetParam('noexiste');
    pacpat = GetParam('pacpat');
    file_pacpat = GetParam('file');


    for (var n = new Date().getFullYear(); n >= 2017; n--) {
        $('#filtro_ano').append('<option value="' + n + '">' + n + '</option>');
    }

    $('#filtrarLimites').click(function () {
        current_page = 1;
        listar();
    });

    $('#filtrarButton').click(function () {
        $('.template-clean').remove();
        $('#contenido_pagos').hide();
        if ($('#filtro_ano').val() == '' || $('#filtro_mes').val() == '') {
            alert('Seleccione año y mes');
        } else {
            $('#progress_pagos').show();
            $.getJSON('/api/pagos/planilla-cobro', function (response) {
                $('#progress_pagos').hide();
                $('#contenido_pagos,#title').show();
                $('#title h3').html('Cobros de ' + $('#filtro_mes').val());

                listar();

            });
        }
    });

    $('#form_upload_validar_adt').submit(function () {
        $('.input_month').val(month);
        $('.input_year').val(year);
        if ($('#single_file_adt').val() == "") {
            alert('Seleccione una planilla ADT primero');
            return false;
        }
        return true;
    });

    $('#form_upload_importar_pacpat').submit(function () {
        $('.input_month').val($('#filtro_mes').val());
        $('.input_year').val($('#filtro_ano').val());
        if ($('#single_file_pacpat').val() == "") {
            alert('Seleccione un archivo para subir primero');
            return false;
        }
        return true;
    });

    if (year && month) {
        $('#filtro_ano').val(year);
        $('#filtro_mes').val(month);
        $('#filtrarButton').click();
        if (noexiste != '') {
            $('#alert-adt').show();
            $('#noexiste').html(noexiste);
        }
    }

});
