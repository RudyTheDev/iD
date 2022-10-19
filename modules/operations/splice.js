import {t} from '../core/localizer';

import {actionSplice} from '../actions/splice';

import {behaviorOperation} from '../behavior/operation';
import {modeSelect} from '../modes/select';


export function operationSplice(context, selectedIDs) {

    var _action = getAction();

    var _cutlineId;
    var _areaId;
    var _extent;


    function getAction() {
        return actionSplice(selectedIDs);
    }


    var operation = function() {

        if (operation.disabled()) return;

        context.perform(_action, operation.annotation());

        context.validator().validate();

        // Select the new areas so the user can immediately work with them
        context.enter(modeSelect(context, _action.getResultingWayIds()));
    };


    operation.available = function() {

        // Splicing operation is shown when the user selects something
        // that resembles a spicable setup - a line within an area

        if (selectedIDs.length > 2) {
            // More than 2 ways would be ambiguous and we don't support "multi-splicing"
            return false;
        }

        var graph = context.graph();

        if (selectedIDs.length === 2) {
            // Selected entities must be 2 ways - cut line within an area

            let entity1 = graph.entity(selectedIDs[0]);
            if (entity1.type !== 'way') return false;

            let entity2 = graph.entity(selectedIDs[1]);
            if (entity2.type !== 'way') return false;

            // One way must be open (cut line) and one must closed (parent area to be cut)

            let way1Closed = entity1.isClosed();
            let way2Closed = entity2.isClosed();
            if (way1Closed && way2Closed || !way1Closed && !way2Closed) return false;


            var ways = _action.findCutLineAndArea(graph, selectedIDs); // 0 is cut line and 1 is parent area

            let startNode = ways[0].nodes[0];
            let endNode = ways[0].nodes[ways[0].nodes.length - 1];

            // Cut line must start and end on the parent area's outline
            if (!ways[1].contains(startNode)) return false;
            if (!ways[1].contains(endNode)) return false;

            // Cut line cannot be an edge of the parent area
            if (ways[0].nodes.length === 2 && ways[1].areAdjacent(startNode, endNode)) return false;

            _cutlineId = ways[0].id;
            _areaId = ways[1].id;

        } else if (selectedIDs.length === 1) {
            // See if the selected entity is a way that forms a cut line for an area

            let entity = graph.entity(selectedIDs[0]);
            if (entity.type !== 'way') return false;

            if (entity.isClosed()) return false;

            let parent = _action.getSplicableAreaBetween(graph, entity);

            if (parent === null) return false;

            _cutlineId = entity.id;
            _areaId = parent.id;

        }

        _extent = graph.entity(_cutlineId).extent(graph);

        return true;
    };

    operation.relatedEntityIds = function() {
        return [_cutlineId, _areaId];
    };

    operation.disabled = function() {

        if (_extent.percentContainedIn(context.map().extent()) < 0.8) return 'too_large';

        var actionDisabled = _action.disabled(context.graph());
        if (actionDisabled) return actionDisabled;

        if (selectedIDs.some(context.hasHiddenConnections)) return 'connected_to_hidden';

        return false;
    };

    operation.tooltip = function() {
        var disabled = operation.disabled();
        if (disabled) {
            let internalReason = _action.disabledInternalReason();
            if (internalReason) {
                return t.append('operations.splice.' + disabled + '_annotated', { annotation: t(internalReason) });
            } else {
                return t.append('operations.splice.' + disabled);
            }
        } else {
            return t.append('operations.splice.description');
        }
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
