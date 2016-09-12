app.controller('app', function ($scope, Session, $http, $location, FileUploader, Pagination, RutHelper, $filter) {

    //var socket = io.connect();
    $scope.pagination = Pagination.getNew(15);
    if (!sessionStorage.page || sessionStorage.page == 'undefined') {
        sessionStorage.page = 0;
        $scope.pageIndex = sessionStorage.page;
    }

    var fieldsdata;
    $http.get('/api/session', {
        params: {
            token: Session.get()
        }
    }).success(function (response) {
        $scope.session = response;
        var pages = Session.getPages().pages;
        if ($scope.session.type == 'Administrador') {
            $scope.pages = pages;
        } else {
            for (var x in pages) {
                if (pages[x].collection == 'users') {
                    pages.splice(x, 1);
                }
            }
            $scope.pages = pages;
        }
        $scope.load($scope.pages[sessionStorage.page], sessionStorage.page);
    });
    $scope.search = function () {
        var arr;
        var tmpdata = [];
        if ($scope.page.filter) {
            for (var x in fieldsdata) {
                for (var i in fieldsdata[x]) {
                    if (fieldsdata[x][i]) {
                        arr = fieldsdata[x][i];
                        arr = arr.toString();
                        arr = arr.toLowerCase();
                        if (arr.indexOf($scope.page.filter.value) >= 0) {
                            tmpdata[tmpdata.length] = fieldsdata[x];
                            break;
                        }
                    }
                }
            }
        }
        $scope.registros = tmpdata.length;
        $scope.pagination.numPages = Math.ceil(tmpdata.length / $scope.pagination.perPage);
        if (tmpdata.length > 0)
            $scope.tabledata = tmpdata;
        else
            $scope.tabledata = fieldsdata;
    }

    $scope.pages = false;
    $scope.fields = false;
    $scope.collection = false;
    $scope.input = {
        messageText: '',
        allMessages: []
    }

    var setUploader = function () {
        $scope.uploader = new FileUploader({
            url: '/api/upload'
        });
        $scope.filestosave = [];
        $scope.uploader.onCompleteItem = function (fileItem, response, status, headers) {
            $scope.filestosave[$scope.filestosave.length] = response.filename;
            console.log(fileItem)
            console.info($scope.filestosave);
            console.log(status)
            console.info(headers);
        };
        $scope.readyToUpload = false;
    }
    setUploader();

    $scope.load = function (item, index) {
        if (typeof $scope.page != 'undefined')
            if (typeof $scope.page.filter != 'undefined')
                $scope.page.filter.value = '';
        $scope.tabledata = false;
        $scope.registros = false;

        /*if (sessionStorage.uf) {
         $scope.valoruf = parseFloat(sessionStorage.uf);
         }*/
        $scope.valoruf = false;
        /*if (item.collection == 'pagos')
         /*$http.get('http://mindicador.cl/api/uf', {}).success(function (response) {
         $scope.valoruf = response.serie[0].valor;
         sessionStorage.uf = $scope.valoruf;
         console.log(item)
         $http.get('/api/data', {
         params: {
         token: Session.get(),
         collection: 'servicios'
         }
         }).success(function (response) {
         if (response.success) {
         
         $scope.servicios = {
         total: 0,
         detalle: []
         };
         for (var t in response.data) {
         if (response.data[t].type == 'UF') {
         response.data[t].valor = response.data[t].valor.replace(',', '.');
         response.data[t].valor = parseFloat(response.data[t].valor)// * parseFloat($scope.valoruf);
         }
         $scope.servicios.detalle[$scope.servicios.detalle.length] = response.data[t];
         $scope.servicios.total = $scope.servicios.total + response.data[t].valor;
         }
         }
         });*/
        //});

        if (item) {
            sessionStorage.page = index;
            $scope.pageIndex = index;
            $scope.page = item;
            $scope.collection = item.collection;

            var params = {
                token: Session.get(),
                collection: item.collection,
                model: item.model
            }
            if (item.collection == 'pagos') {
                params.joined = item.joined.collection;
                if (!$scope.currentPagosYear) {
                    $scope.currentPagosYear = new Date().getFullYear();
                }
                if (!$scope.currentPagosMonth) {
                    $scope.currentPagosMonth = new Date().getMonth();
                }
                obtenerPagos($scope.currentPagosYear, $scope.currentPagosMonth);
            } else {
                $http.get('/api/data', {
                    params: params
                }).success(function (response) {
                    if (response.success) {
                        for (var d in response.data) {
                            if (item.collection == 'pagos') {
                                response.data[d] = {
                                    index: parseInt(parseInt(d) + parseInt(1)),
                                    _id: response.data[d]._id,
                                    nombre: response.data[d].nombre,
                                    run: RutHelper.format(response.data[d].run),
                                    codigo: response.data[d].codigo,
                                    tarifa: response.data[d].tarifa,
                                    type: response.data[d].type
                                }
                            } else {
                                response.data[d].index = parseInt(parseInt(d) + parseInt(1));
                            }
                        }
                        $scope.registros = response.data.length;
                        $scope.pagination.numPages = Math.ceil(response.data.length / $scope.pagination.perPage);
                        $scope.tabledata = registro_pagos = response.data;
                        fieldsdata = response.data;
                    }
                });
            }
        }
    }
    var excelPeriodo;
    $scope.showModalImportPagos = function (fields, data, object) {
        excelPeriodo = object;
        $scope.fields = [{
                name: 'csv_pagos',
                title: 'Cargar Excel',
                type: 'file'
            }]
        jQuery('#modalCSVpagos').modal('show');
    }
    $scope.showModal = function (fields, data, object) {
        /*if ($scope.collection == 'pagos') {
         excelPeriodo = object;
         $scope.fields = [{
         name: 'csv_pagos',
         title: 'Cargar Excel',
         type: 'file'
         }]
         jQuery('#modalCSVpagos').modal('show');
         } else {*/
        //console.info(fields);
        $scope.fields = fields;
        /**
         * Opciones para el dropdown en caso que deba conectarse a datos externos
         */
        for (var x in fields) {
            if (typeof fields[x].data != 'undefined') {
                if (fields[x].data.source == 'function') {
                    $http.get('/api/data/function', {
                        params: {
                            token: Session.get(),
                            function: fields[x].data.function,
                            databack: x
                        }
                    }).success(function (response) {
                        if (response.success) {
                            $scope.fields[response.databack].value = '';
                            $scope.fields[response.databack].data.options = response.data;
                        }
                    });
                } else
                if (typeof fields[x].data.collection != 'undefined') {
                    $http.get('/api/data', {
                        params: {
                            token: Session.get(),
                            collection: fields[x].data.collection,
                            databack: x
                        }
                    }).success(function (response) {
                        if (response.success) {
                            /**
                             * Busqueda a traves de filtro
                             */
                            var data = [];
                            var add = true;
                            for (var y in response.data) {
                                //console.info(response.data[y]);
                                for (var key in response.data[y]) {
                                    if ($scope.fields[response.databack].data.filter) {
                                        for (var filtro in $scope.fields[response.databack].data.filter) {
                                            if (key == $scope.fields[response.databack].data.filter[filtro].key) {
                                                if ($scope.fields[response.databack].data.filter[filtro].value == response.data[y][key]) {
                                                    data[data.length] = response.data[y];
                                                }
                                            }
                                        }
                                    } else {
                                        for (var n in data) {
                                            add = true;
                                            if (data[n]._id == response.data[y]._id) {
                                                add = false;
                                                break;
                                            }
                                        }
                                        if (add)
                                            data[data.length] = response.data[y];
                                    }
                                }
                            }

                            /**
                             * Seleccion de campos
                             */
                            if (data.length > 0) {
                                var option = [];
                                for (var y in data) {
                                    option[y] = [];
                                    for (var field in $scope.fields[response.databack].data.fields) {
                                        for (var key in data[y]) {
                                            if ($scope.fields[response.databack].data.fields[field].field == key) {
                                                id = false;
                                                if ($scope.fields[response.databack].data.fields[field].id) {
                                                    id = true;
                                                }
                                                option[y][option[y].length] = {
                                                    field: $scope.fields[response.databack].data.fields[field].field,
                                                    id: id,
                                                    value: data[y][key]
                                                };
                                            }
                                        }
                                    }
                                }
                            }
                            /**
                             * Formateo de option > value
                             */
                            var key = [];
                            var value = []
                            data = []
                            for (var x in option) {
                                key[x] = [];
                                value[x] = [];
                                for (var z in option[x]) {
                                    if (option[x][z].id) {
                                        key[x][key[x].length] = option[x][z].value;
                                    } else {
                                        value[x][value[x].length] = option[x][z].value;
                                    }
                                }
                                data[data.length] = {
                                    key: key[x].join(' '),
                                    value: value[x].join(' ')
                                }
                            }
                            $scope.fields[response.databack].data.options = data;

                        }
                    });
                }
            }
        }

        if (data) {
            for (var x in $scope.fields) {
                for (var key in data) {
                    if (key == $scope.fields[x].name) {
                        if (data[key])
                            $scope.fields[x].value = data[key];
                    }
                }
            }
        } else {
            for (var x in $scope.fields) {
                $scope.fields[x].value = '';
            }
        }
        jQuery('#modalEdit').modal('show');
        setTimeout(function () {
            jQuery('.chosen-select').each(function () {
                console.info('#' + jQuery(this).attr('id'));
                jQuery('#' + jQuery(this).attr('id')).chosen();
            });
        }, 800);
        //}
    }
    $scope.sendForm = function () {
        var reload = false;
        if ($scope.filestosave.length > 0) {
            reload = true;
            for (var x in $scope.fields) {
                if ($scope.fields[x].type == 'file') {
                    $scope.fields[x].value = $scope.filestosave;
                    break;
                }
            }
        }
        if ($scope.collection == 'asociados') {
            for (var x in $scope.fields) {
                if ($scope.fields[x].name == 'servicios') {
                    console.info($scope.fields[x])
                }
                if ($scope.fields[x].name == 'tipo_casa') {
                    console.info($scope.fields[x])
                }
            }
        }
        $http.post('/api/data', {
            params: {
                token: Session.get(),
                collection: $scope.collection,
                fields: $scope.fields
            }
        }).success(function (response) {
            jQuery('#modalEdit').modal('hide');
            if (reload) {
                setTimeout(function () {
                    location.reload();
                }, 500);
            } else {
                $scope.load($scope.page);
            }
        });
    }

    $scope.uploadCSV = function () {
        if ($scope.uploader.queue.length > 0) {
            if ($scope.uploader.queue[0].isUploaded) {
                $http.post('/api/data/import/excel', {
                    params: {
                        token: Session.get(),
                        filename: $scope.uploader.queue[0].file.name,
                        periodo: excelPeriodo
                    }
                }).success(function (response) {
                    if (response.success) {
                        jQuery('#modalCSVpagos').modal('hide');
                        setTimeout(function () {
                            $scope.uploader.destroy();
                            delete $scope.uploader;
                            setUploader();
                        }, 500);
                        $scope.load($scope.page);
                    } else if (response.message) {
                        alert(response.message);
                        if (response.logout) {
                            sessionStorage.clear();
                            localStorage.clear();
                            $location.path('/');
                        }
                    }
                    /*for (var r in response) {
                     response[r] = {
                     titular: response[r][0],
                     rut: response[r][1],
                     direccion: response[r][2],
                     numeracion: response[r][3],
                     tarifa: response[r][4],
                     status: 'Pendiente'
                     }
                     }
                     sessionStorage.uploaded_csv = JSON.stringify(response);*/

                });
            } else {
                alert('Primero presione el boton subir para cargar el CSV en el sistema');
            }
        } else {
            alert('Primero seleccione un archivo CSV para cargar al sistema');
        }
    }

    $scope.dropItem = function (item, fields) {
        console.log(item);
        console.info(fields);
        var id = false;
        for (var x in item) {
            for (var y in fields) {
                if (item[x].name == y) {
                    if (item[x].id) {
                        id = {
                            key: item[x].name,
                            value: fields[y]
                        }
                        break;
                        break;
                    }
                }
            }
        }
        if (!id) {
            for (var y in fields) {
                if (y == '_id') {
                    id = {
                        key: y,
                        value: fields[y]
                    }
                    break;
                }
                console.info(fields[y]);
            }
        }
        if (id && confirm('¿Seguro que desea eliminar este registro?')) {
            $http.post('/api/data/delete', {
                params: {
                    token: Session.get(),
                    collection: $scope.collection,
                    data: id
                }
            }).success(function (response) {
                $scope.load($scope.page);
            });
        }
    }
    $scope.closeSession = function () {
        if (confirm('¿Seguro que desea cerrar su sesión?')) {
            sessionStorage.clear();
            localStorage.clear();
            $location.path('/');
        }
    }
    $scope.onUploadSelect = function () {
        $scope.readyToUpload = true;
    }
    $scope.selectFile = function () {
        jQuery('#inputfile').click();
    }
    $scope.dropFile = function (file, id) {
        var input = file.split('-');
        input = input.splice(1);
        if (confirm('¿Desea eliminar el archivo "' + input.join('-') + '"?')) {
            $http.post('/api/file/delete', {
                params: {
                    token: Session.get(),
                    collection: $scope.collection,
                    data: {
                        id: id,
                        file: file
                    }
                }
            }).success(function (response) {
                $scope.load($scope.page);
            });
        }
    }
    $scope.downloadFile = function (file) {
        location.href = '/descargas/' + file;
    }
    $scope.openMessages = function (data) {
        $scope.itemId = data._id;
        $scope.input.allMessages = data.messages;
        jQuery('#modalEditMessages').modal('show');
    }
    $scope.sendMessage = function () {
        if ($scope.itemId && $scope.input.messageText) {
            $http.post('/api/message', {
                params: {
                    token: Session.get(),
                    collection: $scope.collection,
                    data: {
                        id: $scope.itemId,
                        message: $scope.input.messageText
                    }
                }
            }).success(function () {
                $scope.input.messageText = '';
                jQuery('#modalEditMessages').modal('hide');
                $scope.load($scope.page);
            });
        } else {
            alert('Debe escribir un mensaje antes de enviar el mensaje');
        }
    }
    $scope.chosenSelect = function (name, item) {
        console.warn(item);
        console.info(jQuery('#' + jQuery(name).attr('id')).chosen().val());
    }
    var months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    var registro_pagos = [];
    var obtenerPagos = function (year, month) {
        for (var c in months) {
            if (months[c] == month) {
                month = parseInt(c);
                break;
            }
        }

        var params = {
            token: Session.get(),
            collection: 'pagos',
            joined: {
                "fields": ["nombre", "apellidos"],
                "name": "asociados",
                "localField": "run",
                "foreignField": "run"
            },
            where: {
                year: year,
                month: month
            },
            historial: true
        }
        $http.get('/api/data', {
            params: {
                token: Session.get(),
                collection: 'valoresuf'
            }
        }).success(function (response) {
            if (response.success) {
                if (response.data.length > 0) {
                    var valor = false;
                    for (var x in response.data) {
                        if (periodos_months[month] == response.data[x].mes && year == response.data[x].year) {
                            valor = response.data[x].valor;
                            break;
                        }
                    }
                    if (valor) {
                        $scope.valoruf = valor;

                        $http.get('/api/data', {
                            params: params
                        }).success(function (response) {
                            if (response.success) {
                                /*if (response.data.length == 0) {
                                 $scope.pagos.showUploadExcel = true;
                                 } else {
                                 $scope.pagos.showUploadExcel = false;
                                 }*/
                                var registros = [];
                                var tarifa;
                                var total;
                                for (var d in response.data) {
                                    tarifa = {
                                        detalle: response.data[d].tarifa
                                    }
                                    total = 0;
                                    for (var v in tarifa.detalle) {
                                        total += tarifa.detalle[v].valor;
                                    }
                                    tarifa.total = total;
                                    tarifa.totalpesos = total * parseFloat($scope.valoruf);
                                    registros[registros.length] = {
                                        index: parseInt(parseInt(d) + parseInt(1)),
                                        _id: response.data[d]._id,
                                        nombre: response.data[d].nombre,
                                        run: RutHelper.format(response.data[d].run),
                                        codigo: response.data[d].codigo,
                                        tarifa: tarifa,
                                        type: response.data[d].type,
                                        debe: response.data[d].debe,
                                        haber: response.data[d].haber
                                    }
                                }
                                $scope.registros = response.data.length;
                                $scope.pagination.numPages = Math.ceil(response.data.length / $scope.pagination.perPage);
                                $scope.tabledata = registro_pagos = registros;

                                /**
                                 * DETALLE DEL POPOVER
                                 */
                                setTimeout(function () {
                                    jQuery('.popover-tarifa').each(function () {
                                        var data = jQuery(this).data('popover-content');
                                        var text = '<p><b>TOTAL: ' + data.total + '</b></p>';
                                        for (var x in data.detalle) {
                                            text += '<p><b>' + data.detalle[x].nombre + ': ' + (Math.round(data.detalle[x].valor * 100) / 100) + '</b> UF - ' + ($filter('currency')(data.detalle[x].valor * parseFloat($scope.valoruf))) + '</p>';
                                        }
                                        jQuery(this).popover({
                                            title: 'Detalle de la tarifa',
                                            html: true,
                                            content: text,
                                            placement: 'right',
                                            trigger: 'focus'
                                        });
                                    });
                                }, 1000);

                            }
                        });

                    } else {
                        $scope.valoruf = false;
                        alert('No hay valores UF cargados de ' + months[month]);
                    }
                } else {
                    alert('No hay valores UF cargados');
                }
            } else {
                alert('No hay valores UF cargados');
            }
        });
    }
    var periodos_months = months;
    var periodos = [];
    var tmp_months = [];
    for (var year = 2010; year <= new Date().getFullYear(); year++) {
        if (new Date().getFullYear() == year) {
            tmp_months = [];
            for (var x in periodos_months) {
                if (x <= new Date().getMonth()) {
                    tmp_months[tmp_months.length] = periodos_months[x];
                }
            }
        } else {
            tmp_months = periodos_months;
        }
        periodos[periodos.length] = {
            year: year,
            months: tmp_months
        }
    }
    $scope.pagos = {
        periodos: periodos,
        tabYearActive: null,
        yearActive: null,
        tabMonthActive: null,
        monthActive: null,
        showUploadExcel: false,
        changeStatus: function (select, data) {
            console.log(data);
            var pagado = 0;
            if (select != 'Carga PAC PAT realizada' && select != 'PAC PAT rechazado' && select != 'Pendiente' && select != 'Cheque recibido') {
                pagado = prompt('Total a pagar', Math.round(data.tarifa.totalpesos));
            }
            $http.post('/api/pagar', {
                params: {
                    token: Session.get(),
                    data: {
                        run: data.run,
                        pago: pagado,
                        month: this.tabMonthActive,
                        year: this.yearActive,
                        status: select,
                        cobrodelmes: Math.round(data.tarifa.totalpesos)
                    }
                }
            }).success(function (response) {
                $scope.load($scope.page);
            });
        },
        modalEditarDetalles: function (data) {
            $scope.showModal([{
                    "name": "_id",
                    "type": "hidden"
                }, {
                    name: 'files',
                    title: 'Documentos',
                    type: 'file'
                }, {
                    name: 'comentarios',
                    title: 'Comentarios',
                    type: 'textarea'
                }], {
                _id: data._id
            });
        },
        notificarContador: function (month, year) {
            if (confirm('¿Desea notificar al contador que la carga de cobros se encuentra lista?')) {
                $http.post('/api/notiticar-contador', {
                    params: {
                        token: Session.get(),
                        year: year,
                        month: month
                    }
                }).success(function (response) {
                    if (response.success) {
                        alert('Se ha enviado una notificación por correo al contador correctamente');
                    } else {
                        alert(response.message);
                    }
                });
            }
        },
        changeTab: function (index, year, month) {
            this.tabMonthActive = index;
            this.monthActive = month;
            obtenerPagos(year, month);
        },
        search: function () {
            var arr;
            var tmpdata = [];
            for (var x in registro_pagos) {
                for (var i in registro_pagos[x]) {
                    if (registro_pagos[x][i]) {
                        arr = registro_pagos[x][i];
                        arr = arr.toString();
                        arr = arr.toLowerCase();
                        if (arr.indexOf($scope.page.filter.value) >= 0) {
                            tmpdata[tmpdata.length] = registro_pagos[x];
                            break;
                        }
                    }
                }
            }
            $scope.registros = tmpdata.length;
            $scope.pagination.numPages = Math.ceil(tmpdata.length / $scope.pagination.perPage);
            if (tmpdata.length > 0)
                $scope.tabledata = tmpdata;
            else
                $scope.tabledata = [];
            setTimeout(function () {
                jQuery('.popover-tarifa').each(function () {
                    var detalle = jQuery(this).data('popover-content');
                    var text = '<p>ADT: ' + detalle.adt + ' UF - (' + $filter('currency')(parseFloat(detalle.adt) * $scope.valoruf) + ')</p>';
                    if (detalle.modelo)
                        text += '<p>' + detalle.modelo.nombre + ': ' + detalle.modelo.valor + ' UF - (' + $filter('currency')(detalle.modelo.valor.replace(',', '.') * $scope.valoruf) + ')</p>';
                    if (detalle.servicios) {
                        for (var x in detalle.servicios) {
                            text += '<p>' + detalle.servicios[x].nombre + ': ' + detalle.servicios[x].valor + ' UF - (' + $filter('currency')(detalle.servicios[x].valor.replace(',', '.') * $scope.valoruf) + ')</p>';
                        }
                    }
                    jQuery(this).popover({
                        title: 'Detalle de la tarifa',
                        html: true,
                        content: text,
                        placement: 'right',
                        trigger: 'focus'
                    });
                });
            }, 1000);
        }
    }
    $scope.pagos.tabYearActive = $scope.pagos.periodos.length - 1;
    $scope.pagos.yearActive = $scope.pagos.periodos[$scope.pagos.periodos.length - 1].year;
    $scope.pagos.tabMonthActive = $scope.pagos.periodos[$scope.pagos.periodos.length - 1].months.length - 1;
    $scope.pagos.monthActive = $scope.pagos.periodos[$scope.pagos.periodos.length - 1].months[$scope.pagos.periodos[$scope.pagos.periodos.length - 1].months.length - 1];

});