import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { FxTreeComponent } from './fxtree/fxtree.component';
import {
    FxTreeCollapseDirective,
    FxTreeDragDropDirective,
    FxTreeCheckboxDirective
} from './fxtree/plugins';
import { FxTreeNodeComponent } from './fxtree/fxtree-node/fxtree-node.component';


@NgModule({
    declarations: [
        AppComponent,
        FxTreeComponent,
        FxTreeCollapseDirective,
        FxTreeDragDropDirective,
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
