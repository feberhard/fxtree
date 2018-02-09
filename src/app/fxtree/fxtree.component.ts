import {
    Component, OnInit, Input, ElementRef, ViewEncapsulation, HostListener, Output, EventEmitter
} from '@angular/core';

import { FxTreeNodeInternal, FxTreeNode, FxTreePreNodeContentEventData, FxTreeNodeMovedEventData } from './model';
import { CascadeStrategy } from './enum';
import { FxTreeUtil } from './util';

export interface HeightNode {
    height: number;
}

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'fxtree',
    templateUrl: './fxtree.component.html',
    styleUrls: ['./fxtree.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class FxTreeComponent implements OnInit {

    @Input() public data: FxTreeNodeInternal[];
    @Input() public nodeHeight = 24;
    @Input() public enableCheckbox = true;
    @Input() public cascadeStrategy = CascadeStrategy.UpAndDown;
    @Input() public useIndeterminate = true;
    @Output() public beforeNodeContentInsert = new EventEmitter<FxTreePreNodeContentEventData>(false);
    @Output() public beforeNodeMoved = new EventEmitter<FxTreeNodeMovedEventData>(false);
    @Output() public afterNodeMoved = new EventEmitter<FxTreeNodeMovedEventData>(false);

    public topNodes: HeightNode[];
    public contentNodes: FxTreeNodeInternal[];
    public bottomNodes: HeightNode[];

    private host: HTMLElement;
    private hostUl: HTMLUListElement;
    private virtualRootNode: FxTreeNodeInternal;
    private isRefreshQueued = false;

    // https://stackoverflow.com/questions/28260889/set-large-value-to-divs-height
    // Different browser have different max values for the height property
    private readonly maxNodeheightBreakPoint = 1000000;

    constructor(private el: ElementRef) {
    }

    ngOnInit() {
        this.host = <HTMLDivElement>(document.getElementsByClassName('fxtree-container')[0]);
        this.hostUl = document.createElement('ul');
        this.hostUl.classList.add('fxtree-root');
        this.host.appendChild(this.hostUl);

        this.virtualRootNode = <FxTreeNodeInternal>{};
        this.virtualRootNode.children = this.data;
        this.indexData([this.virtualRootNode], null, -1, -1);

        console.log(this.virtualRootNode._fxtree.currentChildCount);
        // console.log(this.data);

        this.getTreeElements(this.data, 3, 5);

        this.refresh();
    }

    private indexData(data: FxTreeNode[], parent: FxTreeNodeInternal = null, level: number = 0, index: number = 0): number {
        for (let i = 0; i < data.length; i++) {
            const internalNode = <FxTreeNodeInternal>data[i];
            internalNode._fxtree = { level: level, index: index, parent: parent, expanded: true };
            index++;
            if (internalNode.children && internalNode.children.length > 0) {
                index = this.indexData(internalNode.children, internalNode, level + 1, index);
            }
            internalNode._fxtree.currentChildCount = internalNode._fxtree.totalChildCount = index - internalNode._fxtree.index - 1;
        }
        return index;
    }

    public toggleNode(node: FxTreeNodeInternal) {
        if (node._fxtree.totalChildCount === 0) {
            return;
        }

        node._fxtree.expanded = !node._fxtree.expanded;
        const oldChildCount = node._fxtree.currentChildCount;
        if (!node._fxtree.expanded) {
            node._fxtree.currentChildCount = 0;
        } else {
            node._fxtree.currentChildCount = this.countExpandedChildren(node);
        }
        FxTreeUtil.updateParentsChildCount(node, node._fxtree.currentChildCount - oldChildCount);

        this.refresh();
    }

    public countExpandedChildren(node: FxTreeNodeInternal): number {
        let count = 0;
        if (node.children) {
            for (let i = 0; i < node.children.length; i++) {
                count++;
                if (node.children[i]._fxtree.expanded) {
                    count += this.countExpandedChildren(node.children[i]);
                }
            }
        }
        return count;
    }

    private getNodeElement(node: FxTreeNodeInternal) {
        const li = document.createElement('li');
        li.classList.add('fxtree-node');
        if (node.children && node.children.length > 0) {
            if (node._fxtree.expanded) {
                li.classList.add('fxtree-node-expanded');
            } else {
                li.classList.add('fxtree-node-collapsed');
            }
        }

        const nodeContentWrapperDiv = document.createElement('div');
        nodeContentWrapperDiv.classList.add('fxtree-node-content-wrapper');
        nodeContentWrapperDiv.style.height = this.nodeHeight + 'px';
        nodeContentWrapperDiv.style.lineHeight = this.nodeHeight + 'px';

        const nodeContentDiv = document.createElement('div');
        nodeContentDiv.classList.add('fxtree-node-content');
        nodeContentDiv.textContent = node.text + ' - ' + node._fxtree.index;
        nodeContentDiv.title = nodeContentDiv.textContent;

        this.beforeNodeContentInsert.emit({ node, nodeContentDiv, nodeContentWrapperDiv });

        nodeContentWrapperDiv.appendChild(nodeContentDiv);
        li.appendChild(nodeContentWrapperDiv);

        return li;
    }

    private getTreeElements(
        data: FxTreeNodeInternal[],
        startIndex: number,
        count: number,
        currentIndex: number = -1
    ): FxTreeNodeInternal[] {
        const elements: FxTreeNodeInternal[] = [];

        for (let i = 0; i < data.length; i++) {
            currentIndex++;
            const currentNode = data[i];

            if (count <= 0) {
                return elements;
            }

            if (currentIndex >= startIndex) {
                elements.push(currentNode);
                count--;
            }

            if (currentNode._fxtree.currentChildCount > 0
                && currentIndex + currentNode._fxtree.currentChildCount >= startIndex
            ) {
                const subNodes = this.getTreeElements(currentNode.children, startIndex, count, currentIndex);
                elements.push(...subNodes);

                count -= currentNode._fxtree.currentChildCount;
                if (startIndex > currentIndex) {
                    count += startIndex - currentIndex - 1;
                }
            }

            currentIndex += currentNode._fxtree.currentChildCount;
        }

        return elements;
    }

    public queueRefresh() {
        if (this.isRefreshQueued) {
            return;
        }
        this.isRefreshQueued = true;
        requestAnimationFrame(() => {
            this.refresh();
            this.isRefreshQueued = false;
        });
    }

    public refresh() {
        const hostHeight = this.host.clientHeight;
        const maxDisplayCount = Math.ceil((hostHeight / this.nodeHeight) + 1);  // + 1 cause of possible half item on top and bottom

        const scrollTop = this.host.scrollTop;

        const topElements = Math.min(
            Math.floor(scrollTop / this.nodeHeight),
            this.virtualRootNode._fxtree.currentChildCount - maxDisplayCount);
        let topHeight = topElements * this.nodeHeight;

        const bottomElements = this.virtualRootNode._fxtree.currentChildCount - topElements - maxDisplayCount;
        let bottomHeight = bottomElements * this.nodeHeight;

        this.hostUl.innerHTML = '';

        this.topNodes = [];
        while (topHeight > 0) {
            this.topNodes.push({ height: Math.min(topHeight, this.maxNodeheightBreakPoint) });
            topHeight -= this.maxNodeheightBreakPoint;
        }

        this.contentNodes = this.getTreeElements(this.data, topElements, maxDisplayCount);

        this.bottomNodes = [];
        while (bottomHeight > 0) {
            this.bottomNodes.push({ height: Math.min(bottomHeight, this.maxNodeheightBreakPoint) });
            bottomHeight -= this.maxNodeheightBreakPoint;
        }
    }

    public onScroll(e: UIEvent) {
        this.refresh();
    }

    public forAll(action: (node: FxTreeNodeInternal) => void) {
        this.data.forEach(node => FxTreeUtil.forAll(node, action));
    }
}
