import { Component, OnInit, Input, ElementRef, ViewEncapsulation, HostListener } from '@angular/core';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'tstree',
    templateUrl: './tstree.component.html',
    styleUrls: ['./tstree.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TsTreeComponent implements OnInit {
    private static dragData: TsTreeNodeInternal;

    @Input() data: TsTreeNodeInternal[];
    @Input() nodeHeight: number;

    private host: HTMLElement;
    private hostUl: HTMLUListElement;
    private virtualRootNode: TsTreeNodeInternal;

    // https://stackoverflow.com/questions/28260889/set-large-value-to-divs-height
    // Different browser have different max values for the height property
    private readonly maxNodeheightBreakPoint = 1000000;

    private lastDragoverY: number;

    constructor(private el: ElementRef) {
        this.nodeHeight = 24;
    }

    public static setDragData(node: TsTreeNodeInternal) {
        this.dragData = node;
    }

    ngOnInit() {
        this.host = <HTMLDivElement>(document.getElementsByClassName('tstree-container')[0]);
        this.hostUl = document.createElement('ul');
        this.hostUl.classList.add('tstree-root');
        this.host.appendChild(this.hostUl);

        this.virtualRootNode = <TsTreeNodeInternal>{};
        this.virtualRootNode.children = this.data;
        this.indexData([this.virtualRootNode], null, -1, -1);

        console.log(this.virtualRootNode._tstree.currentChildCount);
        // console.log(this.data);

        this.getTreeElements(this.data, 3, 5);

        this.refresh(this.data);
    }

    private indexData(data: TsTreeNode[], parent: TsTreeNodeInternal = null, level: number = 0, index: number = 0): number {
        for (let i = 0; i < data.length; i++) {
            const internalNode = <TsTreeNodeInternal>data[i];
            internalNode._tstree = { level: level, index: index, parent: parent, expanded: true };
            index++;
            if (internalNode.children && internalNode.children.length > 0) {
                index = this.indexData(internalNode.children, internalNode, level + 1, index);
            }
            internalNode._tstree.currentChildCount = internalNode._tstree.totalChildCount = index - internalNode._tstree.index - 1;
        }
        return index;
    }

    private updateParentsChildCount(node: TsTreeNodeInternal, childCountChange: number) {
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

    private isParentOf(possibleParent: TsTreeNodeInternal, possibleChild: TsTreeNodeInternal) {
        let parent: TsTreeNodeInternal = possibleChild;
        while (parent = parent._tstree.parent) {
            if (parent === possibleParent) {
                return true;
            }
        }
        return false;
    }

    private initDragAndDrop(node: TsTreeNodeInternal, nodeContentDiv: HTMLDivElement, nodeContentWrapperDiv: HTMLDivElement) {
        nodeContentDiv.draggable = true;
        nodeContentDiv.ondragstart = (e) => { TsTreeComponent.setDragData(node); };
        nodeContentDiv.ondragover = (e) => {
            // Don't allow drag to own node or parent to child node
            if (node !== TsTreeComponent.dragData && !this.isParentOf(TsTreeComponent.dragData, node)) {
                // default: drop not allowed, preventDefault: drop allowed
                e.preventDefault();

                if (e.clientY !== this.lastDragoverY) {
                    this.lastDragoverY = e.clientY;
                    nodeContentWrapperDiv.classList.remove('tstree-before-indicator');
                    nodeContentWrapperDiv.classList.remove('tstree-inside-indicator');
                    nodeContentWrapperDiv.classList.remove('tstree-after-indicator');

                    if (e.offsetY < this.nodeHeight / 3) { // before
                        nodeContentWrapperDiv.classList.add('tstree-before-indicator');
                    } else if (e.offsetY > 2 * this.nodeHeight / 3) { // after
                        nodeContentWrapperDiv.classList.add('tstree-after-indicator');
                    } else { // inside
                        nodeContentWrapperDiv.classList.add('tstree-inside-indicator');
                    }
                }
            }
        };
        nodeContentDiv.ondrop = (e) => {
            e.preventDefault();
            const draggedNode = TsTreeComponent.dragData;

            let parentNode: TsTreeNodeInternal;
            let position: number;

            if (e.offsetY < this.nodeHeight / 3) { // before
                position = node._tstree.parent.children.indexOf(node);
                parentNode = node._tstree.parent;
            } else if (e.offsetY > 2 * this.nodeHeight / 3) { // after
                position = node._tstree.parent.children.indexOf(node) + 1;
                parentNode = node._tstree.parent;
            } else { // inside
                parentNode = node;
                position = 0;
            }

            if (draggedNode._tstree.parent) {
                this.updateParentsChildCount(draggedNode, -(draggedNode._tstree.currentChildCount + 1));
                const childIndex = draggedNode._tstree.parent.children.indexOf(draggedNode);
                draggedNode._tstree.parent.children.splice(childIndex, 1);
            }

            parentNode.children = parentNode.children || [];
            parentNode.children.splice(position, 0, draggedNode);
            draggedNode._tstree.parent = parentNode;
            this.updateParentsChildCount(draggedNode, draggedNode._tstree.currentChildCount + 1);

            this.refresh(this.data);
        };
        // nodeContentDiv.addEventListener('dragover', (e) => {
        //     nodeContentDiv.classList.add('tstree-inside-indicator');
        // }, false);
        nodeContentDiv.addEventListener('dragleave', (e) => {
            // TODO: indicator blinks when leaving and entering the next node (delay removal of indicator)
            this.lastDragoverY = null;
            nodeContentWrapperDiv.classList.remove('tstree-before-indicator');
            nodeContentWrapperDiv.classList.remove('tstree-inside-indicator');
            nodeContentWrapperDiv.classList.remove('tstree-after-indicator');
        }, false);
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

        this.initDragAndDrop(node, nodeContentDiv, nodeContentWrapperDiv);
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
        const hostHeight = this.host.clientHeight;
        const maxDisplayCount = Math.ceil((hostHeight / this.nodeHeight) + 1);  // + 1 cause of possible half item on top and bottom

        const scrollTop = this.host.scrollTop;

        const topElements = Math.min(
            Math.floor(scrollTop / this.nodeHeight),
            this.virtualRootNode._tstree.currentChildCount - maxDisplayCount);
        let topHeight = topElements * this.nodeHeight;

        const bottomElements = this.virtualRootNode._tstree.currentChildCount - topElements - maxDisplayCount;
        let bottomHeight = bottomElements * this.nodeHeight;

        this.hostUl.innerHTML = '';

        while (topHeight > 0) {
            const topLi = document.createElement('li');
            topLi.classList.add('tstree-node');
            topLi.textContent = 'top';
            topLi.style.height = Math.min(topHeight, this.maxNodeheightBreakPoint) + 'px';
            this.hostUl.appendChild(topLi);
            topHeight -= this.maxNodeheightBreakPoint;
        }

        const contentNodes = this.getTreeElements(this.data, topElements, maxDisplayCount);
        contentNodes.forEach(n => this.hostUl.appendChild(n));

        while (bottomHeight > 0) {
            const bottomLi = document.createElement('li');
            bottomLi.classList.add('tstree-node');
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

interface TsTreeInternalData {
    expanded: boolean;
    level: number;
    index: number;
    parent: TsTreeNodeInternal;

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
