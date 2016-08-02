var procesar = function (collection, data, index, cb) {
    if (data[index]) {
        collection.insert({
            run: data[index].run,
            code: data[index].code,
            tarifa: data[index].tarifa,
            type: data[index].type,
            month: new Date().getMonth(),
            year: new Date().getFullYear()
        });
        procesar(collection, data, index + 1, cb);
    } else {
        cb();
    }
}
exports.procesar = procesar;