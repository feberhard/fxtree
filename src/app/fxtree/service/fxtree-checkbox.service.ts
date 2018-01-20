import { Injectable } from '@angular/core';

import { FxTreeComponent } from '../fxtree.component';
import { FxTreeNodeInternal } from '../model';
import { FxTreeUtil } from '../util';
import { CascadeStrategy } from '../enum';

@Injectable()
export class FxTreeCheckboxService {
    private fxTree: FxTreeComponent;

    public init(fxTree: FxTreeComponent) {
        this.fxTree = fxTree;
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
        // TODO: get checked nodes
        // TODO: event: checked changed
    }

    public cascadeDown(node: FxTreeNodeInternal) {
        // Also check/uncheck all children

        FxTreeUtil.forAll(node, (n) => {
            n._fxtree.checked = node._fxtree.checked;
            n._fxtree.indeterminate = false;
        });
    }

    public cascadeUp(node: FxTreeNodeInternal) {
        // If node is checked set all parents as indeterminate (when is useIndeterminate = true),
        // unless all children are checked, than set the parent also as checked
        // If node is unchecked, set all parents as unchecked,
        // unless a child is checked, than set the parent as indeterminate (when is useIndeterminate = true)
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

    public cascadeIndeterminate(node: FxTreeNodeInternal) {
        // If node is checked but not all children are checked, set indeterminate = true
        // Also update indeterminate state of parents

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

    public toggleCheckbox(node: FxTreeNodeInternal) {
        node._fxtree.checked = !node._fxtree.checked;

        if (this.fxTree.cascadeStrategy === CascadeStrategy.Down || this.fxTree.cascadeStrategy === CascadeStrategy.UpAndDown) {
            this.cascadeDown(node);
        }

        if (this.fxTree.cascadeStrategy === CascadeStrategy.Up || this.fxTree.cascadeStrategy === CascadeStrategy.UpAndDown) {
            this.cascadeUp(node);
        }

        if (this.fxTree.cascadeStrategy === CascadeStrategy.None && this.fxTree.useIndeterminate === true) {
            this.cascadeIndeterminate(node);
        }
    }
}
