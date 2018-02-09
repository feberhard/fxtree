import { Host, Directive, Output, EventEmitter } from '@angular/core';

import { FxTreeComponent } from '../fxtree.component';
import { FxTreeNodeInternal, FxTreePreNodeContentEventData, FxTreeNode, FxTreeNodeMovedEventData } from '../model';
import { FxTreeUtil } from '../util';
import { CascadeStrategy } from '../enum';

@Directive({
    selector: '[fxTreeCheckbox]',
})
export class FxTreeCheckboxDirective {

    @Output() public checkedChanged = new EventEmitter<void>();

    constructor(
        @Host() private fxTree: FxTreeComponent
    ) {
        this.fxTree.beforeNodeContentInsert.subscribe(
            (data: FxTreePreNodeContentEventData) => this.initCheckbox(data.node, data.nodeContentWrapperDiv));

        // this.fxTree.beforeNodeMoved.subscribe(
        //     (data: FxTreeNodeMovedEventData) => {
        //         this.handleNodeRemoveBefore(data.node);
        //     });

        this.fxTree.afterNodeMoved.subscribe(
            (data: FxTreeNodeMovedEventData) => {
                this.handleNodeRemoveAfter(data.node, data.oldParent);
                this.handleNodeInsert(data.node);
            });

        // TODO: handle move of undetermined node
    }

    public initCheckbox(node: FxTreeNodeInternal, nodeContentWrapperDiv: HTMLDivElement) {
        if (!this.fxTree.enableCheckbox) {
            return;
        }
        const checkboxIcon = document.createElement('i');
        checkboxIcon.classList.add('fxtree-checkbox');

        if (node._fxtree.checked) {
            checkboxIcon.classList.add('fxtree-checked');
        }
        if (node._fxtree.indeterminate) {
            checkboxIcon.classList.add('fxtree-indeterminate');
        }

        checkboxIcon.addEventListener('click', () => {
            this.toggleCheckbox(node);
            this.fxTree.refresh();
        });

        nodeContentWrapperDiv.appendChild(checkboxIcon);

        // TODO: drag/drop cascade checkbox
        // TODO: keep structural tree changes in FxTreeComponent e.g. insert-/removeNode
    }

    public shouldCascadeDown() {
        return this.fxTree.cascadeStrategy === CascadeStrategy.Down || this.fxTree.cascadeStrategy === CascadeStrategy.UpAndDown;
    }

    public cascadeDown(node: FxTreeNodeInternal) {
        // Also check/uncheck all children
        if (!this.shouldCascadeDown()) {
            return;
        }
        FxTreeUtil.forAll(node, (n) => {
            n._fxtree.checked = node._fxtree.checked;
            n._fxtree.indeterminate = false;
        });
    }

    public shouldCascadeUp() {
        return this.fxTree.cascadeStrategy === CascadeStrategy.Up || this.fxTree.cascadeStrategy === CascadeStrategy.UpAndDown;
    }

    public cascadeUp(node: FxTreeNodeInternal) {
        // If node is checked set all parents as indeterminate (when is useIndeterminate = true),
        // unless all children are checked, than set the parent also as checked
        // If node is unchecked, set all parents as unchecked,
        // unless a child is checked, than set the parent as indeterminate (when is useIndeterminate = true)
        if (!this.shouldCascadeUp()) {
            return;
        }
        if (!node._fxtree.checked) { // Node unchecked
            FxTreeUtil.forAll(node._fxtree.parent, (parent) => {
                if (parent._fxtree.checked || parent._fxtree.indeterminate) {
                    parent._fxtree.checked = false;
                    if (this.fxTree.useIndeterminate) {
                        // Check if now all children are unchecked, if not, keep parent.indeterminate = true
                        const isAChildChecked = parent.children && parent.children.some(c => FxTreeUtil.forAll(c, (child) => {
                            if (child._fxtree.checked) {
                                return false;
                            }
                        }) === false);
                        parent._fxtree.indeterminate = isAChildChecked;
                    }
                }
            }, (n) => n._fxtree.parent);
        } else { // Node checked
            FxTreeUtil.forAll(node._fxtree.parent, (parent) => {
                // Check if now all children are checked, if not, keep parent.indeterminate = true
                const notAllChildrenChecked = !parent.children || parent.children.some(c => FxTreeUtil.forAll(c, (child) => {
                    if (!child._fxtree.checked || child._fxtree.indeterminate) {
                        return false;
                    }
                }) === false);
                if (!notAllChildrenChecked) { // All children are now checked
                    parent._fxtree.checked = true;
                }
                if (this.fxTree.useIndeterminate) {
                    parent._fxtree.indeterminate = notAllChildrenChecked;
                }
            }, (n) => n._fxtree.parent);
        }
    }

    public shouldCascadeIndeterminate() {
        return this.fxTree.cascadeStrategy === CascadeStrategy.None && this.fxTree.useIndeterminate === true;
    }

