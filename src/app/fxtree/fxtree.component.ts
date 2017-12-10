import { Component, OnInit, Input, ElementRef, ViewEncapsulation, HostListener } from '@angular/core';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'fxtree',
    templateUrl: './fxtree.component.html',
    styleUrls: ['./fxtree.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class FxTreeComponent implements OnInit {
    private static dragData: FxTreeNodeInternal;

    @Input() data: FxTreeNodeInternal[];
    @Input() nodeHeight = 24;

    private host: HTMLElement;
    private hostUl: HTMLUListElement;
    private virtualRootNode: FxTreeNodeInternal;

    // https://stackoverflow.com/questions/28260889/set-large-value-to-divs-height
    // Different browser have different max values for the height property
    private readonly maxNodeheightBreakPoint = 1000000;

    private lastDragoverY: number;

    constructor(private el: ElementRef) {
    }

    public static setDragData(node: FxTreeNodeInternal) {
        this.dragData = node;
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

        this.refresh(this.data);
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

    private updateParentsChildCount(node: FxTreeNodeInternal, childCountChange: number) {
        let parent: FxTreeNodeInternal = node;
        while (parent = parent._fxtree.parent) {
            parent._fxtree.currentChildCount += childCountChange;
        }
    }

    private toggleNode(node: FxTreeNodeInternal) {
        node._fxtree.expanded = !node._fxtree.expanded;
        const oldChildCount = node._fxtree.currentChildCount;
        if (!node._fxtree.expanded) {
            node._fxtree.currentChildCount = 0;
        } else {
            node._fxtree.currentChildCount = this.countExpandedChildren(node);
        }
        this.updateParentsChildCount(node, node._fxtree.currentChildCount - oldChildCount);
    }

    private countExpandedChildren(node: FxTreeNodeInternal): number {
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

    private isParentOf(possibleParent: FxTreeNodeInternal, possibleChild: FxTreeNodeInternal) {
        let parent: FxTreeNodeInternal = possibleChild;
        while (parent = parent._fxtree.parent) {
            if (parent === possibleParent) {
                return true;
            }
        }
        return false;
    }

    private initDragAndDrop(node: FxTreeNodeInternal, nodeContentDiv: HTMLDivElement, nodeContentWrapperDiv: HTMLDivElement) {
        nodeContentDiv.draggable = true;
        nodeContentDiv.ondragstart = (e) => { FxTreeComponent.setDragData(node); };
        nodeContentDiv.ondragover = (e) => {
            // Don't allow drag to own node or parent to child node
            if (node !== FxTreeComponent.dragData && !this.isParentOf(FxTreeComponent.dragData, node)) {
                // default: drop not allowed, preventDefault: drop allowed
                e.preventDefault();

                if (e.clientY !== this.lastDragoverY) {
                    this.lastDragoverY = e.clientY;
                    nodeContentWrapperDiv.classList.remove('fxtree-before-indicator');
                    nodeContentWrapperDiv.classList.remove('fxtree-inside-indicator');
                    nodeContentWrapperDiv.classList.remove('fxtree-after-indicator');

                    if (e.offsetY < this.nodeHeight / 3) { // before
                        nodeContentWrapperDiv.classList.add('fxtree-before-indicator');
                    } else if (e.offsetY > 2 * this.nodeHeight / 3) { // after
                        nodeContentWrapperDiv.classList.add('fxtree-after-indicator');
                    } else { // inside
                        nodeContentWrapperDiv.classList.add('fxtree-inside-indicator');
                    }
                }
            }
        };
        nodeContentDiv.ondrop = (e) => {
            e.preventDefault();
            const draggedNode = FxTreeComponent.dragData;

            let parentNode: FxTreeNodeInternal;
            let position: number;

            if (e.offsetY < this.nodeHeight / 3) { // before
                position = node._fxtree.parent.children.indexOf(node);
                parentNode = node._fxtree.parent;
            } else if (e.offsetY > 2 * this.nodeHeight / 3) { // after
                position = node._fxtree.parent.children.indexOf(node) + 1;
                parentNode = node._fxtree.parent;
            } else { // inside
                parentNode = node;
                position = 0;
            }

            if (draggedNode._fxtree.parent) {
                this.updateParentsChildCount(draggedNode, -(draggedNode._fxtree.currentChildCount + 1));
                const childIndex = draggedNode._fxtree.parent.children.indexOf(draggedNode);
                draggedNode._fxtree.parent.children.splice(childIndex, 1);
            }

            parentNode.children = parentNode.children || [];
            parentNode.children.splice(position, 0, draggedNode);
            draggedNode._fxtree.parent = parentNode;
            this.updateParentsChildCount(draggedNode, draggedNode._fxtree.currentChildCount + 1);

            this.refresh(this.data);
        };
        // nodeContentDiv.addEventListener('dragover', (e) => {
        //     nodeContentDiv.classList.add('fxtree-inside-indicator');
        // }, false);
        nodeContentDiv.addEventListener('dragleave', (e) => {
            // TODO: indicator blinks when leaving and entering the next node (delay removal of indicator)
            this.lastDragoverY = null;
            nodeContentWrapperDiv.classList.remove('fxtree-before-indicator');
            nodeContentWrapperDiv.classList.remove('fxtree-inside-indicator');
            nodeContentWrapperDiv.classList.remove('fxtree-after-indicator');
        }, false);
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

        const childrenExpanderWrapperSpan = document.createElement('span');
        childrenExpanderWrapperSpan.classList.add('fxtree-children-expander-wrapper');
        childrenExpanderWrapperSpan.onclick = () => { this.toggleNode(node); this.refresh(this.data); };

        const childrenExpanderSpan = document.createElement('span');
        childrenExpanderSpan.classList.add('fxtree-children-expander');
        childrenExpanderWrapperSpan.appendChild(childrenExpanderSpan);
        nodeContentWrapperDiv.appendChild(childrenExpanderWrapperSpan);

        const nodeContentDiv = document.createElement('div');
        nodeContentDiv.classList.add('fxtree-node-content');
        nodeContentDiv.textContent = node.text + ' - ' + node._fxtree.index;
        nodeContentDiv.title = nodeContentDiv.textContent;

        this.initDragAndDrop(node, nodeContentDiv, nodeContentWrapperDiv);
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

    private refresh(data: FxTreeNode[]) {
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
        this.refresh(this.data);
    }
}

interface FxTreeInternalData {
    expanded: boolean;
    level: number;
    index: number;
    parent: FxTreeNodeInternal;

    currentChildCount?: number; // current displayed children (expanded/collapsed)
    totalChildCount?: number; // total number of children (expanded)
}

interface FxTreeNodeInternal extends FxTreeNode {
    _fxtree: FxTreeInternalData;
    children: FxTreeNodeInternal[];
}

export interface FxTreeNode {
    text: string;
    children: FxTreeNode[];
}
