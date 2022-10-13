import { actionConnect } from './connect';
import { actionSplit } from "./split";
import { actionDeleteWay } from './delete_way';


export function actionSplice(selectedIDs) {


    var action = function(graph) {

        var ways = action.chooseCutoutAndArea(graph, selectedIDs); // 0 is cut line and 1 is parent area

        var cutoutWayID = ways[0].id;
        var parentWayID = ways[1].id;


        console.log("detagging");

        // todo: only if tagged

        var way = graph.entity(parentWayID);

        var originalTags = way.tags;

        console.log("original tags were " + originalTags);

        graph = graph.replace(way.update({ tags: [] }));

        var sharedNodes = getSharedNodes(graph, cutoutWayID);

        console.log("splitting " + sharedNodes);

        var split = actionSplit(sharedNodes)

        graph = split(graph);

        var createdWayIds = split.getCreatedWayIDs();

        console.assert(createdWayIds.length === 1);

        console.log("split result created way ids " + createdWayIds);

        console.log("following");

        graph = followCutLine(graph, parentWayID, cutoutWayID);
        graph = followCutLine(graph, createdWayIds[0], cutoutWayID);

        console.log("deleting temp way");

        graph = actionDeleteWay(cutoutWayID)(graph);

        console.log("retagging both new ways");

        graph = reapplyTags(graph, parentWayID, originalTags);
        graph = reapplyTags(graph, createdWayIds[0], originalTags);

        console.log("done");

        return graph;


        function getSharedNodes(graph, cutoutWayID) {

            // todo: learn to fail so we can use this to validate

            var cutoutWay = graph.entity(cutoutWayID);

            var node1 = cutoutWay.nodes[0];
            var node2 = cutoutWay.nodes[cutoutWay.nodes.length - 1];

            return [node1, node2];
        }


        function followCutLine(graph, wayId, followedWayId) {

            // todo: make this into a separate action?

            // If we have a way 2-3-4-5-6 and we want to follow way 6-8-9-2, we will end up with 2-3-4-5-6-8-9-2

            var way = graph.entity(wayId);
            var followedWay = graph.entity(followedWayId);

            console.log("following " + way + " along " + followedWay);

            console.log("way nodes are " + way.nodes);


            var appendableNodes = followedWay.nodes;

            if (way.nodes[0] === followedWay.nodes[0]) { // i.e. ways have opposite directions
                appendableNodes = appendableNodes.reverse();
            }

            console.log("following nodes " + appendableNodes);

            for (let i = 1; i < appendableNodes.length; i++) {
                way = way.addNode(appendableNodes[i]);

                console.log("added " + appendableNodes[i] + " to way and nodes are now " + way.nodes);
            }

            console.log("way nodes are now " + way.nodes);

            return graph.replace(way);
        }


        function reapplyTags(graph, wayID, originalTags) {

            var copiedTags = {};
            Object.keys(originalTags).forEach(function(key) { copiedTags[key] = originalTags[key]; });
            // todo: I must be doing this wrong, but I looked but couldn't find a place were iD clones tags

            graph = graph.replace(graph.entity(wayID).update({ tags: copiedTags }));

            return graph;
        }
    };


    // Returns a two-element array: the cutout line and parent area
    action.chooseCutoutAndArea = function chooseCutoutAndArea(graph, selectedIDs) {

        console.assert(selectedIDs.length === 2);

        var entity1 = graph.hasEntity(selectedIDs[0]);
        var entity2 = graph.hasEntity(selectedIDs[1]);

        if (entity1.isClosed())
            return [entity2, entity1];
        else
            return [entity1, entity2];
    }


    action.disabled = function(graph) {

        var ways = this.chooseCutoutAndArea(graph, selectedIDs); // 0 is cut line and 1 is parent area

        var cutoutWay = ways[0];
        var parentWay = ways[1];

        if (cutoutWay.hasInterestingTags()) return 'not_eligible';

        // todo: cutout line nodes must have no tags and it must not be a relation member
        // todo: cutout line must not be a relation member
        // todo: cutout nodes must be inside the parent area

        return false;
    };


    return action;
}
