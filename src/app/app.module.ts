import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling'
import { AppComponent } from './app.component';
import { FxTreeComponent } from './fxtree/fxtree.component';
import {
    FxTreeCheckboxDirective
} from './fxtree/plugins';
import { FxTreeNodeComponent } from './fxtree/fxtree-node';


@NgModule({
    declarations: [
        AppComponent,
        FxTreeComponent,
        FxTreeNodeComponent,
        FxTreeCheckboxDirective,
    ],
    imports: [
        BrowserModule,
        ScrollingModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
