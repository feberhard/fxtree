import { FxTreeNode } from './fxtree-node';
import { FxTreeInternalData } from './fxtree-node-internal-data';

export interface FxTreeNodeInternal extends FxTreeNode {
    _fxtree: FxTreeInternalData;
    children: FxTreeNodeInternal[];
}
