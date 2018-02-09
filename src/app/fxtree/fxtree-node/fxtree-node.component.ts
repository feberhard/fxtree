import {
    Component, OnInit, Input, ViewEncapsulation, HostBinding, EventEmitter, Output, ViewChildren
} from '@angular/core';

import { FxTreeNodeInternal } from '../model';
import { ContentNode } from '../fxtree.component';
import { FxTreeUtil } from '../util';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'fxtree-node',
    templateUrl: './fxtree-node.component.html',
    styleUrls: ['./fxtree-node.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class FxTreeNodeComponent implements OnInit {

    @Input() public contentNode: ContentNode;
    @Input() public nodeHeight = 24;
    @Output() public requestRefresh = new EventEmitter<void>();

    @HostBinding('class.fxtree-node') fxTreeNodeClass = true;
    @HostBinding('class.fxtree-node-expanded') fxTreeNodeExpandedClass = false;
    @HostBinding('class.fxtree-node-collapsed') fxTreeNodeCollapsedClass = false;

    constructor() {
    }

    ngOnInit(): void {
        if (this.contentNode.node) {
            const node = this.contentNode.node;
            this.fxTreeNodeExpandedClass = node.children && node.children.length > 0 && node._fxtree.expanded;
            this.fxTreeNodeCollapsedClass = node.children && node.children.length > 0 && !node._fxtree.expanded;
        }
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

        this.requestRefresh.emit();
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
