var years = [];
var data;
var listfrom = 0;
var noactive = [];
var current_page = 1;

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



var modal_contacto = function (item) {
    for (var n in data) {
        if (data[n].id == item) {
            $('#contacto_nombre').html(data[n].nombre);
            /**
             * @todo Llamar a REST para obtener el resto de los datos del asociado
             */
            //$.getJSON();
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
    $('.paginador-foot').html('');
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

            construirPaginador();

            var htmldata = "";
            var contador = 0;
            for (var i in response.data) {
                if (current_page == 1) {
                    listfrom = 0;
                } else {
                    listfrom = ($('#limitPerPage').val() * current_page) + 1;
                }
                if (i >= listfrom && contador <= $('#limitPerPage').val()) {
                    contador++;
                    $('#cobro_template .activo-checkbox').attr('id', 'active_' + response.data[i].id);
                    $('#cobro_template .activo-checkbox').attr('checked', 'checked');
                    $('#cobro_template .activo-checkbox').val(response.data[i].id)
                    $('#cobro_template .asociado-id').html(response.data[i].id);
                    $('#cobro_template .dias').html(response.data[i].dias);
                    $('#cobro_template .tarifa').html('$' + response.data[i].tarifa.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
                    $('#cobro_template .excedentes').html('$' + response.data[i].excedentes.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
                    $('#cobro_template .ajuste').html('$' + response.data[i].ajuste_contable.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
                    $('#cobro_template .deuda').html('$' + response.data[i].debe.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
                    $('#cobro_template .btn-modal-contact').attr('onclick', 'javascript:modal_contacto(' + response.data[i].id + ')');
                    htmldata += '<tr class="asociado-list template-clean" id="row_' + response.data[i].id + '">' + $('#cobro_template').html() + '</tr>';
                }
            }
            $('#cobro_tbody, #costos_tbody').append(htmldata);
        }
        if (noactive.length > 0) {
            noactive.forEach(function (item) {
                $('#active_' + item).attr('checked', false);
                $('#row_' + item).css('background-color', 'rgba(255,0,0,0.1)');
            });
        }
    });
}

var params;
var noexiste;
var pacpat;
var file_pacpat;
var year = false;
var month = false;

jQuery(function ($) {

    params = GetUrlParams();

    if (params) {
        try {
            noexiste = params[2];
            noexiste = noexiste.split('=');
            if (noexiste[0] == 'pacpat') {
                pacpat = noexiste[1];
                file_pacpat = params[3].split('=');
                file_pacpat = file_pacpat[1];
                noexiste = '';
            } else {
                noexiste = noexiste[1];
                noexiste = noexiste.split('-');
                noactive = noexiste;
                noexiste = noexiste.join(', ')
            }

            year = params[0];
            year = year.split('=')[1];

            month = params[1];
            month = month.split('=')[1];

        } catch (e) {

        }
    }

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
