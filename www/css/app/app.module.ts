import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { HeaderComponent } from './shared/header/header.component';
import { PagosComponent } from './pages/pagos/pagos.component';
import { CuentasPorCobrarComponent } from './pages/cuentas-por-cobrar/cuentas-por-cobrar.component';
import { AsociadosComponent } from './pages/asociados/asociados.component';
import { TitulosComponent } from './shared/titulos/titulos.component';
import { BotonesAsociadosComponent } from './shared/botones-asociados/botones-asociados.component';
import { PestanasComponent } from './pages/asociados/pestanas/pestanas.component';
import { ActivosComponent } from './pages/asociados/pestanas/activos/activos.component';
import { SuspendidosComponent } from './pages/asociados/pestanas/suspendidos/suspendidos.component';
import { EliminadosComponent } from './pages/asociados/pestanas/eliminados/eliminados.component';
import { FiltroMesComponent } from './pages/pagos/filtro-mes/filtro-mes.component';
import { PestanaPagosComponent } from './pages/pagos/pestana-pagos/pestana-pagos.component';
import { PlanillaComponent } from './pages/pagos/pestana-pagos/planilla/planilla.component';
import { CostosComponent } from './pages/pagos/pestana-pagos/costos/costos.component';
import { IngresoComponent } from './pages/pagos/pestana-pagos/ingreso/ingreso.component';
import { DetalleComponent } from './pages/pagos/pestana-pagos/detalle/detalle.component';

export const router: Routes = [
  { path: '', redirectTo: 'pagos', pathMatch: 'full' },
  { path: 'pagos', component: PagosComponent, pathMatch: 'full' },
  { path: 'cuentas-por-cobrar', component: CuentasPorCobrarComponent, pathMatch: 'full' }
];

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    PagosComponent,
    CuentasPorCobrarComponent,
    AsociadosComponent,
    TitulosComponent,
    BotonesAsociadosComponent,
    PestanasComponent,
    ActivosComponent,
    SuspendidosComponent,
    EliminadosComponent,
    FiltroMesComponent,
    PestanaPagosComponent,
    PlanillaComponent,
    CostosComponent,
    IngresoComponent,
    DetalleComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(router, { enableTracing: true })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
