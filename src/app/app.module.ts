import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { FxTreeComponent } from './fxtree/fxtree.component';
import {
    FxTreeCheckboxDirective
} from './fxtree/plugins';
import { FxTreeNodeComponent } from './fxtree/fxtree-node/fxtree-node.component';


@NgModule({
    declarations: [
        AppComponent,
        FxTreeComponent,
        FxTreeCheckboxDirective,
        FxTreeNodeComponent
    ],
    imports: [
        BrowserModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
