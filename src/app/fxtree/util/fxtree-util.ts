import { FxTreeNodeInternal } from '../model';

export class FxTreeUtil {
    public static forAll(
        node: FxTreeNodeInternal,
        action: (node: FxTreeNodeInternal) => void | boolean,
        nextSelector?: (node: FxTreeNodeInternal) => FxTreeNodeInternal[] | FxTreeNodeInternal
    ): void | boolean {
        // Apply the action to all nodes provided by the nextSelector as long as the action doesn't return false

        if (node == null) {
            return true;
        }

        let result = action(node);

        if (result === false) {
            return false;
        }

        result = true;

        if (nextSelector == null) {
            nextSelector = (n) => n.children;
        }

        const next = nextSelector(node);
        if (next != null) {
            if (Array.isArray(next)) {
                // Apply action as long as it doesn't return false
                result = !next.some(n => this.forAll(n, action, nextSelector) === false);
            } else {
                result = result && this.forAll(next, action, nextSelector);
            }
        }

        return result;
    }

    public static isParentOf(possibleParent: FxTreeNodeInternal, possibleChild: FxTreeNodeInternal) {
        let parent: FxTreeNodeInternal = possibleChild;
        while (parent = parent._fxtree.parent) {
            if (parent === possibleParent) {
                return true;
            }
        }
        return false;
    }

    public static updateParentsChildCount(node: FxTreeNodeInternal, childCountChange: number) {
        let parent: FxTreeNodeInternal = node;
        while (parent = parent._fxtree.parent) {
            parent._fxtree.currentChildCount += childCountChange;
        }
    }

    public static updateLevel(node: FxTreeNodeInternal): any {
        FxTreeUtil.forAll(node, n => {
            n._fxtree.level = n._fxtree.parent._fxtree.level + 1;
        });
    }
}
