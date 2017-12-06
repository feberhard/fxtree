import { Component, OnInit } from '@angular/core';
import { FxTreeNode } from './fxtree/fxtree.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    public data: number[];
    public tree: FxTreeNode[];

    constructor() { }

    ngOnInit() {
        // this.data = this.generateData(5000);

        // this.tree = this.generateTree(65000, 1);
        this.tree = this.generateTree(7, 6);
        // this.tree = this.generateTree(5, 3);
        // this.tree = this.generateTree(3, 3);
    }

    public generateData(count: number) {
        const data = new Array(count);
        for (let i = 0; i < count; i++) {
            data[i] = i;
        }
        return data;
    }

    public generateTree(countPerLevel: number, level: number): FxTreeNode[] {
        if (level === 0) {
            return null;
        }

        const nodes = new Array<FxTreeNode>(countPerLevel);
        for (let i = 0; i < countPerLevel; i++) {
            nodes[i] = {
                text: 'Level ' + level + ' - Element ' + i,
                children: this.generateTree(countPerLevel, level - 1)
            };
        }

        return nodes;
    }
}
