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
        // this.hostUl.style.height = this.nodeCount * this.nodeHeight + 'px';

        console.log(this.nodeCount);
        console.log(this.data);

        this.getTreeElements(this.data, 3, 5);

        this.refresh(this.data);
    }

    private indexData(data: TsTreeNode[], level: number = 0, index: number = 0, parent: TsTreeNodeInternal = null): number {
        for (let i = 0; i < data.length; i++) {
            const internalNode = <TsTreeNodeInternal>data[i];
            internalNode._tstree = { level: level, index: index, parent: parent, expanded: true };
            index++;
            if (internalNode.children && internalNode.children.length > 0) {
                index = this.indexData(internalNode.children, level + 1, index, internalNode);
            }
            internalNode._tstree.currentChildCount = internalNode._tstree.totalChildCount = index - internalNode._tstree.index - 1;
        }
        return index;
    }

    private updateParentsChildCount(node: TsTreeNodeInternal, childCountChange: number) {
        this.nodeCount += childCountChange;
        let parent: TsTreeNodeInternal = node;
        while (parent = parent._tstree.parent) {
            parent._tstree.currentChildCount += childCountChange;
        }
    }

    private toggleNode(node: TsTreeNodeInternal) {
        node._tstree.expanded = !node._tstree.expanded;
        const oldChildCount = node._tstree.currentChildCount;
        if (!node._tstree.expanded) {
            node._tstree.currentChildCount = 0;
        } else {
            node._tstree.currentChildCount = this.countExpandedChildren(node);
        }
        this.updateParentsChildCount(node, node._tstree.currentChildCount - oldChildCount);
    }

    private countExpandedChildren(node: TsTreeNodeInternal): number {
        let count = 0;
        if (node.children) {
            for (let i = 0; i < node.children.length; i++) {
                count++;
                if (node.children[i]._tstree.expanded) {
                    count += this.countExpandedChildren(node.children[i]);
                }
            }
        }
        return count;
    }

    private getNodeElement(node: TsTreeNodeInternal) {
        const li = document.createElement('li');
        li.classList.add('tstree-node');
        if (node.children && node.children.length > 0) {
            if (node._tstree.expanded) {
                li.classList.add('tstree-node-expanded');
            } else {
                li.classList.add('tstree-node-collapsed');
            }
        }

        const nodeContentWrapperDiv = document.createElement('div');
        nodeContentWrapperDiv.classList.add('tstree-node-content-wrapper');

        const childrenExpanderWrapperSpan = document.createElement('span');
        childrenExpanderWrapperSpan.classList.add('tstree-children-expander-wrapper');
        childrenExpanderWrapperSpan.onclick = () => { this.toggleNode(node); this.refresh(this.data); };

        const childrenExpanderSpan = document.createElement('span');
        childrenExpanderSpan.classList.add('tstree-children-expander');
        childrenExpanderWrapperSpan.appendChild(childrenExpanderSpan);

        nodeContentWrapperDiv.appendChild(childrenExpanderWrapperSpan);


        const nodeContentDiv = document.createElement('div');
        nodeContentDiv.classList.add('tstree-node-content');
        nodeContentDiv.textContent = node.text + ' - ' + node._tstree.index;
        nodeContentDiv.title = nodeContentDiv.textContent;
        nodeContentWrapperDiv.appendChild(nodeContentDiv);

        li.appendChild(nodeContentWrapperDiv);

        return li;
    }

    private getTreeElements(data: TsTreeNodeInternal[], startIndex: number, count: number, currentIndex: number = -1): HTMLElement[] {
        const elements: HTMLElement[] = [];

        for (let i = 0; i < data.length; i++) {
            currentIndex++;
            const currentNode = data[i];

            if (count <= 0) {
                return elements;
            }

            let li: HTMLLIElement;
            if (currentIndex >= startIndex) {
                li = this.getNodeElement(currentNode);

                elements.push(li);
                count--;
            }

            if (currentNode._tstree.currentChildCount > 0
                && currentIndex + currentNode._tstree.currentChildCount >= startIndex
            ) {
                const subtreeUl = document.createElement('ul');
                subtreeUl.classList.add('tstree-children');
                const subNodes = this.getTreeElements(currentNode.children, startIndex, count, currentIndex);
                subNodes.forEach(n => subtreeUl.appendChild(n));
                if (li) {
                    li.appendChild(subtreeUl);
                } else {
                    elements.push(subtreeUl);
                }
                count -= currentNode._tstree.currentChildCount;
                if (startIndex > currentIndex) {
                    count += startIndex - currentIndex - 1;
                }
            }

            currentIndex += currentNode._tstree.currentChildCount;
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

        this.hostUl.innerHTML = '';

        if (topHeight > 0) {
            const topLi = document.createElement('li');
            topLi.classList.add('tstree-node');
            topLi.innerText = 'top';
            topLi.style.height = topHeight + 'px';
            this.hostUl.appendChild(topLi);
        }

        const contentNodes = this.getTreeElements(this.data, topElements, maxDisplayCount);
        contentNodes.forEach(n => this.hostUl.appendChild(n));

        if (bottomHeight > 0) {
            const bottomLi = document.createElement('li');
            bottomLi.classList.add('tstree-node');
            bottomLi.innerText = 'bottom';
            bottomLi.style.height = bottomHeight + 'px';
            this.hostUl.appendChild(bottomLi);
        }
    }

    public onScroll(e: UIEvent) {
        this.refresh(this.data);
    }
}

interface TsTreeInternalData {
    expanded: boolean;
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
