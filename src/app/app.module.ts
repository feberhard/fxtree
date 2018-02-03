import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { FxTreeComponent } from './fxtree/fxtree.component';
import {
    FxTreeCollapseDirective,
    FxTreeDragDropDirective,
    FxTreeCheckboxDirective
} from './fxtree/plugins';


@NgModule({
    declarations: [
        AppComponent,
        FxTreeComponent,
        FxTreeCollapseDirective,
        FxTreeDragDropDirective,
        FxTreeCheckboxDirective
    ],
    imports: [
        BrowserModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
