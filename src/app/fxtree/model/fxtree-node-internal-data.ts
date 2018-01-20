import { FxTreeNodeInternal } from './fxtree-node-internal';

export interface FxTreeInternalData {
    expanded: boolean;
    level: number;
    index: number;
    parent: FxTreeNodeInternal;

    currentChildCount?: number; // current displayed children (expanded/collapsed)
    totalChildCount?: number; // total number of children (expanded)

    checked?: boolean;
    indeterminate?: boolean;
    selected?: boolean;
}
