(function () {
    "use strict";

    var paginationModule = angular.module('simplePagination', [$rootScope]);

    paginationModule.factory('Pagination', function () {

        var pagination = {};

        pagination.getNew = function (perPage) {

            perPage = perPage === undefined ? 5 : perPage;

            var paginator = {
                numPages: 1,
                perPage: perPage,
                page: 0
            };

            paginator.prevPage = function () {
                if (paginator.page > 0) {
                    paginator.page -= 1;
                    $rootScope.$emit('refresh');
                }
            };

            paginator.nextPage = function () {
                if (paginator.page < paginator.numPages - 1) {
                    paginator.page += 1;
                    $rootScope.$emit('refresh');
                }
            };

            paginator.toPageId = function (id) {
                if (id >= 0 && id <= paginator.numPages - 1) {
                    paginator.page = id;
                    $rootScope.$emit('refresh');
                }
            };

            return paginator;
        };

        return pagination;
    });

    paginationModule.filter('startFrom', function () {
        return function (input, start) {
            if (input === undefined) {
                return input;
            } else {
                if (typeof input.slice == 'function')
                    return input.slice(+start);
                else {
                    //console.info(input);
                    return input;
                }
            }
        };
    });

    paginationModule.filter('range', function () {
        return function (input, total) {
            total = parseInt(total);
            for (var i = 0; i < total; i++) {
                input.push(i);
            }
            return input;
        };
    });

})();
