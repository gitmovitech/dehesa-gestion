var years = [];

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

jQuery(function ($) {

    var params = GetUrlParams();
    var noexiste;
    var year = false;
    var month = false;

    if (params) {
        try {
            noexiste = params[2];
            noexiste = noexiste.split('=');
            noexiste = noexiste[1];
            noexiste = noexiste.split('-');
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
                        var htmldata = "";
                        for (var i in response.data) {
                            $('#cobro_template .asociado-id').html(response.data[i].id);
                            $('#cobro_template .dias').html(response.data[i].dias);
                            $('#cobro_template .tarifa').html('$' + response.data[i].tarifa.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
                            $('#cobro_template .excedentes').html('$' + response.data[i].excedentes.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
                            $('#cobro_template .ajuste').html('$' + response.data[i].ajuste_contable.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
                            $('#cobro_template .deuda').html('$' + response.data[i].debe.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
                            htmldata += '<tr class="asociado-list template-clean">' + $('#cobro_template').html() + '</tr>';
                        }
                        $('#cobro_tbody, #costos_tbody').append(htmldata);
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
