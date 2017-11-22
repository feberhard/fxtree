import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    public data: number[];

    constructor() { }

    ngOnInit() {
        this.data = this.generateData(1000000);
    }

    public generateData(count: number) {
        const data = new Array(count);
        for (let i = 0; i < count; i++) {
            data[i] = i;
        }
        return data;
    }
}
