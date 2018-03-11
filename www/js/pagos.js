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

var setPage = function (page) {
    current_page = page;
    listar();
}


var exportarPAT = function () {
    location.href = '/pagos/banco/pat/' + $('#filtro_ano').val() + '/' + $('#filtro_mes').val() + '?no=' + $('#noexiste').html();
}

var exportarPAC = function () {
    location.href = '/pagos/banco/pac/' + $('#filtro_ano').val() + '/' + $('#filtro_mes').val() + '?no=' + $('#noexiste').html();
}

var importarPATPAC = function () {
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

var listar = function () {
    $.getJSON('/api/carga/cobros', {
        year: $('#filtro_ano').val(),
        month: $('#filtro_mes').val()
    }, function (response) {
        $('#cobro_tbody, #costos_tbody').html('');
        if (response.ok == 1) {
            data = response.data;

            $('#cantidad_registros').html(data.length);
            $('#cantidad_registros_rechazados, #cantidad_registros_pendientes, #cantidad_registros_pac, #cantidad_registros_pat').html(0);
            var cant_pendientes = 0;
            var cant_rechazados = 0;
            var cant_pat = 0;
            var cant_pac = 0;
            for (var i in data) {
                if (data[i].estado == 'Pendiente') {
                    cant_pendientes++;
                }
                if (data[i].estado == 'Rechazado') {
                    cant_rechazados++;
                }
                if (data[i].estado == 'Pagos Procesados') {
                    cant_pac++;
                }
                if (data[i].estado == 'Aprobada') {
                    cant_pat++;
                }
            }
            $('#cantidad_registros_rechazados').html(cant_rechazados);
            $('#cantidad_registros_pendientes').html(cant_pendientes);
            $('#cantidad_registros_pac').html(cant_pac);
            $('#cantidad_registros_pat').html(cant_pat);

            construirPaginador();

            var cobrosdata = "";
            var costosdata = "";
            var contador = 0;

            for (var i in response.data) {
                if (response.data[i].estado != 'Pendiente' && data[i].estado != 'Rechazado') {
                    $('#cobro_template .activo-checkbox').attr('id', 'active_' + response.data[i].id);
                    $('#cobro_template .activo-checkbox').attr('checked', 'checked');
                    $('#cobro_template .estado-pago').html(response.data[i].estado);
                    $('#cobro_template .activo-checkbox').val(response.data[i].id)
                    $('#cobro_template .asociado-id').html(response.data[i].id);
                    $('#cobro_template .dias').html(response.data[i].dias);
                    $('#cobro_template .tarifa').html('$' + response.data[i].tarifa.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
                    $('#cobro_template .excedentes').html('$' + response.data[i].excedentes.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
                    $('#cobro_template .ajuste').html('$' + response.data[i].ajuste_contable.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
                    try {
                        $('#cobro_template .deuda').html('$' + response.data[i].debe.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
                    } catch (e) {
                        $('#cobro_template .deuda').html('');
                    }
                    $('#cobro_template .btn-modal-contact').attr('onclick', 'javascript:modal_contacto(' + response.data[i].id + ')');
                    costosdata += '<tr class="asociado-list template-clean ' + response.data[i].estado + '-estado" id="row_' + response.data[i].id + '">' + $('#cobro_template').html() + '</tr>';
                }

            }

            for (var i in response.data) {
                if (current_page == 1) {
                    listfrom = 0;
                } else {
                    listfrom = ($('#limitPerPage').val() * current_page) + 1;
                }
                //if (i >= listfrom && contador <= $('#limitPerPage').val() && (response.data[i].estado == 'Pendiente' || data[i].estado == 'Rechazado')) {
                if(response.data[i].estado == 'Pendiente' || data[i].estado == 'Rechazado'){
                    contador++;
                    $('#cobro_template .activo-checkbox').attr('id', 'active_' + response.data[i].id);
                    $('#cobro_template .activo-checkbox').attr('checked', 'checked');
                    $('#cobro_template .estado-pago').html(response.data[i].estado);
                    $('#cobro_template .activo-checkbox').val(response.data[i].id)
                    $('#cobro_template .asociado-id').html(response.data[i].id);
                    $('#cobro_template .dias').html(response.data[i].dias);
                    $('#cobro_template .tarifa').html('$' + response.data[i].tarifa.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
                    $('#cobro_template .excedentes').html('$' + response.data[i].excedentes.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
                    $('#cobro_template .ajuste').html('$' + response.data[i].ajuste_contable.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
                    try {
                        $('#cobro_template .deuda').html('$' + response.data[i].debe.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
                    } catch (e) {
                        $('#cobro_template .deuda').html('');
                    }
                    $('#cobro_template .btn-modal-contact').attr('onclick', 'javascript:modal_contacto(' + response.data[i].id + ')');
                    cobrosdata += '<tr class="asociado-list template-clean ' + response.data[i].estado + '-estado" id="row_' + response.data[i].id + '">' + $('#cobro_template').html() + '</tr>';
                }
            }
            $('#cobro_tbody').append(cobrosdata);
            $('#costos_tbody').append(costosdata);
            if (data.length == 0) {
                $('#btn_cargar_mes').show();
                $('#btn_cerrar_mes,.mes-cargado').hide();
            } else {
                $('#btn_cargar_mes').hide();
                $('#btn_cerrar_mes,.mes-cargado').show();
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



var cerrarMes = function () {
    year = $('#filtro_ano').val();
    month = $('#filtro_mes').val();
    if (confirm('Está seguro que desea cerrar el mes?')) {
        $.getJSON('/api/cerrar/mes', {
            year: $('#filtro_ano').val(),
            month: $('#filtro_mes').val()
        }, function (response) {
            alert('El mes ha sido cerrado')
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
        $('.input_month').val(month);
        $('.input_year').val(year);
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
