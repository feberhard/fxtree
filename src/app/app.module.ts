import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { FxTreeComponent } from './fxtree/fxtree.component';


@NgModule({
    declarations: [
        AppComponent,
        FxTreeComponent
    ],
    imports: [
        BrowserModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
