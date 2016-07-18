app.controller('app', function ($scope, Session, $http, $location, FileUploader, Pagination) {

    var socket = io.connect();
    var dictionary = [];
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
        if ($scope.session.type == 'admin') {
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
                    $scope.registros = response.data.length;
                    $scope.pagination.numPages = Math.ceil(response.data.length / $scope.pagination.perPage);
                    $scope.tabledata = response.data;
                    fieldsdata = response.data;
                }
            });
            if (item.model == 'devices') {
                $http.get('/api/data', {
                    params: {
                        token: Session.get(),
                        collection: 'dictionary'
                    }
                }).success(function (response) {
                    if (response.success) {
                        dictionary = response.data;
                    }
                });
            }
        }
    }

    $scope.showModal = function (fields, data) {
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

    var dictionaryItems = [];
    var dictionaryItemsText = [];
    $scope.openCommands = function (fields, data) {

        $scope.optionCommandText = [];

        var mbreak = false;
        var modelodict;
        var modelodata;
        for (var x in dictionary) {
            modelodict = dictionary[x].model;
            modelodict = modelodict.replace('-', ' ');
            modelodict = modelodict.split(' ');
            modelodata = data.modelo;
            modelodata = modelodata.replace('-', ' ');
            modelodata = modelodata.split(' ');
            for (var a in modelodict) {
                for (var b in modelodata) {
                    if (modelodict[a] == modelodata[b]) {
                        $scope.optionCommandText[$scope.optionCommandText.length] = dictionary[x];
                        dictionaryItems[dictionaryItems.length] = dictionary[x].command;
                        dictionaryItemsText[dictionaryItemsText.length] = dictionary[x].detail;
                        mbreak = true;
                        break;
                    }
                }
                if (mbreak) {
                    mbreak = false;
                    break;
                }
            }
        }

        $scope.commandSentHistory = [];
        //console.info($scope.optionCommandText);
        $scope.commandReceivedHistory = [];
        $scope.currentAvserie = data.av_serie;
        socket.emit('getCommandSentHistory', {
            token: Session.get(),
            avserie: $scope.currentAvserie
        }, function (response) {
            if (response.length > 0) {
                $scope.commandSentHistory = response.reverse();
                for (var x in $scope.commandSentHistory) {
                    for (var c in dictionaryItems) {
                        if ($scope.commandSentHistory[x].command == dictionaryItems[c]) {
                            $scope.commandSentHistory[x].commandText = dictionaryItemsText[c];
                        }
                    }
                }
                $scope.$apply();
            }
        });
        socket.emit('commandReceivedHistory', {
            token: Session.get(),
            avserie: $scope.currentAvserie
        }, function (response) {
            if (response.length > 0) {
                $scope.commandReceivedHistory = response;
                $scope.$apply();
            }
        });
        jQuery('#modal-comandos').modal('show');
        jQuery('#modal-comandos').on('hide.bs.modal', function (event) {
            jQuery('.typeahead').typeahead('destroy');
            jQuery('#inputCommandGroup').html('');
            $scope.commands.input = '';
            jQuery('#inputCommand').val('');
            dictionaryItems = [];
            socket.emit('clearInterval');
            $scope.waitingResponse = false;
        });
        jQuery('#modal-comandos').on('shown.bs.modal', function (event) {
            jQuery('.chosen-select').chosen({
                no_results_text: "No se ha encontrado coincidencia con lo escrito"
            }).change(function () {
                $scope.commands.input = jQuery('#selectCommand').val();
                jQuery('#inputCommand').val($scope.commands.input);
            });
            jQuery('#inputCommandGroup').html('<input ng-model="commands.input" type="text" class="form-control typeahead" id="inputCommand" placeholder="Escriba comando">');
            jQuery('.typeahead').typeahead({
                hint: true,
                highlight: true,
                minLength: 1
            }, {
                name: 'commands',
                source: substringMatcher(dictionaryItems)
            });
            jQuery('.typeahead').bind('typeahead:cursorchange', function (ev, suggestion) {
                if (suggestion) {
                    jQuery('#inputCommand').popover('destroy');
                    setTimeout(function () {
                        for (var x in dictionaryItems) {
                            if (suggestion == dictionaryItems[x]) {
                                console.info(dictionaryItemsText[x]);
                                jQuery('#inputCommand').popover({
                                    content: dictionaryItemsText[x]
                                });
                                jQuery('#inputCommand').popover('show');
                                break;
                            }
                        }
                    }, 300);
                }
            });
            jQuery('.typeahead').bind('typeahead:select', function (ev, suggestion) {
                jQuery('#inputCommand').popover('destroy');
            });
        });

    }
    $scope.commands = {
        input: '',
        send: function () {
            if (jQuery('#inputCommand').val() != '') {
                $scope.commands.input = jQuery('#inputCommand').val();
            }
            if ($scope.commands.input) {
                var dataCommand = {
                    avserie: $scope.currentAvserie,
                    executed: new Date().getTime(),
                    command: $scope.commands.input,
                    user: $scope.session.email,
                    label: 'label-info',
                    response: 'Comando enviado al servidor',
                    appearcss: 'margin-top-hidden'
                }
                var tmp = $scope.commandSentHistory;
                tmp = tmp.reverse();
                tmp[tmp.length] = dataCommand;
                $scope.commandSentHistory = tmp.reverse();
                for (var x in $scope.commandSentHistory) {
                    for (var c in dictionaryItems) {
                        if ($scope.commandSentHistory[x].command == dictionaryItems[c]) {
                            $scope.commandSentHistory[x].commandText = dictionaryItemsText[c];
                        }
                    }
                }
                socket.emit('command', {
                    token: Session.get(),
                    data: dataCommand
                });
                $scope.commands.input = '';
                setTimeout(function () {
                    $scope.commandSentHistory[0].appearcss = 'margin-top-visible';
                    $scope.waitingResponse = true;
                    $scope.$apply();
                }, 100);
            }
        }
    }
    socket.on('checkStatusSent', function (response) {
        if(response.estado == 1){
            for(var x in $scope.commandSentHistory){
                if($scope.commandSentHistory[x].executed == response.executed){
                    $scope.commandSentHistory[x].label = 'label-success';
                    $scope.commandSentHistory[x].response = 'Comando recibido satisfactoriamente';
                    $scope.$apply();
                    break;
                }
            }
        }
    });

    socket.on('command', function (response) {
        var tmp = $scope.commandReceivedHistory;
        tmp = tmp.reverse();
        tmp[tmp.length] = {
            avserie: response.avserie,
            reponsedate: response.reponsedate,
            responselabel: response.responselabel,
            response: response.response,
            appearcss: 'margin-top-hidden'
        }
        $scope.commandReceivedHistory = tmp.reverse();
        $scope.$apply();
        setTimeout(function () {
            $scope.commandReceivedHistory[0].appearcss = 'margin-top-visible';
            $scope.waitingResponse = null;
            $scope.$apply();
        }, 100);
    });

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