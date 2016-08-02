app.controller('app', function ($scope, Session, $http, $location, FileUploader, Pagination) {

    var socket = io.connect();
    $scope.pagination = Pagination.getNew(30);
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
    $scope.load = function (item, index) {

        if (typeof $scope.page != 'undefined')
            if (typeof $scope.page.filter != 'undefined')
                $scope.page.filter.value = '';
        $scope.tabledata = false;
        $scope.registros = false;

        $http.get('http://mindicador.cl/api/uf', {}).success(function (response) {
            $scope.valoruf = response.serie[0].valor;
            $http.get('/api/data', {
                params: {
                    token: Session.get(),
                    collection: 'servicios'
                }
            }).success(function (response) {
                if (response.success) {

                    $scope.servicios = {
                        total: 0
                    };
                    for (var t in response.data) {
                        if (response.data[t].type == 'UF') {
                            response.data[t].valor = response.data[t].valor.replace(',', '.');
                            response.data[t].valor = parseFloat(response.data[t].valor) * parseFloat($scope.valoruf);
                        }
                        $scope.servicios.total = $scope.servicios.total + response.data[t].valor
                    }
                }
            });
        });
        if (sessionStorage.uploaded_csv) {
            $scope.uploaded_csv = JSON.parse(sessionStorage.uploaded_csv);
        }

        if (item) {
            sessionStorage.page = index;
            $scope.pageIndex = index;
            $scope.page = item;
            $scope.collection = item.collection;
            $http.get('/api/data', {
                params: {
                    token: Session.get(),
                    collection: item.collection,
                    model: item.model
                }
            }).success(function (response) {
                if (response.success) {
                    for (var d in response.data) {
                        response.data[d].index = parseInt(parseInt(d)+parseInt(1));
                    }
                    $scope.registros = response.data.length;
                    $scope.pagination.numPages = Math.ceil(response.data.length / $scope.pagination.perPage);
                    $scope.tabledata = response.data;
                    fieldsdata = response.data;
                }
            });
        }
    }

    $scope.showModal = function (fields, data) {
        if ($scope.collection == 'pagos') {
            $scope.fields = [{
                    name: 'csv_pagos',
                    title: 'Cargar CSV',
                    type: 'file'
                }]
            jQuery('#modalCSVpagos').modal('show');
        } else {
            console.info(fields);
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
                    if (fields[x].data.source == 'postgres') {
                        $http.get('/api/data', {
                            params: {
                                token: Session.get(),
                                table: fields[x].data.table,
                                fields: fields[x].data.fields,
                                databack: x
                            }
                        }).success(function (response) {
                            if (response.success) {
                                var fieldsinfo = $scope.fields[response.databack];
                                var key;
                                var value;
                                var options = [];
                                console.info(fieldsinfo.name);
                                switch (fieldsinfo.name) {
                                    case 'cliente':
                                        for (var x in response.data) {
                                            if (response.data[x].cl_id != '') {
                                                key = response.data[x].cl_id;
                                                value = [response.data[x].cl_rut, response.data[x].cl_razon_social].join(' - ');
                                                options[options.length] = {
                                                    key: key,
                                                    value: value
                                                }
                                            }
                                        }
                                        $scope.fields[response.databack].data.options = options;
                                        break;
                                    case 'modelo':
                                        for (var x in response.data) {
                                            if (response.data[x].tav_id != '') {
                                                key = response.data[x].tav_id;
                                                value = response.data[x].tav_detalle;
                                                options[options.length] = {
                                                    key: key,
                                                    value: value
                                                }
                                            }
                                        }
                                        $scope.fields[response.databack].data.options = options;
                                        break;
                                }
                                console.log($scope.fields[response.databack]);
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
                jQuery('.chosen-select').chosen();
            }, 800);
        }
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
                        filename: $scope.uploader.queue[0].file.name
                    }
                }).success(function (response) {
                    if (response.success) {

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
                    location.reload();
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

    $scope.pagos = {
        currentYear: new Date().getFullYear(),
        periodos: [{
                months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
                year: 2015
            }, {
                months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto'],
                year: 2016
            }],
        tabYearActive: 0,
        tabMonthActive: 0
    }
    $scope.pagos.tabYearActive = $scope.pagos.periodos.length - 1;
    $scope.pagos.tabMonthActive = $scope.pagos.periodos[$scope.pagos.periodos.length - 1].months.length - 1;

    var substringMatcher = function (strs) {
        return function findMatches(q, cb) {
            var matches, substringRegex;
            matches = [];
            substrRegex = new RegExp(q, 'i');
            $.each(strs, function (i, str) {
                if (substrRegex.test(str)) {
                    matches.push(str);
                }
            });
            cb(matches);
        };
    };

});