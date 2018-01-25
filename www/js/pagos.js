var years = [];
jQuery(function ($) {
    for (var n = new Date().getFullYear(); n >= 2017; n--) {
        $('#filtro_ano').append('<option value="' + n + '">' + n + '</option>');
    }

    $('#filtrarButton').click(function () {
        if ($('#filtro_ano').val() == '' || $('#filtro_mes').val() == '') {
            alert('Seleccione año y mes');
        } else {
            $('#progress_pagos').show();
            $.getJSON('/api/pagos/planilla-cobro', function (response) {
                $('#progress_pagos').hide();
                $('#contenido_pagos,#title').show();
                $('#title h3').html('Cobros de ' + $('#filtro_mes').val());
            });
        }
    });
});

