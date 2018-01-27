import { Injectable } from '@angular/core';

import { FxTreeComponent } from '../fxtree.component';
import { FxTreeNodeInternal, FxTreePreNodeContentEventData } from '../model';
import { FxTreeUtil } from '../util';

@Injectable()
export class FxTreeDragDropService {
    public static dragData: FxTreeNodeInternal;

    private fxTree: FxTreeComponent;
    private lastDragoverY: number;

    public static setDragData(node: FxTreeNodeInternal) {
        FxTreeDragDropService.dragData = node;
    }

    public init(fxTree: FxTreeComponent) {
        this.fxTree = fxTree;
        this.fxTree.preNodeContentInsert.subscribe(
            (data: FxTreePreNodeContentEventData) => this.initDragAndDrop(data.node, data.nodeContentDiv, data.nodeContentWrapperDiv));
    }

    public initDragAndDrop(node: FxTreeNodeInternal, nodeContentDiv: HTMLDivElement, nodeContentWrapperDiv: HTMLDivElement) {
        nodeContentDiv.draggable = true;
        nodeContentDiv.ondragstart = (e) => { FxTreeDragDropService.setDragData(node); };
        nodeContentDiv.ondragover = (e) => {
            // Don't allow drag to own node or parent to child node
            if (node !== FxTreeDragDropService.dragData && !FxTreeUtil.isParentOf(FxTreeDragDropService.dragData, node)) {
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
            const draggedNode = FxTreeDragDropService.dragData;

            let parentNode: FxTreeNodeInternal;
            let position: number;

            if (e.offsetY < this.fxTree.nodeHeight / 3) { // before
                position = node._fxtree.parent.children.indexOf(node);
                parentNode = node._fxtree.parent;
            } else if (e.offsetY > 2 * this.fxTree.nodeHeight / 3) { // after
                position = node._fxtree.parent.children.indexOf(node) + 1;
                parentNode = node._fxtree.parent;
            } else { // inside
                parentNode = node;
                position = 0;
            }

            if (draggedNode._fxtree.parent) {
                FxTreeUtil.updateParentsChildCount(draggedNode, -(draggedNode._fxtree.currentChildCount + 1));
                const childIndex = draggedNode._fxtree.parent.children.indexOf(draggedNode);
                draggedNode._fxtree.parent.children.splice(childIndex, 1);
            }

            parentNode.children = parentNode.children || [];
            parentNode.children.splice(position, 0, draggedNode);
            draggedNode._fxtree.parent = parentNode;
            FxTreeUtil.updateParentsChildCount(draggedNode, draggedNode._fxtree.currentChildCount + 1);

            this.fxTree.refresh();
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