    public cascadeIndeterminate(node: FxTreeNodeInternal) {
        // If node is checked but not all children are checked, set indeterminate = true
        // Also update indeterminate state of parents
        if (!this.shouldCascadeIndeterminate()) {
            return;
        }
        if (!node._fxtree.checked) { // Node unchecked
            node._fxtree.indeterminate = false;
            FxTreeUtil.forAll(node._fxtree.parent, (n) => {
                if (n._fxtree.checked) {
                    // Not all children are checked anymore
                    n._fxtree.indeterminate = true;
                }
            }, (n) => n._fxtree.parent);
        } else { // Node checked
            FxTreeUtil.forAll(node, (parent) => {
                if (parent._fxtree.checked) {
                    // Check if now all children are checked, if not, keep parent.indeterminate = true
                    const notAllChildrenChecked = parent.children && parent.children.some(c => FxTreeUtil.forAll(c, (child) => {
                        if (!child._fxtree.checked || child._fxtree.indeterminate) {
                            return false;
                        }
                    }) === false);
                    parent._fxtree.indeterminate = notAllChildrenChecked;
                }
            }, (n) => n._fxtree.parent);
        }
    }

    public cascade(node: FxTreeNodeInternal) {
        this.cascadeDown(node);
        this.cascadeUp(node);
        this.cascadeIndeterminate(node);
    }

    public toggleCheckbox(node: FxTreeNodeInternal) {
        node._fxtree.checked = !node._fxtree.checked;
        this.cascade(node);
        this.checkedChanged.emit();
    }

    public getCheckedNodeList(): FxTreeNodeInternal[] {
        const checkedNodes: FxTreeNodeInternal[] = [];
        this.fxTree.forAll(node => {
            if (node._fxtree.checked) {
                checkedNodes.push(node);
            }
        });
        return checkedNodes;
    }

    public getCheckedNodeTree(): FxTreeNode[] {
        const checkedNodes =
            this.fxTree.data
                .map(n => this.getCheckedNodeTreeRecursive(n))
                .filter(n => n != null);
        return checkedNodes;
    }

    private getCheckedNodeTreeRecursive(node: FxTreeNodeInternal, parentChecked: boolean = false): FxTreeNode {
        const nodeChecked = node._fxtree.checked;
        let checkedChildren: FxTreeNode[];
        if (node.children != null) {
            const children = node.children.map(n => this.getCheckedNodeTreeRecursive(n, nodeChecked));
            checkedChildren = children.filter(c => c != null);
        }
        if (parentChecked
            || nodeChecked
            || (checkedChildren != null && checkedChildren.length > 0)
        ) {
            return {
                text: node.text,
                children: checkedChildren
            };
        }
        return null;
    }

    private handleNodeInsert(node: FxTreeNodeInternal) {
        // TODO: also check all dragged child nodes
        this.cascadeUp(node);
        this.cascadeIndeterminate(node);
    }

    // private handleNodeRemoveBefore(node: FxTreeNodeInternal) {
    //     if (node._fxtree.checked) {
    //         // checked, parent, indeterminate
    //         node._fxtree.checked = false;
    //         this.cascadeUp(node);
    //         this.cascadeIndeterminate(node);
    //         node._fxtree.checked = true;
    //         return;
    //     }
    // }

    private isNodeOrChildChecked(node: FxTreeNodeInternal) {
        const notNodeOrChildChecked = FxTreeUtil.forAll(node, (n) => {
            if (n._fxtree.checked) {
                return false;
            }
        });
        return notNodeOrChildChecked === false;
    }

    private handleNodeRemoveAfter(node: FxTreeNodeInternal, oldParent: FxTreeNodeInternal) {
        // If at least one of the dragged was checked,
        // check indeterminate parents if still at least one child is checked, otherwise set indeterminate = false
        if (this.isNodeOrChildChecked(node)) {
            this.cascadeUp(oldParent); // TODO: handle oldParent as checked changed
        }

        // If not all dragged nodes were checked,
        // check indeterminate parents if still at least one child is not checked, otherwise set indeterminate = false
        // if (this.isNodeOrChildChecked(node) && oldParent.children.length === 0) {
        //     this.cascadeIndeterminate(oldParent); // TODO: handle oldParent as checked changed
        // }


        // // When uncheck node is removed check if now all children of previous parent are checked
        // if (!node._fxtree.checked && oldParent.children.length > 0) {
        //     // Parent had more than one child
        //     if (!oldParent.children.some(n => !n._fxtree.checked)) {
        //         // Now all children are checked

        //         if (this.shouldCascadeUp()) {
        //             oldParent._fxtree.checked = true;
        //             oldParent._fxtree.indeterminate = false;
        //             this.cascadeUp(oldParent);
        //         }

        //         if (this.shouldCascadeIndeterminate()) {
        //             oldParent._fxtree.indeterminate = false;
        //             this.cascadeIndeterminate(oldParent);
        //         }
        //     }
        // }
    }
}

