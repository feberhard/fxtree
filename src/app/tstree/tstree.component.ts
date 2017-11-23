import { Component, OnInit, Input, ElementRef, ViewEncapsulation, HostListener } from '@angular/core';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'tstree',
    templateUrl: './tstree.component.html',
    styleUrls: ['./tstree.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TsTreeComponent implements OnInit {

    @Input() data: TsTreeNodeInternal[];
    @Input() nodeHeight: number;

    private host: HTMLElement;
    private hostUl: HTMLUListElement;
    private nodeCount: number;

    constructor(private el: ElementRef) {
        this.nodeHeight = 24;
    }

    ngOnInit() {
        this.host = <HTMLDivElement>(document.getElementsByClassName('tstree-container')[0]);
        this.hostUl = document.createElement('ul');
        this.hostUl.classList.add('tstree-root');
        this.host.appendChild(this.hostUl);

        this.nodeCount = this.indexData(this.data);
        this.hostUl.style.height = this.nodeCount * this.nodeHeight + 'px';

        console.log(this.nodeCount);
        console.log(this.data);

        // for (let i = 0; i < 150; i++) {
        //     console.log(i, this.getElementAtIndex(<TsTreeNodeInternal[]>this.data, i));
        // }

        // this.loadData(this.data);
        this.refresh(this.data);
    }

    private indexData(data: TsTreeNode[], level: number = 0, index: number = 0, parent: TsTreeNodeInternal = null): number {
        for (let i = 0; i < data.length; i++) {
            const internalNode = <TsTreeNodeInternal>data[i];
            internalNode._tstree = { level: level, index: index, parent: parent };
            index++;
            if (internalNode.children && internalNode.children.length > 0) {
                index = this.indexData(internalNode.children, level + 1, index, internalNode);
            }
            internalNode._tstree.currentChildCount = internalNode._tstree.totalChildCount = index - internalNode._tstree.index - 1;
        }
        return index;
    }

    // private loadData(data: TsTreeNodeInternal[]) {
    //     const listHeight = data.length * this.nodeHeight;
    //     // clientHeight = height + padding
    //     // offsetHeight = height + padding + border
    //     const hostHeight = this.host.clientHeight;

    //     const maxDisplayCount = (hostHeight / this.nodeHeight) + 1;  // + 1 cause of possible half item on top and bottom

    //     const { subtreeUl: treeUl } = this.loadSubtree(data);
    //     treeUl.classList.add('tstree-root');

    //     this.host.appendChild(treeUl);
    // }

    // private loadSubtree(data: TsTreeNodeInternal[], limitElements: number = Number.MAX_SAFE_INTEGER) {
    //     const ul = document.createElement('ul');
    //     ul.classList.add('tstree-node-container');

    //     for (let i = 0; i < data.length; i++) {
    //         if (limitElements <= 0) {
    //             return { subtreeUl: ul, remainingLimitElements: limitElements };
    //         }
    //         limitElements--;
    //         const li = document.createElement('li');
    //         li.classList.add('tstree-node');

    //         const nodeContentDiv = document.createElement('div');
    //         nodeContentDiv.classList.add('tstree-node-content');
    //         nodeContentDiv.textContent = data[i].text + ' - ' + data[i]._tstree.index;
    //         li.appendChild(nodeContentDiv);

    //         if (data[i].children && data[i].children.length > 0) {
    //             const { subtreeUl, remainingLimitElements } = this.loadSubtree(data[i].children, limitElements);
    //             limitElements = remainingLimitElements;
    //             li.appendChild(subtreeUl);
    //         }

    //         ul.appendChild(li);
    //     }

    //     return { subtreeUl: ul, remainingLimitElements: limitElements };
    // }

    // private getElementAtIndex(data: TsTreeNodeInternal[], index: number) {
    //     // TODO: use binary search
    //     for (let i = 0; i < data.length; i++) {
    //         const currentNode = data[i];
    //         if (currentNode._tstree.index === index) {
    //             return data.slice(i);
    //         }
    //         if (currentNode._tstree.index > index) {
    //             return this.getElementAtIndex(data[i - 1].children, index);
    //         }
    //     }
    //     return this.getElementAtIndex(data[data.length - 1].children, index);
    // }

    private getTreeElements(data: TsTreeNodeInternal[], startIndex: number, endIndex: number): HTMLElement[] {
        const elements: HTMLElement[] = [];

        for (let i = 0; i < data.length; i++) {
            const currentNode = data[i];

            if (currentNode._tstree.index > endIndex) {
                return elements;
            }

            let li: HTMLLIElement;
            if (currentNode._tstree.index >= startIndex) {
                li = document.createElement('li');
                li.classList.add('tstree-node');

                const nodeContentDiv = document.createElement('div');
                nodeContentDiv.classList.add('tstree-node-content');
                nodeContentDiv.textContent = data[i].text + ' - ' + data[i]._tstree.index;
                li.appendChild(nodeContentDiv);

                elements.push(li);
            }

            if (currentNode._tstree.currentChildCount > 0
                && currentNode._tstree.index + currentNode._tstree.currentChildCount >= startIndex
            ) {
                const subtreeUl = document.createElement('ul');
                subtreeUl.classList.add('tstree-children');
                const subNodes = this.getTreeElements(currentNode.children, startIndex, endIndex);
                subNodes.forEach(n => subtreeUl.appendChild(n));
                if (li) {
                    li.appendChild(subtreeUl);
                } else {
                    elements.push(subtreeUl);
                }
            }

        }

        return elements;
    }

    private refresh(data: TsTreeNode[]) {
        const listHeight = this.nodeCount * this.nodeHeight;
        const hostHeight = this.host.clientHeight;
        const maxDisplayCount = Math.ceil((hostHeight / this.nodeHeight) + 1);  // + 1 cause of possible half item on top and bottom

        const scrollTop = this.host.scrollTop;

        const topElements = Math.min(Math.floor(scrollTop / this.nodeHeight), this.nodeCount - maxDisplayCount);
        const topHeight = topElements * this.nodeHeight;

        const bottomElements = this.nodeCount - topElements - maxDisplayCount;
        const bottomHeight = bottomElements * this.nodeHeight;

        // console.log('topElements: ' + topElements + ' - scrollTop: ' + scrollTop);

        const ul = document.createElement('ul');
        // ul.classList.add('tstree-root');
        // ul.style.height = listHeight + 'px';

        if (topHeight > 0) {
            const topLi = document.createElement('li');
            topLi.classList.add('tstree-node');
            topLi.innerText = 'top';
            topLi.style.height = topHeight + 'px';
            ul.appendChild(topLi);
        }

        const nodes = this.getTreeElements(this.data, topElements, topElements + maxDisplayCount);
        nodes.forEach(n => ul.appendChild(n));

        if (bottomHeight > 0) {
            const bottomLi = document.createElement('li');
            bottomLi.classList.add('tstree-node');
            bottomLi.innerText = 'bottom';
            bottomLi.style.height = bottomHeight + 'px';
            ul.appendChild(bottomLi);
        }

        this.hostUl.innerHTML = ul.innerHTML;
    }

    public onScroll(e: UIEvent) {
        // const eventTarget = <HTMLElement>e.target;
        // const scrollTop = eventTarget.scrollTop;

        // const notDisplayedElementsTop = scrollTop / this.nodeHeight;

        this.refresh(this.data);

        // e.preventDefault();
    }
}

