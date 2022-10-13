import { actionConnect } from './connect';
import { actionSplit } from "./split";
import { actionJoin } from "./join";
import { actionDeleteWay } from './delete_way';


export function actionSplice(selectedIDs) {


    var action = function(graph) {

        var ways = action.findCutLineAndArea(graph, selectedIDs); // 0 is cut line and 1 is parent area

        var cutLineWayID = ways[0].id;
        var parentWayID = ways[1].id;


        console.log("detagging");

        // todo: only if tagged

        var way = graph.entity(parentWayID);

        var originalTags = way.tags;

        console.log("original tags were " + originalTags);

        graph = graph.replace(way.update({ tags: [] }));

        var sharedNodes = getSharedNodes(graph, cutLineWayID);

        console.log("splitting " + sharedNodes);

        var split = actionSplit(sharedNodes)

        graph = split(graph);

        var createdWayIds = split.getCreatedWayIDs();

        console.log("split result created way ids " + createdWayIds);

        console.assert(createdWayIds.length >= 1 && createdWayIds.length <= 2);

        var splitWay1Id;
        var splitWay2Id;

        if (createdWayIds.length === 2) {
            // Because split action is unpredicatable and can create 3 ways even though we gave it 2 points,
            // we sometimes need to recombine the "double-split" way back into a single way.

            console.log("combining one of double-split ways from " + parentWayID + ", " + createdWayIds[0] + " and " + createdWayIds[1]);

            var recombination = recombine(graph, parentWayID, createdWayIds[0], createdWayIds[1], sharedNodes);

            graph = recombination.graph;
            splitWay1Id = recombination.ways[0];
            splitWay2Id = recombination.ways[1];

        } else {
            splitWay1Id = parentWayID;
            splitWay2Id = createdWayIds[0];
        }

        console.log("final split ways are " + splitWay1Id + " and " + splitWay2Id);

        console.log("following");

        graph = followCutLine(graph, splitWay1Id, cutLineWayID);
        graph = followCutLine(graph, splitWay2Id, cutLineWayID);

        console.log("deleting temp way");

        graph = actionDeleteWay(cutLineWayID)(graph);

        console.log("retagging both new ways");

        graph = reapplyTags(graph, splitWay1Id, originalTags);
        graph = reapplyTags(graph, splitWay2Id, originalTags);

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


        function recombine(graph, way1Id, way2Id, way3Id, terminalNodes) {
            var way1 = graph.entity(way1Id);
            var way2 = graph.entity(way2Id);
            //var way3 = graph.entity(way3Id);

            // See which way is not broken, that is, has the start and end nodes.
            // The other two ways will be joined into one way.

            var joinableWay1Id;
            var joinableWay2Id;
            var completeWayId;

            if (way1.contains(terminalNodes[0]) && way1.contains(terminalNodes[1])) {
                joinableWay1Id = way2Id;
                joinableWay2Id = way3Id;
                completeWayId = way1Id;
            } else if (way2.contains(terminalNodes[0]) && way2.contains(terminalNodes[1])) {
                joinableWay1Id = way1Id;
                joinableWay2Id = way3Id;
                completeWayId = way2Id;
            } else { // must be the third one
                joinableWay1Id = way1Id;
                joinableWay2Id = way2Id;
                completeWayId = way3Id;
            }

            var join = actionJoin([ joinableWay1Id, joinableWay2Id ]);
            graph = join(graph);

            var remainingWayId = graph.hasEntity(joinableWay1Id) ? joinableWay1Id : joinableWay2Id
            // todo: add getting of survivor from join action instead

            return {
                graph: graph,
                ways: [ completeWayId, remainingWayId ]
            };
        }
    };


    // Returns a two-element array: the cutout line and parent area
    action.findCutLineAndArea = function chooseCutoutAndArea(graph, selectedIDs) {

        console.assert(selectedIDs.length === 2);

        var entity1 = graph.hasEntity(selectedIDs[0]);
        var entity2 = graph.hasEntity(selectedIDs[1]);

        if (entity1.isClosed())
            return [entity2, entity1];
        else
            return [entity1, entity2];
    }


    action.disabled = function(graph) {

        var ways = this.findCutLineAndArea(graph, selectedIDs); // 0 is cut line and 1 is parent area

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
