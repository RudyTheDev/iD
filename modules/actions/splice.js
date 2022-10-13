import { actionConnect } from './connect';
import { actionSplit } from "./split";
import { actionDeleteWay } from './delete_way';


export function actionSplice(cutoutWayID, parentWayID) {


    var action = function(graph) {

        var sharedNodes = getSharedNodes(graph);

        console.log("splitting " + sharedNodes);

        var split = actionSplit(sharedNodes)

        graph = split(graph);

        var createdWayIds = split.getCreatedWayIDs(); // todo: I had to add this function - is there already a way to get it?

        console.assert(createdWayIds.length === 1);

        console.log("split result created way ids " + createdWayIds);

        // todo: follow temp

        console.log("following");

        graph = followCutLine(graph, parentWayID, cutoutWayID);
        graph = followCutLine(graph, createdWayIds[0], cutoutWayID);

        console.log("deleting temp way");

        graph = actionDeleteWay(cutoutWayID)(graph);

        console.log("done");

        return graph;


        function getSharedNodes(graph) {

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
    };


    action.disabled = function(graph) {

        // todo: cutout line must be unclosed
        // todo: cutout line must have 2+ nodes
        // todo: cutout line must be empty - must have no tags and nodes must have no tags and it must not be a relation member
        // todo: cutout line's starting and ending nodes need to be on (shared with) and only on the parent way
        // todo: no other cutout line node can be connected to anything
        // todo: cutout nodes cannot be consecutive nodes in parent way (i.e. cannot be a parent's edge)
        // todo: cutout nodes must be inside the parent area

        //return 'not_eligible';

        // return actionConnect(nodeIDs).disabled(graph);

        return false;
    };


    return action;
}
