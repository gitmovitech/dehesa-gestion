import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { HeaderComponent } from './shared/header/header.component';
import { PagosComponent } from './pages/pagos/pagos.component';
import { CuentasPorCobrarComponent } from './pages/cuentas-por-cobrar/cuentas-por-cobrar.component';

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
    CuentasPorCobrarComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(router, { enableTracing: true })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
