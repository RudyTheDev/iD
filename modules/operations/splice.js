import {t} from '../core/localizer';

import {actionSplice} from "../actions/splice";

import {behaviorOperation} from '../behavior/operation';
import {modeSelect} from '../modes/select';

export function operationSplice(context, selectedIDs) {

    var _action = getAction();

    function getAction() {

        // todo: which is which?
        var cutoutWayID = selectedIDs[0];
        var parentWayID = selectedIDs[1];

        return actionSplice(cutoutWayID, parentWayID);
    }

    var operation = function() {

        if (operation.disabled()) return;

        context.perform(_action, operation.annotation());

        context.validator().validate();

        var resultIDs = selectedIDs.filter(context.hasEntity);
        if (resultIDs.length > 1) {
            var interestingIDs = resultIDs.filter(function(id) {
                return context.entity(id).hasInterestingTags();
            });
            if (interestingIDs.length) resultIDs = interestingIDs;
        }
        context.enter(modeSelect(context, resultIDs));
    };

    operation.available = function() {
        return selectedIDs.length === 2;
    };

    operation.disabled = function() {

        var actionDisabled = _action.disabled(context.graph());
        if (actionDisabled) return actionDisabled;

        return false;
    };

    operation.tooltip = function() {
        var disabled = operation.disabled();
        if (disabled) {

            // TODO: REASON

            // if (disabled === 'conflicting_relations') {
            //     return t.append('operations.merge.conflicting_relations');
            // }

            return t.append('operations.splice.' + disabled);
        }
        return t.append('operations.splice.description');
    };

    operation.annotation = function() {
        return t('operations.splice.annotation', { n: selectedIDs.length });
    };

    operation.id = 'splice';
    operation.keys = [t('operations.splice.key')];
    operation.title = t.append('operations.splice.title');
    operation.behavior = behaviorOperation(context).which(operation);

    operation.icon = function() {
        return '#iD-operation-splice';
    };

    return operation;
}
