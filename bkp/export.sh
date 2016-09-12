#ª/bin/bash
mongoexport --db dehesa --collection users --out dehesa_users.json
mongoexport --db dehesa --collection modelos --out dehesa_modelos.json
mongoexport --db dehesa --collection asociados --out dehesa_asociados.json
mongoexport --db dehesa --collection pagos --out dehesa_pagos.json
mongoexport --db dehesa --collection servicios --out dehesa_servicios.json
mongoexport --db dehesa --collection valoresuf --out dehesa_valoresuf.json