// @Component({
//     // tslint:disable-next-line:component-selector
//     selector: 'tstree',
//     templateUrl: './tstree.component.html',
//     styleUrls: ['./tstree.component.scss'],
//     encapsulation: ViewEncapsulation.None
// })
// export class TsTreeComponent implements OnInit {

//     @Input() data: number[];
//     @Input() nodeHeight: number;

//     private host: HTMLElement;
//     private hostUl: HTMLUListElement;

//     constructor(private el: ElementRef) {
//         this.nodeHeight = 24;
//     }

//     ngOnInit() {
//         // this.host = <HTMLElement>this.el.nativeElement;
//         this.host = <HTMLDivElement>(document.getElementsByClassName('tstree-container')[0]);
//         this.hostUl = document.createElement('ul');
//         this.hostUl.classList.add('tstree-root');
//         this.host.appendChild(this.hostUl);
//         // this.loadData(this.data);
//         this.refresh(this.data);
//     }

//     private loadData(data: number[]) {
//         const listHeight = data.length * this.nodeHeight;
//         // clientHeight = height + padding
//         // offsetHeight = height + padding + border
//         const hostHeight = this.host.clientHeight;

//         const maxDisplayCount = (hostHeight / this.nodeHeight) + 1;  // + 1 cause of possible half item on top and bottom

