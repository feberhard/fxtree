import {
    Component, OnInit, Input, ViewEncapsulation, Output, EventEmitter, ContentChild, TemplateRef
} from '@angular/core';

import { FxTreeNodeInternal, FxTreeNode, FxTreePreNodeContentEventData, FxTreeNodeMovedEventData } from './model';
import { CascadeStrategy } from './enum';
import { FxTreeUtil } from './util';

export interface HeightNode {
    height: number;
}

export interface ContentNode {
    node?: FxTreeNodeInternal;
    children?: ContentNode[];
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

    @ContentChild('fxtreeNodeContentTemplate')
    public nodeContentTemplate: TemplateRef<any>;

    public topNodes: HeightNode[] = [];
    public contentNodes: ContentNode[] = [];
    public bottomNodes: HeightNode[] = [];

    private host: HTMLElement;
    private hostUl: HTMLUListElement;
    private virtualRootNode: FxTreeNodeInternal;
    private isRefreshQueued = false;

    // https://stackoverflow.com/questions/28260889/set-large-value-to-divs-height
    // Different browser have different max values for the height property
    private readonly maxNodeheightBreakPoint = 1000000;
    private renderBlockSize = 50;
    private lastStartIndex = 0;
    private lastRenderedStartIndex = Number.MAX_SAFE_INTEGER;
    private renderThreshold = 5;

    constructor() {
    }

    ngOnInit() {
        this.host = <HTMLDivElement>(document.getElementsByClassName('fxtree-container')[0]);
        this.hostUl = <HTMLUListElement>(document.getElementsByClassName('fxtree-root')[0]);

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

    private getTreeElements(data: FxTreeNodeInternal[], startIndex: number, count: number, currentIndex: number = -1): ContentNode[] {
        const elements: ContentNode[] = [];

        for (let i = 0; i < data.length; i++) {
            currentIndex++;
            const currentNode = data[i];

            if (count <= 0) {
                return elements;
            }

            let contentNode: ContentNode;
            if (currentIndex >= startIndex) {
                contentNode = { node: currentNode, children: [] };

                elements.push(contentNode);
                count--;
            }

            if (currentNode._fxtree.currentChildCount > 0
                && currentIndex + currentNode._fxtree.currentChildCount >= startIndex
            ) {
                const subNodes = this.getTreeElements(currentNode.children, startIndex, count, currentIndex);
                if (contentNode) {
                    contentNode.children = subNodes;
                } else {
                    elements.push({ children: subNodes });
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

    public refresh(force: boolean = false) {
        const hostHeight = this.host.clientHeight;
        const maxDisplayCount = Math.ceil((hostHeight / this.nodeHeight) + 1);  // + 1 cause of possible half item on top and bottom
        const renderBlockSize = Math.max(this.renderBlockSize, maxDisplayCount);

        const scrollTop = this.host.scrollTop;

        const topInvisibleElementsCount = Math.min(
            Math.floor(scrollTop / this.nodeHeight),
            this.virtualRootNode._fxtree.currentChildCount - maxDisplayCount);
        let topHeight = topInvisibleElementsCount * this.nodeHeight;

        let scrollDirectionDown = true;
        if (topInvisibleElementsCount < this.lastStartIndex) {
            scrollDirectionDown = false;
        }

        this.lastStartIndex = topInvisibleElementsCount;

        if (!force
            && topInvisibleElementsCount > (this.lastRenderedStartIndex + this.renderThreshold)
            && (topInvisibleElementsCount + maxDisplayCount) < (this.lastRenderedStartIndex + renderBlockSize - this.renderThreshold)
        ) {
            // Current visible area is already rendered
            return;
        }

        let bottomElementsCount: number;
        if (scrollDirectionDown) {
            bottomElementsCount = this.virtualRootNode._fxtree.currentChildCount - topInvisibleElementsCount - renderBlockSize;
            this.lastRenderedStartIndex = topInvisibleElementsCount;
        } else {
            bottomElementsCount = this.virtualRootNode._fxtree.currentChildCount - topInvisibleElementsCount - maxDisplayCount;
            const topRenderCount = this.virtualRootNode._fxtree.currentChildCount - bottomElementsCount - renderBlockSize;
            topHeight = topRenderCount * this.nodeHeight;
            this.lastRenderedStartIndex = topRenderCount;
        }

        let bottomHeight = bottomElementsCount * this.nodeHeight;

        this.topNodes = [];
        while (topHeight > 0) {
            this.topNodes.push({ height: Math.min(topHeight, this.maxNodeheightBreakPoint) });
            topHeight -= this.maxNodeheightBreakPoint;
        }

        this.contentNodes = this.getTreeElements(this.data, topInvisibleElementsCount, renderBlockSize);

        this.bottomNodes = [];
        while (bottomHeight > 0) {
            this.bottomNodes.push({ height: Math.min(bottomHeight, this.maxNodeheightBreakPoint) });
            bottomHeight -= this.maxNodeheightBreakPoint;
        }

        console.log('refresh');
    }

    public onScroll(e: UIEvent) {
        this.refresh();
    }

    public forAll(action: (node: FxTreeNodeInternal) => void) {
        this.data.forEach(node => FxTreeUtil.forAll(node, action));
    }
}
