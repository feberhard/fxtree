import { Host, Directive } from '@angular/core';

import { FxTreeComponent } from '../fxtree.component';
import { FxTreeNodeInternal, FxTreePreNodeContentEventData } from '../model';
import { FxTreeUtil } from '../util';

@Directive({
    selector: '[fxTreeCollapse]',
})
export class FxTreeCollapseDirective {

    constructor( @Host() private fxTree: FxTreeComponent) {
        console.log(fxTree);
        this.fxTree.beforeNodeContentInsert.subscribe(
            (data: FxTreePreNodeContentEventData) => this.initExpander(data.node, data.nodeContentWrapperDiv));
    }

    public initExpander(node: FxTreeNodeInternal, nodeContentWrapperDiv: HTMLDivElement) {
        const childrenExpanderWrapperSpan = document.createElement('span');
        childrenExpanderWrapperSpan.classList.add('fxtree-children-expander-wrapper');
        childrenExpanderWrapperSpan.onclick = () => {
            this.toggleNode(node);
            this.fxTree.refresh();
        };

        const childrenExpanderSpan = document.createElement('span');
        childrenExpanderSpan.classList.add('fxtree-children-expander');
        childrenExpanderWrapperSpan.appendChild(childrenExpanderSpan);
        nodeContentWrapperDiv.appendChild(childrenExpanderWrapperSpan);
    }

    public toggleNode(node: FxTreeNodeInternal) {
        node._fxtree.expanded = !node._fxtree.expanded;
        const oldChildCount = node._fxtree.currentChildCount;
        if (!node._fxtree.expanded) {
            node._fxtree.currentChildCount = 0;
        } else {
            node._fxtree.currentChildCount = this.countExpandedChildren(node);
        }
        FxTreeUtil.updateParentsChildCount(node, node._fxtree.currentChildCount - oldChildCount);
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
}