//         const ul = document.createElement('ul');
//         ul.classList.add('tstree-root');
//         ul.style.height = listHeight + 'px';


//         for (let i = 0; i < maxDisplayCount; i++) {
//             const li = document.createElement('li');
//             li.classList.add('tstree-node');
//             li.innerText = data[i] + '';
//             ul.appendChild(li);
//         }

//         const bottomLi = document.createElement('li');
//         bottomLi.classList.add('tstree-node');
//         bottomLi.innerText = 'bottom';
//         bottomLi.style.height = listHeight - (maxDisplayCount * this.nodeHeight) + 'px';
//         ul.appendChild(bottomLi);

//         this.host.appendChild(ul);
//     }


//     private refresh(data: number[]) {
//         const listHeight = data.length * this.nodeHeight;
//         const hostHeight = this.host.clientHeight;
//         const maxDisplayCount = Math.ceil((hostHeight / this.nodeHeight) + 1);  // + 1 cause of possible half item on top and bottom

//         const scrollTop = this.host.scrollTop;

//         const topElements = Math.min(Math.floor(scrollTop / this.nodeHeight), data.length - maxDisplayCount);
//         const topHeight = topElements * this.nodeHeight;

//         const bottomElements = data.length - topElements - maxDisplayCount;
//         const bottomHeight = bottomElements * this.nodeHeight;

//         const ul = document.createElement('ul');
//         // ul.classList.add('tstree-root');
//         // ul.style.height = listHeight + 'px';

//         if (topHeight > 0) {
//             const topLi = document.createElement('li');
//             topLi.classList.add('tstree-node');
//             topLi.innerText = 'top';
//             topLi.style.height = topHeight + 'px';
//             ul.appendChild(topLi);
//         }

//         for (let i = topElements; i < maxDisplayCount + topElements; i++) {
//             const li = document.createElement('li');
//             li.classList.add('tstree-node');
//             li.innerText = data[i] + '';
//             ul.appendChild(li);
//         }

//         if (bottomHeight > 0) {
//             const bottomLi = document.createElement('li');
//             bottomLi.classList.add('tstree-node');
//             bottomLi.innerText = 'bottom';
//             bottomLi.style.height = bottomHeight + 'px';
//             ul.appendChild(bottomLi);
//         }

//         this.hostUl.innerHTML = ul.innerHTML;
//     }

//     public onScroll(e: UIEvent) {
//         const eventTarget = <HTMLElement>e.target;
//         const scrollTop = eventTarget.scrollTop;

//         const notDisplayedElementsTop = scrollTop / this.nodeHeight;
//         this.refresh(this.data);

//         e.preventDefault();
//     }
// }

interface TsTreeInternalData {
    level: number;
    index: number;
    parent: TsTreeNodeInternal;

    // TODO: instead of index
    currentChildCount?: number; // current displayed children (expanded/collapsed)
    totalChildCount?: number; // total number of children (expanded)
}

interface TsTreeNodeInternal extends TsTreeNode {
    _tstree: TsTreeInternalData;
    children: TsTreeNodeInternal[];
}

export interface TsTreeNode {
    text: string;
    children: TsTreeNode[];
}
