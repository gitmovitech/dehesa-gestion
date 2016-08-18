var procesar = function (collection, data, index, cb) {
    if (data[index]) {
        if (data[index].run) {
            collection.insert({
                run: data[index].run,
                codigo: data[index].codigo,
                tarifa: data[index].tarifa,
                type: data[index].status,
                month: data[index].month,
                year: data[index].year
            });
        }
        procesar(collection, data, index + 1, cb);
    } else {
        cb();
    }
}
exports.procesar = procesar;