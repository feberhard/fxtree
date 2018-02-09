import { FxTreeNodeInternal } from '../fxtree-node-internal';

export interface FxTreeNodeMovedEventData {
    node: FxTreeNodeInternal;
    oldParent: FxTreeNodeInternal;
    newParent: FxTreeNodeInternal;
}
