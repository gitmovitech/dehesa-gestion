#ª/bin/bash
mongoimport --db dehesa --collection users --file dehesa_users.json
mongoimport --db dehesa --collection modelos --file dehesa_modelos.json
mongoimport --db dehesa --collection asociados --file dehesa_asociados.json
mongoimport --db dehesa --collection pagos --file dehesa_pagos.json
mongoimport --db dehesa --collection servicios --file dehesa_servicios.json
mongoimport --db dehesa --collection valoresuf --file dehesa_valoresuf.json