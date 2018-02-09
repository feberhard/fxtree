import { Host, Directive } from '@angular/core';

import { FxTreeComponent } from '../fxtree.component';
import { FxTreeNodeInternal, FxTreePreNodeContentEventData } from '../model';
import { FxTreeUtil } from '../util';

@Directive({
    selector: '[fxTreeDragDrop]',
})
export class FxTreeDragDropDirective {
    public static dragData: FxTreeNodeInternal;

    private lastDragoverY: number;

    constructor( @Host() private fxTree: FxTreeComponent) {
        console.log(fxTree);
        this.fxTree.beforeNodeContentInsert.subscribe(
            (data: FxTreePreNodeContentEventData) => this.initDragAndDrop(data.node, data.nodeContentDiv, data.nodeContentWrapperDiv));
    }

    public static setDragData(node: FxTreeNodeInternal) {
        FxTreeDragDropDirective.dragData = node;
    }

    public initDragAndDrop(node: FxTreeNodeInternal, nodeContentDiv: HTMLDivElement, nodeContentWrapperDiv: HTMLDivElement) {
        nodeContentDiv.draggable = true;
        nodeContentDiv.ondragstart = (e) => { FxTreeDragDropDirective.setDragData(node); };
        nodeContentDiv.ondragover = (e) => {
            // Don't allow drag to own node or parent to child node
            if (node !== FxTreeDragDropDirective.dragData && !FxTreeUtil.isParentOf(FxTreeDragDropDirective.dragData, node)) {
                // default: drop not allowed, preventDefault: drop allowed
                e.preventDefault();

                if (e.clientY !== this.lastDragoverY) {
                    this.lastDragoverY = e.clientY;
                    nodeContentWrapperDiv.classList.remove('fxtree-before-indicator');
                    nodeContentWrapperDiv.classList.remove('fxtree-inside-indicator');
                    nodeContentWrapperDiv.classList.remove('fxtree-after-indicator');

                    if (e.offsetY < this.fxTree.nodeHeight / 3) { // before
                        nodeContentWrapperDiv.classList.add('fxtree-before-indicator');
                    } else if (e.offsetY > 2 * this.fxTree.nodeHeight / 3) { // after
                        nodeContentWrapperDiv.classList.add('fxtree-after-indicator');
                    } else { // inside
                        nodeContentWrapperDiv.classList.add('fxtree-inside-indicator');
                    }
                }
            }
        };
        nodeContentDiv.ondrop = (e) => {
            e.preventDefault();
            const draggedNode = FxTreeDragDropDirective.dragData;
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

            this.fxTree.afterNodeMoved.emit({ node: draggedNode, oldParent: oldParent, newParent: newParent });

            this.fxTree.queueRefresh();
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
}
