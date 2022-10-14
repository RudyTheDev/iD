import {t} from '../core/localizer';

import {actionSplice} from '../actions/splice';

import {behaviorOperation} from '../behavior/operation';
import {modeSelect} from '../modes/select';


export function operationSplice(context, selectedIDs) {

    var _action = getAction();


    function getAction() {

        return actionSplice(selectedIDs);
    }


    var operation = function() {

        if (operation.disabled()) return;

        context.perform(_action, operation.annotation());

        context.validator().validate();

        context.enter(modeSelect(context, _action.getResultingWayIds()));
    };


    operation.available = function() {

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

            return true;

        } else if (selectedIDs.length === 1) {

            // See if the selected entity is a way that forms a cut line for an area

            let entity = graph.entity(selectedIDs[0]);
            if (entity.type !== 'way') return false;

            if (entity.isClosed()) return false;

            let startNode = graph.entity(entity.nodes[0]);
            let endNode = graph.entity(entity.nodes[entity.nodes.length - 1]);

            // todo: allow other way connections, i.e. if we connect borders of exactly 1 area regardless what else we connect to

            let startParents = graph.parentWays(startNode);
            if (startParents.length !== 2) return false;

            let endParents = graph.parentWays(endNode);
            if (endParents.length !== 2) return false;

            let parent = startParents[0] === entity ? startParents[1] : startParents[0];

            if (parent !== endParents[0] && parent != endParents[1]) return false;

            if (!parent.isClosed()) return false;

            // Cut line cannot be an edge of the parent area
            if (entity.nodes.length === 2 && parent.areAdjacent(startNode, endNode)) return false;

            return true;

        } else {
            return false;
        }
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
