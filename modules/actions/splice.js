import { geoPathHasIntersections, geoPointInPolygon } from '../geo';

import { actionSplit } from './split';
import { actionDeleteWay } from './delete_way';

//
// For testing convenience, accepts an ID to assign to the new way.
// Normally, this will be undefined and the way will automatically
// be assigned a new ID.
export function actionSplice(selectedIDs, newWayIds) {

    var _resultingWayIds;

    var _disabledInternalReason;


    var action = function(graph) {

        var cutLineWayID;
        var parentWayID;

        if (selectedIDs.length === 2) {
            // The user has selected both the cutline and an area

            let ways = action.findCutLineAndArea(graph, selectedIDs); // 0 is cut line and 1 is parent area

            cutLineWayID = ways[0].id;
            parentWayID = ways[1].id;

        } else { // length === 1
            // The user has selected a cutline only that's in an area we can assume

            cutLineWayID = selectedIDs[0];

            let cutline = graph.entity(selectedIDs[0]);

            parentWayID = action.getSplicableAreaBetween(graph, cutline).id;
        }

        var way = graph.entity(parentWayID);

        var originalTags = way.tags;

        graph = graph.replace(way.update({ tags: [] }));

        var terminalNodes = getTerminalNodes(graph, cutLineWayID);

        var split = actionSplit(terminalNodes, newWayIds);
        split.limitWays([parentWayID]);

        graph = split(graph);

        var createdWayIds = split.getCreatedWayIDs();

        graph = followCutLine(graph, parentWayID, cutLineWayID);
        graph = followCutLine(graph, createdWayIds[0], cutLineWayID);

        graph = actionDeleteWay(cutLineWayID)(graph);

        graph = reapplyTags(graph, parentWayID, originalTags);
        graph = reapplyTags(graph, createdWayIds[0], originalTags);

        _resultingWayIds = [ parentWayID, createdWayIds[0] ];

        return graph;


        function followCutLine(graph, wayId, followedWayId) {
            // If we have a way 2-3-4-5-6 and we want to follow way 6-8-9-2, we will end up with 2-3-4-5-6-8-9-2

            var way = graph.entity(wayId);
            var followedWay = graph.entity(followedWayId);

            var appendableNodes = followedWay.nodes;
            if (way.nodes[0] === followedWay.nodes[0]) { // i.e. ways have opposite directions
                appendableNodes = appendableNodes.reverse();
            }

            for (let i = 1; i < appendableNodes.length; i++) {
                way = way.addNode(appendableNodes[i]);
            }

            return graph.replace(way);
        }


        function reapplyTags(graph, wayID, originalTags) {

            if (originalTags.length === 0)
                return; // nothing to copy

            var copiedTags = {};
            Object.keys(originalTags).forEach(function(key) { copiedTags[key] = originalTags[key]; });

            graph = graph.replace(graph.entity(wayID).update({ tags: copiedTags }));

            return graph;
        }
    };


    function getTerminalNodes(graph, cutLineWayID) {

        var cutLineWay = graph.entity(cutLineWayID);

        var node1 = cutLineWay.nodes[0];
        var node2 = cutLineWay.nodes[cutLineWay.nodes.length - 1];

        return [node1, node2];
    }


    action.getSplicableAreaBetween = function(graph, cutline) {

        let startNode = graph.entity(cutline.nodes[0]);
        let endNode = graph.entity(cutline.nodes[cutline.nodes.length - 1]);

        let startParents = graph.parentWays(startNode);
        if (startParents.length === 1) return null; // just the cutline

        let endParents = graph.parentWays(endNode);
        if (endParents.length === 1) return null; // just the cutline

        // Find a (single) area that the cutline could unambiguously splice

        let parent = null;

        for (let i = 0; i < startParents.length; i++) {

            if (startParents[i] === cutline) continue;

            if (!startParents[i].isClosed()) continue; // ignoring open ways

            if (!endParents.includes(startParents[i])) continue;

            if (parent !== null) return null; // multiple splicable areas - ambiguous

            parent = startParents[i];
        }

        if (parent === null) return null;

        // Cut line cannot be an edge of the parent area
        if (cutline.nodes.length === 2 && parent.areAdjacent(startNode, endNode)) return null;

        return parent;
    };


    action.getResultingWayIds = function () {
        return _resultingWayIds;
    };

    action.disabledInternalReason = function () {
        return _disabledInternalReason;
    };

    // Returns a two-element array: the cutout line and parent area
    action.findCutLineAndArea = function(graph, selectedIDs) {
        var entity1 = graph.hasEntity(selectedIDs[0]);
        var entity2 = graph.hasEntity(selectedIDs[1]);

        if (entity1.isClosed()) {
            return [entity2, entity1];
        } else {
            return [entity1, entity2];
        }
    };


    action.disabled = function(graph) {
        var cutLineWay;
        var parentWay;

        if (selectedIDs.length === 2) {
            // The user has selected both the cutline and an area

            let ways = action.findCutLineAndArea(graph, selectedIDs); // 0 is cut line and 1 is parent area

            cutLineWay = ways[0];
            parentWay = ways[1];

        } else { // length === 1
            // The user has selected a cutline that's in an area

            cutLineWay = graph.entity(selectedIDs[0]);

            parentWay = action.getSplicableAreaBetween(graph, cutLineWay); // expected to exist if operation allowed action with 1 way
        }


        if (cutLineWay.hasInterestingTags()) return 'cutline_tagged';

        if (graph.parentRelations(cutLineWay).length > 0) return 'cutline_in_relation';

        let parentPolygonCoords = parentWay.nodes.map(function(node) { return graph.entity(node).loc; });

        for (let i = 1; i < cutLineWay.nodes.length - 1; i++) {
            // Note that we don't care about first and last node - they won't be removed or changed

            let node = graph.entity(cutLineWay.nodes[i]);

            if (node.hasInterestingTags()) return 'cutline_nodes_tagged';

            if (graph.parentRelations(node).length > 0) return 'cutline_nodes_in_relation';

            if (graph.isShared(node)) {
                if (graph.parentWays(node).includes(parentWay)) {
                    return 'cutline_multiple_connection';
                } else {
                    return 'cutline_connected_to_other';
                }
            }

            if (!geoPointInPolygon(node.loc, parentPolygonCoords)) return 'cutline_outside_area';
        }

        // Check that the cut won't intersect other members of the parent's relation,
        // for example, an inner hole of an area.

        let parentRelations = graph.parentRelations(parentWay);

        if (parentRelations.length > 0) {

            let cutlineCoords = cutLineWay.nodes.map(function(node) { return graph.entity(node).loc; });

            for (let i = 0; i < parentRelations.length; i++) {

                if (!parentRelations[i].isMultipolygon()) continue;

                let relationMembers = parentRelations[i].members;

                for (let i = 0; i < relationMembers.length; i++) {

                    if (relationMembers[i].id === parentWay.id) continue;

                    if (relationMembers[i].type !== 'way') continue;

                    let member = graph.hasEntity(relationMembers[i]);
                    if (!member) return 'area_member_not_downloaded';

                    let memberCoords = member.nodes.map(function(node) { return graph.entity(node).loc; });

                    if (geoPathHasIntersections(cutlineCoords, memberCoords)) return 'cutline_intersects_inner_members';
                }
            }
        }

        // At this point, our own checks are good to go,
        // but we rely on split action internally, so check that we can actually split

        var terminalNodes = getTerminalNodes(graph, cutLineWay.id);

        var split = actionSplit(terminalNodes, newWayIds);
        split.limitWays([parentWay.id]);

        var splitDisabled = split.disabled(graph);

        if (splitDisabled) {
            // We make no assumptions when split is available - if it fails, then so do we.
            // But we can provide the internal reason for the user.
            _disabledInternalReason = 'operations.split.' + splitDisabled;
            return 'cannot_split_area';
        }

        return false;
    };


    return action;
}
