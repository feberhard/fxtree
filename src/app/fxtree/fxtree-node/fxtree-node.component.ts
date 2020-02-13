import {
    Component, OnInit, Input, ViewEncapsulation, HostBinding, TemplateRef
} from '@angular/core';

import { FxTreeNodeInternal } from '../model';
import { FxTreeComponent } from '../fxtree.component';
import { FxTreeUtil } from '../util';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'fxtree-node',
    templateUrl: './fxtree-node.component.html',
    styleUrls: ['./fxtree-node.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class FxTreeNodeComponent implements OnInit {

    @Input() public node: FxTreeNodeInternal;
    @Input() public nodeHeight = 24;
    @Input() public nodeContentTemplate: TemplateRef<any>;

    @HostBinding('class.fxtree-node') fxTreeNodeClass = true;
    @HostBinding('class.fxtree-node-expanded')
    public get fxTreeNodeExpandedClass() {
        return this.node.children && this.node.children.length > 0 && this.node._fxtree.expanded;
    }
    @HostBinding('class.fxtree-node-collapsed')
    public get fxTreeNodeCollapsedClass() {
        return this.node.children && this.node.children.length > 0 && !this.node._fxtree.expanded;
    }

    private lastDragoverY: number;
    public dropIndicatorClass: string;

    constructor(private fxTree: FxTreeComponent) {
    }

    ngOnInit(): void {
    }

    public toggleNode(node: FxTreeNodeInternal) {
        this.fxTree.treeControl.toggle(node);
        // node._fxtree.expanded = !node._fxtree.expanded;
        // const oldChildCount = node._fxtree.currentChildCount;
        // if (!node._fxtree.expanded) {
        //     node._fxtree.currentChildCount = 0;
        // } else {
        //     node._fxtree.currentChildCount = this.countExpandedChildren(node);
        // }
        // FxTreeUtil.updateParentsChildCount(node, node._fxtree.currentChildCount - oldChildCount);

        // this.fxTree.refresh(true);
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

    public dragStart(e: DragEvent) {
        FxTreeComponent.setDragData(this.node);
    }

    public dragOver(e: DragEvent) {
        const node = this.node;
        // Don't allow drag to own node or parent to child node
        if (node !== FxTreeComponent.dragData && !FxTreeUtil.isParentOf(FxTreeComponent.dragData, node)) {
            // default: drop not allowed, preventDefault: drop allowed
            e.preventDefault();

            if (e.clientY !== this.lastDragoverY) {
                this.lastDragoverY = e.clientY;

                if (e.offsetY < this.fxTree.nodeHeight / 3) { // before
                    this.dropIndicatorClass = 'fxtree-before-indicator';
                } else if (e.offsetY > 2 * this.fxTree.nodeHeight / 3) { // after
                    this.dropIndicatorClass = 'fxtree-after-indicator';
                } else { // inside
                    this.dropIndicatorClass = 'fxtree-inside-indicator';
                }
            }
        }
    }

    public dragLeave(e: DragEvent) {
        this.lastDragoverY = null;
        this.dropIndicatorClass = null;
    }

    public drop(e: DragEvent) {
        const node = this.node;
        const draggedNode = FxTreeComponent.dragData;
        const oldParent = draggedNode._fxtree.parent;

        let newParent: FxTreeNodeInternal;
        let position: number;

        if (e.offsetY < this.fxTree.nodeHeight / 3) { // before
            position = node._fxtree.parent.children.indexOf(node);
            newParent = node._fxtree.parent;
        } else if (e.offsetY > 2 * this.fxTree.nodeHeight / 3) { // after
            position = node._fxtree.parent.children.indexOf(node) + 1;
            newParent = node._fxtree.parent;
        } else { // inside
            newParent = node;
            position = 0;
        }

        this.fxTree.beforeNodeMoved.emit({ node: draggedNode, oldParent: oldParent, newParent: newParent });

        if (draggedNode._fxtree.parent) {
            FxTreeUtil.updateParentsChildCount(draggedNode, -(draggedNode._fxtree.currentChildCount + 1));
            const childIndex = draggedNode._fxtree.parent.children.indexOf(draggedNode);
            draggedNode._fxtree.parent.children.splice(childIndex, 1);
        }

        newParent.children = newParent.children || [];
        newParent.children.splice(position, 0, draggedNode);
        draggedNode._fxtree.parent = newParent;
        FxTreeUtil.updateParentsChildCount(draggedNode, draggedNode._fxtree.currentChildCount + 1);

        FxTreeUtil.updateLevel(draggedNode);

        this.fxTree.afterNodeMoved.emit({ node: draggedNode, oldParent: oldParent, newParent: newParent });

        this.dropIndicatorClass = '';
        this.fxTree.refresh(true);
    }
}
