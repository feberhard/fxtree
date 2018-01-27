import {
    Component, OnInit, Input, ElementRef, ViewEncapsulation, HostListener, Output, EventEmitter
} from '@angular/core';

import { FxTreeNodeInternal, FxTreeNode, FxTreePreNodeContentEventData } from './model';
import { CascadeStrategy } from './enum';
import { FxTreeUtil } from './util';
import { FxTreeCollapseService } from './service/fxtree-collapse.service';
import { FxTreeDragDropService } from './service/fxtree-drag-drop.service';
import { FxTreeCheckboxService } from './service/fxtree-checkbox.service';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'fxtree',
    templateUrl: './fxtree.component.html',
    styleUrls: ['./fxtree.component.scss'],
    encapsulation: ViewEncapsulation.None,
    providers: [FxTreeCollapseService, FxTreeDragDropService, FxTreeCheckboxService]
})
export class FxTreeComponent implements OnInit {

    @Input() data: FxTreeNodeInternal[];
    @Input() nodeHeight = 24;
    @Input() enableCheckbox = true;
    @Input() cascadeStrategy = CascadeStrategy.UpAndDown;
    @Input() useIndeterminate = true;
    @Output() preNodeContentInsert = new EventEmitter<FxTreePreNodeContentEventData>(false);

    private host: HTMLElement;
    private hostUl: HTMLUListElement;
    private virtualRootNode: FxTreeNodeInternal;

    // https://stackoverflow.com/questions/28260889/set-large-value-to-divs-height
    // Different browser have different max values for the height property
    private readonly maxNodeheightBreakPoint = 1000000;

    constructor(
        private el: ElementRef,
        collapseService: FxTreeCollapseService,
        dropDownService: FxTreeDragDropService,
        checkboxService: FxTreeCheckboxService
    ) {
        collapseService.init(this);
        dropDownService.init(this);
        checkboxService.init(this);
    }

    public static setDragData(node: FxTreeNodeInternal) {
        FxTreeDragDropService.setDragData(node);
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

        this.preNodeContentInsert.emit({node, nodeContentDiv, nodeContentWrapperDiv});

        nodeContentWrapperDiv.appendChild(nodeContentDiv);
        li.appendChild(nodeContentWrapperDiv);

        return li;
    }

    private getTreeElements(data: FxTreeNodeInternal[], startIndex: number, count: number, currentIndex: number = -1): HTMLElement[] {
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

            if (currentNode._fxtree.currentChildCount > 0
                && currentIndex + currentNode._fxtree.currentChildCount >= startIndex
            ) {
                const subtreeUl = document.createElement('ul');
                subtreeUl.classList.add('fxtree-children');
                const subNodes = this.getTreeElements(currentNode.children, startIndex, count, currentIndex);
                subNodes.forEach(n => subtreeUl.appendChild(n));
                if (li) {
                    li.appendChild(subtreeUl);
                } else {
                    elements.push(subtreeUl);
                }
                count -= currentNode._fxtree.currentChildCount;
                if (startIndex > currentIndex) {
                    count += startIndex - currentIndex - 1;
                }
            }

            currentIndex += currentNode._fxtree.currentChildCount;
        }

        return elements;
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

        while (topHeight > 0) {
            const topLi = document.createElement('li');
            topLi.classList.add('fxtree-node');
            topLi.textContent = 'top';
            topLi.style.height = Math.min(topHeight, this.maxNodeheightBreakPoint) + 'px';
            this.hostUl.appendChild(topLi);
            topHeight -= this.maxNodeheightBreakPoint;
        }

        const contentNodes = this.getTreeElements(this.data, topElements, maxDisplayCount);
        contentNodes.forEach(n => this.hostUl.appendChild(n));

        while (bottomHeight > 0) {
            const bottomLi = document.createElement('li');
            bottomLi.classList.add('fxtree-node');
            bottomLi.textContent = 'bottom';
            bottomLi.style.height = Math.min(bottomHeight, this.maxNodeheightBreakPoint) + 'px';
            this.hostUl.appendChild(bottomLi);
            bottomHeight -= this.maxNodeheightBreakPoint;
        }
    }

    public onScroll(e: UIEvent) {
        this.refresh();
    }
}
