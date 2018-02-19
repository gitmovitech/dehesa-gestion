var years = [];
var data;

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


var exportarPAT = function () {
    location.href = '/pagos/banco/pat/' + $('#filtro_ano').val() + '/' + $('#filtro_mes').val();
}

var exportarPAC = function () {
    location.href = '/pagos/banco/pac/' + $('#filtro_ano').val() + '/' + $('#filtro_mes').val();
}

jQuery(function ($) {

    var params = GetUrlParams();
    var noexiste;
    var year = false;
    var month = false;
    var noactive = [];

    if (params) {
        try {
            noexiste = params[2];
            noexiste = noexiste.split('=');
            noexiste = noexiste[1];
            noexiste = noexiste.split('-');
            noactive = noexiste;
            noexiste = noexiste.join(', ')

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

    $('#filtrarButton').click(function () {
        $('.template-clean').remove();
        if ($('#filtro_ano').val() == '' || $('#filtro_mes').val() == '') {
            alert('Seleccione año y mes');
        } else {
            $('#progress_pagos').show();
            $.getJSON('/api/pagos/planilla-cobro', function (response) {
                $('#progress_pagos').hide();
                $('#contenido_pagos,#title').show();
                $('#title h3').html('Cobros de ' + $('#filtro_mes').val());

                year = $('#filtro_ano').val();

                month = $('#filtro_mes').val();


                $.getJSON('/api/carga/cobros', {
                    year: year,
                    month: month
                }, function (response) {
                    if (response.ok == 1) {
                        data = response.data;
                        var htmldata = "";
                        for (var i in response.data) {
                            //console.log(response.data[i]);
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
                        $('#cobro_tbody, #costos_tbody').append(htmldata);
                    }
                    if (noactive.length > 0) {
                        noactive.forEach(function (item) {
                            $('#active_' + item).attr('checked', false);
                            $('#row_' + item).css('background-color', 'rgba(255,0,0,0.1)');
                        });
                    }
                });

            });
        }
    });

    $('#form_upload_validar_adt').submit(function () {
        if ($('#adt_file').val() == "") {
            alert('Seleccione una planilla ADT primero');
            return false;
        }
        return true;
    });

    if (year && month) {
        $('#filtro_ano').val(year);
        $('#filtro_mes').val(month);
        $('#filtrarButton').click();
        $('#alert-adt').show();
        $('#noexiste').html(noexiste);
    }

});
